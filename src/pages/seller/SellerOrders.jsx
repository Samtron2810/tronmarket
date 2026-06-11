import { useEffect, useState } from "react";
import api from "../../services/api";

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Seller Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order._id}
            className="rounded-xl border p-4 mb-4"
            style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold">Order #{order._id}</div>
                <div className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-sm font-bold text-orange-500">
                ₦{Number(order.totalPrice).toLocaleString()}
              </div>
            </div>

            <div className="text-sm text-gray-700 mb-3">
              Customer: {order.user?.name} — {order.user?.email}
            </div>

            <div className="space-y-2 mb-3">
              {order.orderItems.map((it) => (
                <div key={it.product} className="flex items-center gap-3">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{it.name}</div>
                    <div className="text-xs text-gray-500">
                      Qty: {it.quantity} • ₦{Number(it.price).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    ₦{Number(it.price * it.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm">
              Status: <span className="font-semibold">{order.status}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
