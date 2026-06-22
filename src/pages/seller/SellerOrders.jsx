import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { thumbUrl } from "../../utils/cloudinaryUrl";

const statusColors = {
  pending: "bg-[#FFAA4D]/20 text-[#FF8C00]",
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-[#EBF2FF] text-[#2B80FF]",
  shipped: "bg-[#EBF2FF] text-[#2B80FF]",
  "delivery-claimed": "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  completed: "bg-teal-100 text-teal-700",
  cancelled: "bg-[#FF2E3B]/10 text-[#FF2E3B]",
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);

  // Modal states
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [orderToShip, setOrderToShip] = useState(null);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/seller/orders");
        setOrders(res.data || []);
      } catch (err) {
        console.error("Failed to load seller orders", err);
      }
    };

    fetchOrders();
  }, []);

  const handleMarkShipped = async () => {
    const orderId = orderToShip;
    if (!orderId) return;
    try {
      await api.put(`/orders/${orderId}/status`, {
        status: "shipped",
        note: "Order has been shipped by seller",
      });
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId ? { ...ord, status: "shipped" } : ord,
        ),
      );
      toast.success("Order marked as shipped");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setShipModalOpen(false);
      setOrderToShip(null);
    }
  };

  const handleSellerDeliveryClaim = async () => {
    const orderId = orderToDeliver;
    if (!orderId) return;
    try {
      await api.put(`/orders/${orderId}/seller-delivery-claim`, {});
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId ? { ...ord, status: "delivery-claimed" } : ord,
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

  return (
    <div className="min-h-screen bg-[#FF8C00] px-4 py-10 sm:px-6 lg:px-8">
      {/* return home button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#1A1A1A", color: "#fff" }}
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Seller Orders</h1>
          <p className="text-sm text-[#555555] mt-1">
            Orders placed for your products
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-[#555555]">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-[#1A1A1A]">
                      Order #{order._id}
                    </div>
                    <div className="text-xs text-[#555555] mt-0.5">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#FF8C00]">
                    ₦{Number(order.totalPrice).toLocaleString()}
                  </div>
                </div>

                {/* Customer */}
                <div className="text-sm text-[#555555] mb-3 pb-3 border-b border-gray-100">
                  Customer:{" "}
                  <span className="text-[#1A1A1A] font-medium">
                    {order.user?.name}
                  </span>
                  {" — "}
                  {order.user?.email}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {order.orderItems.map((it) => (
                    <div
                      key={it.product}
                      className="flex items-center gap-3 bg-[#EBF2FF] rounded-lg p-2"
                    >
                      <img
                        src={thumbUrl(it.image)}
                        alt={it.name}
                        className="w-12 h-12 object-cover rounded-lg bg-gray-50 border border-gray-200 shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-[#1A1A1A]">
                          {it.name}
                        </div>
                        <div className="text-xs text-[#555555]">
                          Qty: {it.quantity} • ₦
                          {Number(it.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#1A1A1A]">
                        ₦{Number(it.price * it.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#555555]">Status</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      statusColors[order.status] ||
                      "bg-[#EBF2FF] text-[#1A1A1A]"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                {/* i added this myself */}
                <div className="text-right gap-2 mt-2">
                  {/* If order is paid, show mark shipped button */}
                  {order.status === "paid" && (
                    <button
                      onClick={() => {
                        setOrderToShip(order._id);
                        setShipModalOpen(true);
                      }}
                      className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold hover:bg-indigo-700 transition-colors shadow-sm "
                    >
                      Mark Shipped
                    </button>
                  )}

                  {/* If order is shipped but customer goes quiet, seller hits this backup option */}
                  {order.status === "shipped" && (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ship Confirmation Modal */}
      <ConfirmModal
        open={shipModalOpen}
        title="Mark Order as Shipped"
        description="Are you sure you want to mark this order as shipped? This will notify the customer that their items are on the way."
        confirmLabel="Mark as Shipped"
        cancelLabel="Cancel"
        onConfirm={handleMarkShipped}
        onClose={() => {
          setShipModalOpen(false);
          setOrderToShip(null);
        }}
      />

      {/* Delivery Claim Confirmation Modal */}
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
