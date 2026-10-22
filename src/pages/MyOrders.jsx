import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiPackage,
  FiCalendar,
  FiCreditCard,
  FiLoader,
  FiXCircle,
} from "react-icons/fi";
import {
  getMyOrders,
  cancelMyOrder,
  confirmDelivery as confirmDeliveryService,
} from "../services/orderService";
import ConfirmModal from "../components/ConfirmModal";
import { createReturnRequest, getOrderReturn, getMyReturns, getMyDisputes, openDispute } from "../services/storefrontService";
import { thumbUrl } from "../utils/cloudinaryUrl";
import ItemImage from "../components/ItemImage"; // FIX #12
import { toast } from "react-toastify"; // FIX #2: import toast

const statusColors = {
  pending: "bg-amber-100 text-amber-800 border border-amber-200",
  paid: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  processing: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  shipped: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  "delivery-claimed": "bg-amber-100 text-amber-800 border border-amber-200",
  delivered: "bg-green-100 text-green-800 border border-green-200",
  completed: "bg-teal-100 text-teal-800 border border-teal-200",
  cancelled: "bg-rose-100 text-rose-800 border border-rose-200",
};

const TABS = [
  { id: "all", label: "All" },
  { id: "topay", label: "To pay" },
  { id: "transit", label: "In transit" },
  { id: "delivered", label: "Delivered" },
  { id: "returns", label: "Returns" },
  { id: "cancelled", label: "Cancelled" },
];

// A "not received" report is allowed for shipped or seller-claimed packages,
// and for delivered packages within the report window (the server decides).
const REPORT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const idOf = (value) => String(value?._id || value || "");

function groupDisputes(list = []) {
  const map = {};
  list.forEach((d) => {
    const oid = idOf(d.order);
    if (oid) (map[oid] ||= []).push(d);
  });
  return map;
}

function reportablePackages(order, disputes = []) {
  if (!["shipped", "delivery-claimed", "delivered"].includes(order.status)) return [];
  const reported = new Set(disputes.map((d) => idOf(d.seller)));
  return (order.sellerFulfillments || [])
    .filter((f) => {
      if (reported.has(idOf(f.seller)) || f.payoutId) return false;
      if (["shipped", "delivery-claimed"].includes(f.status)) return true;
      if (f.status === "delivered") {
        const at = f.deliveredAt || order.deliveredAt;
        return Boolean(at) && Date.now() - new Date(at).getTime() <= REPORT_WINDOW_MS;
      }
      return false;
    })
    .map((f) => {
      const sid = idOf(f.seller);
      return {
        sellerId: sid,
        name: f.seller?.name || "Seller",
        items: (order.orderItems || []).filter((i) => idOf(i.seller) === sid).map((i) => i.name).filter(Boolean),
      };
    });
}

const DISPUTE_LABEL = {
  open: "Not-received report open",
  released: "Report closed: delivery confirmed",
  upheld: "Report upheld: refund in review",
};

function orderTab(order, returnsByOrderId) {
  if (returnsByOrderId[order._id]) return "returns";
  switch (order.status) {
    case "pending": return "topay";
    case "paid":
    case "processing":
    case "shipped":
    case "delivery-claimed": return "transit";
    case "delivered":
    case "completed": return "delivered";
    case "cancelled": return "cancelled";
    default: return "all";
  }
}

function OrderTimeline({ status }) {
  const steps = ["Placed", "Paid", "Shipped", "Delivered"];
  const current = { pending: 0, paid: 1, processing: 1, shipped: 2, "delivery-claimed": 2, delivered: 3, completed: 3 }[status] ?? 0;
  if (status === "cancelled") {
    return <p className="text-xs font-semibold text-rose-600">This order was cancelled.</p>;
  }
  return (
    <ol className="flex items-center" aria-label="Order progress">
      {steps.map((label, i) => (
        <li key={label} className="flex flex-1 items-center last:flex-none">
          <span className="flex flex-col items-center gap-1">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= current ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>{i < current ? "✓" : i + 1}</span>
            <span className={`text-[10px] font-semibold ${i <= current ? "text-emerald-700" : "text-gray-400"}`}>{label}</span>
          </span>
          {i < steps.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded ${i < current ? "bg-emerald-600" : "bg-gray-200"}`} />}
        </li>
      ))}
    </ol>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { addToCartLocal } = useContext(CartContext);
  const [tab, setTab] = useState("all");
  const [returnsByOrderId, setReturnsByOrderId] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellingId, setCancellingId] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState(null);

  const [returnFor, setReturnFor] = useState(null); // order being returned
  const [returnForm, setReturnForm] = useState({ reason: "", details: "" });
  const [returnBusy, setReturnBusy] = useState(false);
  const [returnByOrder, setReturnByOrder] = useState({});
  const [disputesByOrderId, setDisputesByOrderId] = useState({});
  const [disputeFor, setDisputeFor] = useState(null); // order being reported
  const [disputeSellerIds, setDisputeSellerIds] = useState([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeBusy, setDisputeBusy] = useState(false);

  useEffect(() => {
    getMyReturns()
      .then((res) => {
        const map = {};
        (res.data || []).forEach((r) => {
          const oid = r.order?._id || r.order;
          if (oid) map[oid] = r;
        });
        setReturnsByOrderId(map);
        setReturnByOrder((prev) => ({ ...map, ...prev }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getMyDisputes()
      .then((res) => setDisputesByOrderId(groupDisputes(res.data)))
      .catch(() => {});
  }, []);

  const openReportModal = (order) => {
    const packages = reportablePackages(order, disputesByOrderId[order._id]);
    setDisputeFor(order);
    setDisputeSellerIds(packages.length === 1 ? [packages[0].sellerId] : []);
    setDisputeReason("");
  };

  const submitDispute = async () => {
    if (!disputeFor || disputeSellerIds.length === 0) return;
    setDisputeBusy(true);
    try {
      await openDispute({ orderId: disputeFor._id, sellerIds: disputeSellerIds, reason: disputeReason.trim() });
      toast.success("Thanks. We have paused payment for that package while we look into it.");
      setDisputeFor(null);
      const res = await getMyDisputes();
      setDisputesByOrderId(groupDisputes(res.data));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send your report");
    } finally {
      setDisputeBusy(false);
    }
  };

  const openReturn = async (order) => {
    setReturnFor(order);
    setReturnForm({ reason: "", details: "" });
    try {
      const res = await getOrderReturn(order._id);
      if (res.data) setReturnByOrder((prev) => ({ ...prev, [order._id]: res.data }));
    } catch { /* opening a new request is still fine */ }
  };

  const submitReturn = async () => {
    if (!returnFor) return;
    setReturnBusy(true);
    try {
      const res = await createReturnRequest(returnFor._id, returnForm);
      setReturnByOrder((prev) => ({ ...prev, [returnFor._id]: res.data }));
      toast.success("Return request sent. Our team will review it shortly.");
      setReturnFor(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open the return request");
    } finally {
      setReturnBusy(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();
        const data = res.data;
        setOrders(Array.isArray(data) ? data : data.orders || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const buyAgain = async (order) => {
    let added = 0;
    for (const item of order.orderItems || []) {
      const productId = item.product?._id || item.product;
      if (!productId) continue;
      try {
        await addToCartLocal(productId, item.quantity || 1, item.variant || null, {
          product: { _id: productId, name: item.name, price: item.price, image: item.image, stock: 999 },
          variant: item.variant ? { _id: item.variant, stock: 999 } : null,
          variantLabel: item.variantLabel || "",
        });
        added += 1;
      } catch { /* per-item failures toast inside the cart context */ }
    }
    if (added > 0) {
      toast.success("Items added back to your cart");
      navigate("/cart");
    }
  };

  const initiateCancel = (e, orderId) => {
    e.stopPropagation();
    setOrderToCancel(orderId);
    setCancelModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setCancelModalOpen(false);
      setCancellingId(orderToCancel);

      const res = await cancelMyOrder(orderToCancel);
      const updatedOrder = res.data?.order;

      setOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord._id === orderToCancel
            ? updatedOrder || { ...ord, status: "cancelled" }
            : ord,
        ),
      );
      toast.success(res.data?.message || "Order cancelled successfully");
    } catch (err) {
      // FIX #2: replaced alert() with toast.error()
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
      setOrderToCancel(null);
    }
  };

  const initiateDeliver = (orderId, sellerId = null) => {
    setOrderToDeliver({ orderId, sellerId });
    setDeliverModalOpen(true);
  };

  const confirmDelivery = async () => {
    if (!orderToDeliver) return;

    try {
      setDeliverModalOpen(false);
      const res = await confirmDeliveryService(
        orderToDeliver.orderId,
        orderToDeliver.sellerId,
      );
      const updatedOrder = res.data?.order;

      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderToDeliver.orderId
            ? updatedOrder || { ...ord, status: "delivered" }
            : ord,
        ),
      );
    } catch (err) {
      // FIX #2: replaced alert() with toast.error()
      toast.error(err.response?.data?.message || "Failed to confirm delivery");
    } finally {
      setOrderToDeliver(null);
    }
  };

  const orderBeingCancelled = orders.find(
    (ord) => ord._id === orderToCancel,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F4] px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-black/10 rounded w-24"></div>
            <div className="h-8 bg-black/20 rounded-lg w-48"></div>
            <div className="h-4 bg-black/10 rounded w-64"></div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg hidden sm:block"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#101828] hover:opacity-80 transition-opacity mb-4 group"
          >
            <FiArrowLeft className="transform group-hover:-translate-x-1 transition-transform" />
            Back to Cart
          </Link>
          <h1 className="text-2xl font-bold text-[#101828]">My Orders</h1>
          <p className="text-sm text-[#667085] mt-1">
            Track and review your past purchases
          </p>
        </div>

        {orders.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
            {TABS.map((t) => {
              const count = t.id === "all" ? orders.length : orders.filter((o) => orderTab(o, returnsByOrderId) === t.id).length;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${tab === t.id ? "bg-emerald-700 text-white" : "border border-gray-300 bg-white text-gray-600 hover:border-emerald-300"}`}
                >
                  {t.label}{count > 0 ? ` (${count})` : ""}
                </button>
              );
            })}
            {tab !== "all" && orders.filter((o) => orderTab(o, returnsByOrderId) === tab).length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
                <p className="text-sm text-[#667085]">No orders in this group yet.</p>
              </div>
            )}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FiPackage size={24} />
            </div>
            <h3 className="text-base font-bold text-[#101828] mb-1">
              No orders found
            </h3>
            <p className="text-sm text-[#667085] mb-6">
              You haven't placed any orders on TronMarket yet.
            </p>
            <Link
              to="/"
              className="inline-block bg-[#101828] hover:bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(tab === "all" ? orders : orders.filter((o) => orderTab(o, returnsByOrderId) === tab)).map((order) => {
              const isExpanded = !!expandedOrders[order._id];
              const totalItemsCount =
                order.orderItems?.reduce(
                  (acc, item) => acc + item.quantity,
                  0,
                ) || 0;
              const formattedDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-NG", {
                    dateStyle: "medium",
                  })
                : "Recent";

              const isCancellable = ["pending", "paid", "processing"].includes(
                order.status,
              );

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    onClick={() => toggleOrderExpand(order._id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 hidden sm:block">
                        <FiPackage size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-mono font-bold text-[#667085]">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <span className="text-gray-300 text-xs hidden sm:inline">
                            •
                          </span>
                          <div className="flex items-center gap-1 text-xs text-[#667085]">
                            <FiCalendar size={12} className="text-gray-400" />
                            {formattedDate}
                          </div>
                        </div>
                        <p className="text-base font-bold text-[#101828] mt-1">
                          ₦{Number(order.totalPrice).toLocaleString()}
                          <span className="text-xs font-normal text-[#667085] ml-1.5">
                            ({totalItemsCount}{" "}
                            {totalItemsCount === 1 ? "item" : "items"})
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-gray-100 pt-3 sm:pt-0 sm:border-none">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize border ${statusColors[order.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                      >
                        {order.status}
                      </span>
                      <div className="text-gray-400 hover:text-gray-600 p-1 rounded-md border border-gray-200 bg-white">
                        {isExpanded ? (
                          <FiChevronUp size={16} />
                        ) : (
                          <FiChevronDown size={16} />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50/30 divide-y divide-gray-100">
                      <div className="px-4 pt-4 bg-white">
                        <OrderTimeline status={order.status} />
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        {order.orderItems?.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <ItemImage
                                src={thumbUrl(item.image)}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 shrink-0"
                              />
                              <div>
                                <h4 className="font-bold text-[#101828] line-clamp-1">
                                  {item.name}
                                  {item.variantLabel ? ` — ${item.variantLabel}` : ""}
                                </h4>
                                <p className="text-xs text-[#667085] mt-0.5">
                                  Quantity:{" "}
                                  <span className="font-mono text-gray-700 font-bold">
                                    {item.quantity}
                                  </span>{" "}
                                  × ₦{Number(item.price).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <p className="font-bold text-gray-700 font-mono text-right">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {order.sellerFulfillments?.length > 0 && (
                        <div className="space-y-2 bg-white px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">
                            Seller packages
                          </p>
                          {order.sellerFulfillments.map((fulfillment) => {
                            const sellerId =
                              fulfillment.seller?._id || fulfillment.seller;
                            const packageStatus =
                              order.status === "cancelled"
                                ? "cancelled"
                                : !order.isPaid
                                  ? "pending"
                                  : fulfillment.status === "pending"
                                    ? "paid"
                                    : fulfillment.status;
                            return (
                              <div
                                key={String(sellerId)}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
                              >
                                <span className="font-semibold text-[#101828]">
                                  {fulfillment.seller?.name || "Seller"} — ₦
                                  {Number(
                                    fulfillment.subtotal || 0,
                                  ).toLocaleString()}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 font-semibold capitalize ${statusColors[packageStatus] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                                >
                                  {packageStatus}
                                </span>
                                {(fulfillment.carrier || fulfillment.trackingNumber) && (
                                  <span className="w-full text-[#667085]">
                                    Tracking: {fulfillment.carrier || "Courier"}
                                    {fulfillment.trackingNumber ? ` · ${fulfillment.trackingNumber}` : ""}
                                  </span>
                                )}
                                {["shipped", "delivery-claimed"].includes(
                                  packageStatus,
                                ) && (
                                  <button
                                    onClick={() =>
                                      initiateDeliver(
                                        order._id,
                                        String(sellerId),
                                      )
                                    }
                                    className="rounded-lg bg-green-600 px-2.5 py-1.5 font-semibold text-white hover:bg-green-700"
                                  >
                                    Confirm this package
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {!order.isPaid && order.paymentExpiresAt && (
                            <p className="text-amber-700">
                              Payment due by{" "}
                              {new Date(
                                order.paymentExpiresAt,
                              ).toLocaleString()}
                              . Unpaid orders are cancelled and restocked
                              after this time.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="bg-white px-4 py-3 text-xs text-[#667085]">
                        <div className="flex justify-between py-0.5">
                          <span>Items subtotal</span>
                          <span>₦{Number(order.itemsSubtotal ?? Math.max(0, order.totalPrice - (order.shippingPrice || 0))).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Delivery{order.shippingZone ? ` (${order.shippingZone})` : ""}</span>
                          <span>{Number(order.shippingPrice || 0) === 0 ? "FREE" : `₦${Number(order.shippingPrice).toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-100 py-1 font-bold text-[#101828]">
                          <span>Total</span>
                          <span>₦{Number(order.totalPrice).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-gray-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#667085]">
                        <div className="line-clamp-1 max-w-xs sm:max-w-md">
                          <span className="font-medium text-gray-400">
                            Shipping To:{" "}
                          </span>
                          <span className="text-gray-700">
                            {order.shippingAddress?.address},{" "}
                            {order.shippingAddress?.city}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 ml-auto sm:ml-0 w-full sm:w-auto justify-end">
                          {order.refundStatus &&
                            order.refundStatus !== "none" && (
                              <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 font-semibold capitalize">
                                Refund: {order.refundStatus}
                              </span>
                            )}
                          {isCancellable && (
                            <button
                              onClick={(e) => initiateCancel(e, order._id)}
                              disabled={cancellingId === order._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors font-semibold shadow-sm disabled:opacity-50"
                            >
                              {cancellingId === order._id ? (
                                <FiLoader
                                  className="animate-spin text-red-600"
                                  size={12}
                                />
                              ) : (
                                <FiXCircle size={12} />
                              )}
                              Cancel Order
                            </button>
                          )}

                          {(returnByOrder[order._id] || order.status === "delivered") && (
                            returnByOrder[order._id] ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold capitalize">
                                Return: {returnByOrder[order._id].status}
                              </span>
                            ) : (
                              <button
                                onClick={() => openReturn(order)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-xs font-semibold shadow-sm"
                              >
                                Request return
                              </button>
                            )
                          )}
                          {["delivered", "completed"].includes(order.status) && (
                            <button
                              onClick={() => buyAgain(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101828] text-white hover:opacity-90 transition-opacity text-xs font-semibold shadow-sm"
                            >
                              Buy again
                            </button>
                          )}
                          <Link
                            to={`/orders/${order._id}/invoice`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors font-semibold shadow-sm"
                          >
                            View Invoice
                          </Link>
                          {!order.isPaid && order.status === "pending" && (
                            <Link
                              to="/checkout"
                              state={{ pendingOrder: order }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#047857] text-white hover:opacity-90 transition-opacity font-semibold shadow-sm"
                            >
                              <FiCreditCard size={12} />
                              Complete Payment
                            </Link>
                          )}
                          {(disputesByOrderId[order._id] || []).map((d) => (
                            <span key={d._id} className="inline-flex items-center px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
                              {DISPUTE_LABEL[d.status] || "Report"}
                            </span>
                          ))}
                          {reportablePackages(order, disputesByOrderId[order._id]).length > 0 && (
                            <button
                              onClick={() => openReportModal(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 transition-colors text-xs font-semibold shadow-sm"
                            >
                              Not received?
                            </button>
                          )}
                          {order.status === "shipped" && (
                            <button
                              onClick={() => initiateDeliver(order._id)}
                              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                            >
                              Confirm Received
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={cancelModalOpen}
        title="Cancel Order"
        description={
          orderBeingCancelled?.isPaid
            ? "Are you sure you want to cancel this paid order? It will be cancelled and a refund requested from Paystack. This action cannot be undone."
            : "Are you sure you want to cancel this order? This action cannot be undone."
        }
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        onConfirm={confirmCancelOrder}
        onClose={() => {
          setCancelModalOpen(false);
          setOrderToCancel(null);
        }}
      />

      {returnFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => setReturnFor(null)} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-1">Request a return</h3>
            <p className="text-sm text-[#667085] mb-4">Tell us what went wrong. Approved returns on paid orders are refunded through Paystack.</p>
            {returnByOrder[returnFor._id] ? (
              <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                A return is already {returnByOrder[returnFor._id].status} for this order.
              </p>
            ) : (
              <>
                <input
                  className="input-field w-full mb-2"
                  placeholder="Reason (e.g. item arrived damaged)"
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                />
                <textarea
                  className="input-field w-full"
                  rows={3}
                  placeholder="Details (optional)"
                  value={returnForm.details}
                  onChange={(e) => setReturnForm({ ...returnForm, details: e.target.value })}
                />
              </>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button className="secondary-btn" onClick={() => setReturnFor(null)}>Close</button>
              {!returnByOrder[returnFor._id] && (
                <button className="primary-btn disabled:opacity-50" disabled={returnBusy || returnForm.reason.trim().length < 3} onClick={submitReturn}>
                  {returnBusy ? "Sending…" : "Send request"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {disputeFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => !disputeBusy && setDisputeFor(null)} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-1">Report a package not received</h3>
            <p className="text-sm text-muted mb-4">
              Choose the package(s) that have not reached you. While we look into it, the seller is not paid for them.
            </p>
            <div className="space-y-2 mb-3">
              {reportablePackages(disputeFor, disputesByOrderId[disputeFor._id]).map((pkg) => (
                <label key={pkg.sellerId} className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={disputeSellerIds.includes(pkg.sellerId)}
                    onChange={(e) =>
                      setDisputeSellerIds(
                        e.target.checked
                          ? [...disputeSellerIds, pkg.sellerId]
                          : disputeSellerIds.filter((id) => id !== pkg.sellerId),
                      )
                    }
                  />
                  <span>
                    <strong>{pkg.name}</strong>
                    <span className="block text-xs text-muted">{pkg.items.join(", ") || "Items in this package"}</span>
                  </span>
                </label>
              ))}
            </div>
            <input
              className="input-field w-full"
              placeholder="What happened? (e.g. tracking says delivered but I have nothing)"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="secondary-btn" disabled={disputeBusy} onClick={() => setDisputeFor(null)}>Close</button>
              <button
                className="primary-btn disabled:opacity-50"
                disabled={disputeBusy || disputeSellerIds.length === 0 || disputeReason.trim().length < 3}
                onClick={submitDispute}
              >
                {disputeBusy ? "Sending…" : "Send report"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deliverModalOpen}
        title="Confirm Receipt"
        description="Are you sure you have received this item in good condition?"
        confirmLabel="Yes, Received"
        cancelLabel="Not Yet"
        onConfirm={confirmDelivery}
        onClose={() => {
          setDeliverModalOpen(false);
          setOrderToDeliver(null);
        }}
      />
    </div>
  );
}
