import { useEffect, useState } from "react";
import { getMyOrders } from "../services/orderService";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();
        setOrders(res.data || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="bg-ui-white p-4 mb-3 rounded">
            <p>Order ID: {order._id}</p>
            <p>Total: ₦{order.totalPrice}</p>
            <p>Status: {order.status}</p>
          </div>
        ))
      )}
    </div>
  );
}
