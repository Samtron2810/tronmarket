import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellingId, setCancellingId] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState(null);

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
            {orders.map((order) => {
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
