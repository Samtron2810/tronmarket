import { Link, useLocation } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";

export default function OrderSuccess() {
  const { state } = useLocation();
  const orderId = state?.orderId;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="card p-8 text-center space-y-3">
        <div
          className="flex justify-center"
          style={{ color: "var(--royal-blue)" }}
        >
          <FiCheckCircle size={48} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Placed 🎉</h1>
        <p style={{ color: "var(--slate-muted)" }}>
          Thank you for shopping with TronMarket
        </p>
        {orderId && (
          <p style={{ color: "var(--slate-muted)" }}>
            Order ID:{" "}
            <span style={{ color: "var(--charcoal)", fontFamily: "monospace" }}>
              {orderId}
            </span>
          </p>
        )}
        <Link to="/my-orders" className="primary-btn inline-block mt-2">
          View My Orders
        </Link>
      </div>
    </div>
  );
}
