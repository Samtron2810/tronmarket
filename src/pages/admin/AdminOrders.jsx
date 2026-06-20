import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";
import { thumbUrl } from "../../utils/cloudinaryUrl";

const statusColors = {
  pending: "bg-amber-100 text-amber-800 border border-amber-200",
  paid: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  processing: "bg-blue-100 text-blue-800 border border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  delivered: "bg-green-100 text-green-800 border border-green-200",
  cancelled: "bg-rose-100 text-rose-800 border border-rose-200",
};

export default function AdminOrders() {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/users/${id}/orders`);
        setOrders(res.data || []);
      } catch (err) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [id]);

  const handleCompleteOrder = async () => {
    const orderId = orderToComplete;
    if (!orderId) return;
    try {
      await api.put(`/orders/${orderId}/complete`, {});
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: "completed" } : o,
        ),
      );
      toast.success("Order completed successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete order");
    } finally {
      setCompleteModalOpen(false);
      setOrderToComplete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FF8C00] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse h-4 w-24 bg-gray-200 rounded mb-6" />
          <div className="animate-pulse h-7 w-48 bg-gray-200 rounded-lg mb-6" />
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="bg-[#FFAA4D]/60 px-5 py-3">
                  <div className="h-4 w-32 bg-white/40 rounded" />
                </div>
                <div className="p-5 space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-gray-200 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                      </div>
                      <div className="h-5 w-16 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FF8C00] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/admin/users/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] hover:opacity-80 transition-opacity mb-4"
          >
            ← Back to User
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Orders{" "}
            <span className="ml-1 text-base font-normal text-[#555555]">
              ({orders.length} total)
            </span>
          </h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-[#555555]">No orders found for this user.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-[#FFAA4D] px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#555555]">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs text-[#555555] ml-3">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString("en-NG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : ""}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize border ${
                      statusColors[order.status] ||
                      "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Order Items */}
                <div className="p-5 space-y-3">
                  {order.orderItems?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-[#EBF2FF] rounded-lg p-3"
                    >
                      <img
                        src={
                          thumbUrl(item.image) ||
                          "https://via.placeholder.com/150"
                        }
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg bg-gray-50 border border-gray-200 shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#1A1A1A] truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-[#555555] mt-0.5">
                          Qty: {item.quantity} × ₦
                          {Number(item.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#1A1A1A] text-right shrink-0">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-[#555555]">Total: </span>
                    <span className="font-bold text-[#1A1A1A]">
                      ₦{Number(order.totalPrice).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Shipping Info */}
                    {order.shippingAddress && (
                      <span className="text-xs text-[#555555] truncate max-w-50">
                        📍 {order.shippingAddress.address},{" "}
                        {order.shippingAddress.city}
                      </span>
                    )}
                    {/* Admin Complete Button (for delivery claim) */}
                    {(order.status === "shipped" ||
                      order.status === "delivered") && (
                      <button
                        onClick={() => {
                          setOrderToComplete(order._id);
                          setCompleteModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Order Confirmation Modal */}
      <ConfirmModal
        open={completeModalOpen}
        title="Complete Order"
        description="Are you sure you want to mark this order as completed? This is the final step and will close the order permanently."
        confirmLabel="Complete Order"
        cancelLabel="Cancel"
        onConfirm={handleCompleteOrder}
        onClose={() => {
          setCompleteModalOpen(false);
          setOrderToComplete(null);
        }}
      />
    </div>
  );
}
