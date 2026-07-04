import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createOrder } from "../services/orderService";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import MessageModal from "../components/MessageModal";
import PayButton from "../components/PayButton";
import ItemImage from "../components/ItemImage";
import { FaArrowLeft } from "react-icons/fa";
import { FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const {
    fetchCart,
    validateCartBeforeCheckout,
    removeItemLocal,
    updateQtyLocal,
  } = useContext(CartContext);

  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [stockErrors, setStockErrors] = useState([]);

  const [order, setOrder] = useState(location.state?.pendingOrder || null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStockErrors([]);

    // ── Step 1: Validate stock before placing order ──────────────────────
    // This catches cases where another user bought the last item after this
    // user added it to cart but before they reached checkout.
    setValidating(true);
    try {
      const validation = await validateCartBeforeCheckout();

      if (!validation.valid) {
        // Stock issues found — auto-fix what we can, then stop for user review
        for (const err of validation.errors) {
          if (err.reason === "out_of_stock") {
            await removeItemLocal(err.productId);
          } else if (err.reason === "insufficient") {
            await updateQtyLocal(err.productId, err.availableStock);
          }
        }

        // Save errors to show the user what changed
        setStockErrors(validation.errors);
        setValidating(false);
        return; // Stop — user must review adjusted cart before placing order
      }
    } catch (err) {
      // If validate endpoint isn't available yet, log and proceed.
      // The backend order creation has a final stock check as the last line of
      // defence, so this is safe to fail open.
      console.error("Cart validation failed:", err);
    }
    setValidating(false);

    // ── Step 2: Place order ───────────────────────────────────────────────
    setLoading(true);
    try {
      const res = await createOrder({ shippingAddress: form });
      setOrder(res.data);
      fetchCart();
    } catch (err) {
      setMsg(err.response?.data?.message || "Error placing order");
      setMsgOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (updatedOrder) => {
    setOrder(updatedOrder);
    fetchCart();
    navigate("/order-success", {
      state: { orderId: updatedOrder._id, order: updatedOrder },
    });
  };

  const handlePaymentError = (message) => {
    setMsg(message);
    setMsgOpen(true);
  };

  const inputCls =
    "w-full bg-[#EBF2FF] border border-[#2B80FF]/20 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#2B80FF]";

  return (
    <div className="min-h-screen bg-[#FF8C00] px-4 py-10 sm:px-6 lg:px-8">
      <div
        className="flex items-center gap-2 max-w-3xl mx-auto mb-6 cursor-pointer text-black hover:gap-3 transition-all duration-200"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft />
        <span>Back</span>
      </div>

      <div className="max-w-xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Checkout</h1>
          <p className="text-sm text-[#555555] mt-1">
            {order
              ? "Complete your payment to finalize the order"
              : "Fill in your delivery details to place your order"}
          </p>
        </div>

        {/* ── Stock error banner — shown after auto-adjustment ── */}
        {stockErrors.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm font-bold text-amber-700">
                Cart updated — stock availability changed
              </p>
            </div>
            <ul className="space-y-1">
              {stockErrors.map((err) => (
                <li key={err.productId} className="text-xs text-amber-700">
                  • <span className="font-semibold">{err.name || "Item"}</span>:{" "}
                  {err.reason === "out_of_stock"
                    ? "Removed — now out of stock"
                    : `Quantity reduced to ${err.availableStock} (only available)`}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-600 mt-2">
              Please review your cart and submit again when ready.
            </p>
          </div>
        )}

        {!order ? (
          /* ── Shipping Form ── */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-[#FFAA4D] px-5 py-4">
              <h2 className="font-semibold text-[#1A1A1A]">
                Shipping Information
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <input
                name="fullName"
                placeholder="Full Name"
                value={form.fullName}
                onChange={handleChange}
                className={inputCls}
                required
              />
              <input
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className={inputCls}
                required
              />
              <input
                name="address"
                placeholder="Street Address"
                value={form.address}
                onChange={handleChange}
                className={inputCls}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  className={inputCls}
                  required
                />
                <input
                  name="state"
                  placeholder="State"
                  value={form.state}
                  onChange={handleChange}
                  className={inputCls}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading || validating}
                  className="px-5 py-2.5 rounded-lg bg-[#2B80FF] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {validating
                    ? "Checking stock..."
                    : loading
                      ? "Placing order…"
                      : "Place Order"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ── Order Placed — Pay Now ── */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-[#FFAA4D] px-5 py-4">
              <h2 className="font-semibold text-[#1A1A1A]">Complete Payment</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Success notice */}
              <div className="flex items-center gap-2 bg-[#EBF2FF] rounded-lg px-4 py-3">
                <FiCheckCircle className="w-5 h-5 text-[#2B80FF] shrink-0" />
                <span className="text-sm font-semibold text-[#2B80FF]">
                  {location.state?.pendingOrder
                    ? "Pending Order Recovered"
                    : "Order placed successfully"}
                </span>
              </div>

              {/* Order ID */}
              <div className="bg-[#EBF2FF] rounded-lg px-4 py-3">
                <p className="text-xs text-[#555555] mb-0.5">Order ID</p>
                <p className="text-sm font-mono text-[#1A1A1A]">{order._id}</p>
              </div>

              {/* Order Items */}
              {order.orderItems?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#555555] uppercase tracking-wide">
                    Items Ordered
                  </p>
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                    {order.orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-[#EBF2FF] px-4 py-3"
                      >
                        <ItemImage
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg border border-white/60 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#555555] mt-0.5">
                            Qty: {item.quantity} × ₦
                            {Number(item.price).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[#1A1A1A] shrink-0">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info text */}
              <p className="text-sm text-[#555555]">
                Complete payment to confirm your order and notify sellers to
                dispatch your items.
              </p>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-semibold text-[#1A1A1A]">Total</span>
                <span className="text-lg font-bold text-[#FF8C00]">
                  ₦{order.totalPrice.toLocaleString()}
                </span>
              </div>

              <PayButton
                orderId={order._id}
                email={user?.email}
                amount={order.totalPrice}
                onSuccessCallback={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        )}
      </div>

      <MessageModal
        open={msgOpen}
        message={msg}
        onClose={() => setMsgOpen(false)}
      />
    </div>
  );
}
