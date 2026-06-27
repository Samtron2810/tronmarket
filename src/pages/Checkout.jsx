import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // 1. Added useLocation
import { createOrder } from "../services/orderService";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import MessageModal from "../components/MessageModal";
import PayButton from "../components/PayButton";
import { FaArrowLeft } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Initialize useLocation
  const { user } = useContext(AuthContext);
  const { fetchCart } = useContext(CartContext);

  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 3. THE FIX: Grab the pending order from the router state if it exists!
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
    setLoading(true);
    try {
      const res = await createOrder({ shippingAddress: form });
      setOrder(res.data);
      fetchCart(); // sync cart immediately — backend already cleared it
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
        className=" flex items-center gap-2 max-w-3xl mx-auto mb-6 cursor-pointer text-black hover:gap-3 transition-ease-in-out duration-200"
        onClick={() => navigate(-1)}
      >
        <span>
          <FaArrowLeft />{" "}
        </span>
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
                onChange={handleChange}
                className={inputCls}
              />
              <input
                name="phone"
                placeholder="Phone Number"
                onChange={handleChange}
                className={inputCls}
              />
              <input
                name="address"
                placeholder="Street Address"
                onChange={handleChange}
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  placeholder="City"
                  onChange={handleChange}
                  className={inputCls}
                />
                <input
                  name="state"
                  placeholder="State"
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-[#2B80FF] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Placing order…" : "Place Order"}
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
                        <img
                          src={item.image || "https://via.placeholder.com/150"}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg border border-white/60 shrink-0"
                          loading="lazy"
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
