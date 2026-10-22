import { useCallback, useEffect, useState } from "react";
import {
  getSellerOrders,
  updateOrderStatus,
  sellerDeliveryClaim,
} from "../../services/orderService";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { thumbUrl } from "../../utils/cloudinaryUrl";
import OrderThread from "../../components/OrderThread";
import { cancelMyPackage } from "../../services/storefrontService";

const statusColors = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-[#ECFDF5] text-[#047857]",
  shipped: "bg-[#ECFDF5] text-[#047857]",
  "delivery-claimed": "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  completed: "bg-teal-100 text-teal-700",
  cancelled: "bg-[#DC2626]/10 text-[#DC2626]",
};

export default function SellerOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [orderToShip, setOrderToShip] = useState(null);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState(null);
  const [threadOrderId, setThreadOrderId] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerOrders({ page, limit: 20 });
      const data = res.data || {};
      // The API returns only this seller's items, subtotal and status for
      // each order — never the whole multi-seller order.
      setOrders(Array.isArray(data) ? data : data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load seller orders", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const [tracking, setTracking] = useState({ carrier: "", trackingNumber: "" });

  const handleMarkShipped = async () => {
    const orderId = orderToShip;
    if (!orderId) return;
    try {
      const res = await updateOrderStatus(
        orderId,
        "shipped",
        "Order has been shipped by seller",
        { carrier: tracking.carrier, trackingNumber: tracking.trackingNumber },
      );
      const updated = res.data?.order;
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId
            ? updated || { ...ord, status: "shipped", sellerStatus: "shipped" }
            : ord,
        ),
      );
      toast.success("Order marked as shipped");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setShipModalOpen(false);
      setOrderToShip(null);
      setTracking({ carrier: "", trackingNumber: "" });
    }
  };

  const handleSellerDeliveryClaim = async () => {
    const orderId = orderToDeliver;
    if (!orderId) return;
    try {
      const res = await sellerDeliveryClaim(orderId);
      const updated = res.data?.order;
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId
            ? updated || {
                ...ord,
                status: "delivery-claimed",
                sellerStatus: "delivery-claimed",
              }
            : ord,
        ),
      );
      toast.success("Delivery claim submitted to Admin for review.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit claim");
    } finally {
      setDeliverModalOpen(false);
      setOrderToDeliver(null);
    }
  };

  const visibleOrders = orders.filter((order) => {
    const status = order.sellerStatus || order.status;
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const haystack = [
        order._id,
        order.shippingAddress?.fullName,
        order.user?.name,
        order.user?.email,
        ...(order.items || order.orderItems || []).map((i) => i.name),
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-10 sm:px-6 lg:px-8">
      {/* return home button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#101828", color: "#fff" }}
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#101828]">Seller Orders</h1>
          <p className="text-sm text-[#667085] mt-1">
            Orders placed for your products
          </p>
        </div>

        {/* Status filters + search */}
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[["all", "All"], ["paid", "Paid"], ["processing", "Processing"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]].map(([id, label]) => {
              const count = id === "all" ? orders.length : orders.filter((o) => (o.sellerStatus || o.status) === id).length;
              return (
                <button
                  key={id}
                  onClick={() => setStatusFilter(id)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${statusFilter === id ? "bg-emerald-700 text-white" : "border border-gray-300 bg-white text-gray-600 hover:border-emerald-300"}`}
                >
                  {label}{count > 0 ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order ID, customer, or product…"
            aria-label="Search orders"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {!loading && orders.length > 0 && visibleOrders.length === 0 && (
            <p className="text-sm text-[#667085]">No orders match this filter on this page.</p>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-32 bg-gray-200 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-56 bg-gray-200 rounded mb-3" />
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-2">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-12 bg-gray-200 rounded" />
                  <div className="h-5 w-20 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-[#667085]">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                {/* Header — FIX #16: short ID instead of full ObjectId */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-[#101828]">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-xs text-[#667085] mt-0.5">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#B45309]">
                      ₦
                      {Number(
                        order.sellerSubtotal ?? order.totalPrice,
                      ).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#667085]">
                      Your items only
                    </div>
                  </div>
                </div>

                {/* Customer */}
                <div className="text-sm text-[#667085] mb-3 pb-3 border-b border-gray-100">
                  Customer:{" "}
                  <span className="text-[#101828] font-medium">
                    {order.user?.name}
                  </span>
                  {" — "}
                  {order.user?.email}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {order.orderItems.map((it) => (
                    <div
                      key={`${it.product}:${it.variant || ""}`}
                      className="flex items-center gap-3 bg-[#ECFDF5] rounded-lg p-2"
                    >
                      <img
                        src={thumbUrl(it.image)}
                        alt={it.name}
                        className="w-12 h-12 object-cover rounded-lg bg-gray-50 border border-gray-200 shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-[#101828]">
                          {it.name}
                          {it.variantLabel ? ` — ${it.variantLabel}` : ""}
                        </div>
                        <div className="text-xs text-[#667085]">
                          Qty: {it.quantity} • ₦
                          {Number(it.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#101828]">
                        ₦{Number(it.price * it.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#667085]">Status</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      statusColors[order.sellerStatus || order.status] ||
                      "bg-[#ECFDF5] text-[#101828]"
                    }`}
                  >
                    {order.sellerStatus || order.status}
                  </span>
                </div>
                <div className="mt-3 space-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-[#667085]">
                  <div className="flex justify-between"><span>Your item subtotal</span><span>₦{Number(order.sellerSubtotal ?? order.totalPrice).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Platform commission ({(Number(order.sellerCommissionRate || 0) * 100).toFixed(2)}%)</span><span>-₦{Number(order.sellerCommissionAmount || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-[#101828]"><span>Your payout</span><span>₦{Number(order.sellerPayoutAmount ?? order.sellerSubtotal ?? order.totalPrice).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Payout status</span><span className="capitalize">{order.payoutStatus || "not-eligible"}</span></div>
                  <div className="pt-1 text-right">
                    <Link to={`/orders/${order._id}/invoice`} className="font-semibold text-[#047857] hover:underline">
                      View payout statement
                    </Link>
                  </div>
                </div>
                <div className="text-right gap-2 mt-2">
                  {((order.sellerStatus || order.status) === "paid" ||
                    (order.sellerStatus || order.status) === "processing") && (
                    <button
                      onClick={() => {
                        setOrderToShip(order._id);
                        setShipModalOpen(true);
                      }}
                      className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Mark Shipped
                    </button>
                  )}

                  {(order.sellerStatus || order.status) === "shipped" && (
                    <button
                      onClick={() => {
                        setOrderToDeliver(order._id);
                        setDeliverModalOpen(true);
                      }}
                      className="bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold hover:bg-amber-700 transition-colors shadow-sm"
                    >
                      Mark as Delivered (Claim)
                    </button>
                  )}
                  {order.isPaid && (
                    <button
                      onClick={() => setThreadOrderId(threadOrderId === order._id ? null : order._id)}
                      className="border border-gray-200 bg-white text-gray-700 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      {threadOrderId === order._id ? "Hide messages" : "Messages with buyer"}
                    </button>
                  )}
                  {order.isPaid &&
                    ["paid", "processing"].includes(order.sellerStatus || order.status) && (
                      <button
                        onClick={() => {
                          setCancelOrderId(cancelOrderId === order._id ? null : order._id);
                          setCancelReason("");
                        }}
                        className="border border-rose-200 bg-white text-rose-700 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold hover:bg-rose-50 transition-colors shadow-sm"
                      >
                        {order.sellerIsMultiSeller ? "Cancel my items" : "Cancel (out of stock)"}
                      </button>
                    )}
                </div>
                {cancelOrderId === order._id && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-left">
                    <p className="text-xs text-rose-800 mb-2">
                      {order.sellerIsMultiSeller
                        ? "Your items in this order will be cancelled and refunded to the buyer, and the rest of the order stays live. Only your share is refunded."
                        : "This cancels the whole order and refunds the buyer in full, including delivery."}
                    </p>
                    <input
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      maxLength={300}
                      placeholder="Reason (shown to the buyer), e.g. out of stock"
                      className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCancelOrderId(null)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold"
                      >
                        Keep order
                      </button>
                      <button
                        type="button"
                        disabled={cancelBusy || cancelReason.trim().length < 3}
                        onClick={async () => {
                          setCancelBusy(true);
                          try {
                            const res = await cancelMyPackage(order._id, cancelReason.trim());
                            const updated = res.data?.order;
                            if (updated) {
                              setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, ...updated } : o)));
                            }
                            toast.success("Cancelled. The buyer is being refunded.");
                            setCancelOrderId(null);
                          } catch (err) {
                            toast.error(err.response?.data?.message || "Could not cancel these items");
                          } finally {
                            setCancelBusy(false);
                          }
                        }}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {cancelBusy ? "Cancelling…" : "Confirm cancellation"}
                      </button>
                    </div>
                  </div>
                )}
                {threadOrderId === order._id && (
                  <div className="mt-3 text-left">
                    <OrderThread orderId={order._id} title="Messages with buyer" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-[#667085]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {shipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => setShipModalOpen(false)} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-1">Mark order as shipped</h3>
            <p className="text-sm text-[#667085] mb-4">Add tracking details so the customer can follow the delivery.</p>
            <input
              className="input-field w-full mb-2"
              placeholder="Carrier (e.g. GIG Logistics)"
              value={tracking.carrier}
              onChange={(e) => setTracking({ ...tracking, carrier: e.target.value })}
            />
            <input
              className="input-field w-full"
              placeholder="Tracking number (optional)"
              value={tracking.trackingNumber}
              onChange={(e) => setTracking({ ...tracking, trackingNumber: e.target.value })}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="secondary-btn" onClick={() => setShipModalOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleMarkShipped}>Mark as Shipped</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deliverModalOpen}
        title="Claim Delivery"
        description="Are you sure you want to claim delivery for this order? This will be reviewed by an admin. Only use this if the customer is not confirming receipt."
        confirmLabel="Claim Delivery"
        cancelLabel="Cancel"
        onConfirm={handleSellerDeliveryClaim}
        onClose={() => {
          setDeliverModalOpen(false);
          setOrderToDeliver(null);
        }}
      />
    </div>
  );
}
