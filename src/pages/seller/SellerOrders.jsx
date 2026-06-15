import { useEffect, useState } from "react";
import api from "../../services/api";

const statusColors = {
  pending: "bg-[#FFAA4D]/20 text-[#FF8C00]",
  processing: "bg-[#EBF2FF] text-[#2B80FF]",
  shipped: "bg-[#EBF2FF] text-[#2B80FF]",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-[#FF2E3B]/10 text-[#FF2E3B]",
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);

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

  const handleSellerDeliveryClaim = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/orders/${orderId}/seller-delivery-claim`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Update your seller orders state array variable
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId ? { ...ord, status: "delivered" } : ord,
        ),
      );
      alert("Delivery claim submitted to Admin for review.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit claim");
    }
  };

  return (
    <div className="min-h-screen bg-[#FF8C00] px-4 py-10 sm:px-6 lg:px-8">
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
                        src={it.image}
                        alt={it.name}
                        className="w-12 h-12 object-cover rounded-lg"
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
                {/* ---------------------------------------------------------------- */}
                <div className="text-right gap-2 mt-2">
                  {/* If order is processing, show mark shipped button */}
                  {order.status === "paid" && (
                    <button
                      onClick={() => handleMarkShipped(order._id)}
                      className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold hover:bg-indigo-700 transition-colors shadow-sm "
                    >
                      Mark Shipped
                    </button>
                  )}

                  {/* NEW: If order is shipped but customer goes quiet, seller hits this backup option */}
                  {order.status === "shipped" && (
                    <button
                      onClick={() => handleSellerDeliveryClaim(order._id)}
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
    </div>
  );
}
