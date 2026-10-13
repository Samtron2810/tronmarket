import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  createOrder,
  getOrderById,
  getShippingQuote,
} from "../services/orderService";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import MessageModal from "../components/MessageModal";
import PayButton from "../components/PayButton";
import ItemImage from "../components/ItemImage";
import { FaArrowLeft } from "react-icons/fa";
import { FiCheckCircle, FiAlertTriangle, FiLoader } from "react-icons/fi";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const {
    cart,
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
  const [stockErrorMode, setStockErrorMode] = useState("adjusted");
  const [shippingQuote, setShippingQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [order, setOrder] = useState(location.state?.pendingOrder || null);

  const paymentDeadline = order?.paymentExpiresAt
    ? new Date(order.paymentExpiresAt).getTime()
    : null;
  const secondsLeft =
    paymentDeadline && order?.status === "pending"
      ? Math.max(0, Math.floor((paymentDeadline - now) / 1000))
      : null;
  const paymentExpired = secondsLeft === 0;
  const countdownLabel =
    secondsLeft === null
      ? null
      : `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
          secondsLeft % 60,
        ).padStart(2, "0")}`;

  useEffect(() => {
    if (!paymentDeadline || order?.status !== "pending") return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [paymentDeadline, order?.status]);

  // Returning from Paystack's hosted checkout: the reference arrives as a
  // query param and must be verified with the backend (which checks the
  // amount, currency and order binding) before we show the success page.
  const [verifyingReturn, setVerifyingReturn] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get("reference") || params.get("trxref"));
  });
  const returnHandledRef = useRef(false);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference || returnHandledRef.current) return;
    returnHandledRef.current = true;

    let stored = null;
    try {
      stored = JSON.parse(
        sessionStorage.getItem("tronmarket:pendingPayment") || "null",
      );
    } catch {
      stored = null;
    }

    let cancelled = false;
    (async () => {
      if (stored?.reference && stored.reference !== reference) {
        if (cancelled) return;
        setMsg(
          "That payment does not match the order you started checkout with. If money left your account, please contact support.",
        );
        setMsgOpen(true);
        setVerifyingReturn(false);
        navigate("/checkout", { replace: true });
        return;
      }

      try {
        const res = await api.post("/payments/verify", {
          reference,
          ...(stored?.orderId ? { orderId: stored.orderId } : {}),
        });
        if (cancelled) return;
        try {
          sessionStorage.removeItem("tronmarket:pendingPayment");
        } catch {
          // ignore storage errors
        }
        if (res.data.success) {
          handlePaymentSuccess(res.data.order);
        }
      } catch (err) {
        if (cancelled) return;
        setMsg(
          err.response?.data?.message ||
            "Could not verify payment. Please contact support.",
        );
        setMsgOpen(true);
        // Show the still-pending order again so the buyer can retry.
        if (stored?.orderId) {
          try {
            const orderRes = await getOrderById(stored.orderId);
            if (!cancelled) setOrder(orderRes.data);
          } catch {
            // leave the shipping form hidden behind the payment panel
          }
        }
        setVerifyingReturn(false);
        navigate("/checkout", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
    // Runs once on return from Paystack; navigation/state helpers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const cartItemsSubtotal = (cart?.items || []).reduce((sum, item) => {
    const price = Number(item.variant?.price ?? item.product?.price ?? 0);
    return sum + price * Number(item.quantity || 0);
  }, 0);
  const visibleShippingQuote =
    shippingQuote?.state?.trim().toLowerCase() ===
    form.state.trim().toLowerCase()
      ? shippingQuote
      : null;

  // Shipping is priced by the server from the delivery state. Refresh the
  // quote as the state settles so the buyer sees delivery before ordering;
  // the order endpoint recalculates it and never trusts this display value.
  useEffect(() => {
    const state = form.state.trim();
    if (order || state.length < 2 || cartItemsSubtotal <= 0) {
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const res = await getShippingQuote(state);
        if (!cancelled) setShippingQuote(res.data);
      } catch {
        if (!cancelled) setShippingQuote(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cartItemsSubtotal, form.state, order]);

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
        // Stock issues found — auto-fix what we can, then stop for user
        // review. The variant matters: two variants of one product are
        // separate cart lines with separate stock.
        for (const err of validation.errors) {
          if (["out_of_stock", "unavailable", "deleted"].includes(err.reason)) {
            await removeItemLocal(err.productId, err.variantId || null);
          } else if (err.reason === "insufficient") {
            await updateQtyLocal(
              err.productId,
              err.availableStock,
              err.variantId || null,
            );
          }
        }

        // Save errors to show the user what changed
        setStockErrorMode("adjusted");
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
      const details =
        err.response?.data?.details || err.response?.data?.errors;
      if (err.response?.status === 409 && Array.isArray(details)) {
        // Nothing was ordered and the cart was left untouched — show the
        // exact lines that need attention instead of a generic failure.
        setStockErrorMode("blocked");
        setStockErrors(details);
      } else {
        setMsg(err.response?.data?.message || "Error placing order");
        setMsgOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-[#ECFDF5] border border-[#047857]/20 rounded-lg px-3 py-2.5 text-sm text-[#101828] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#047857]";

  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-10 sm:px-6 lg:px-8">
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
          <h1 className="text-2xl font-bold text-[#101828]">Checkout</h1>
          <p className="text-sm text-[#667085] mt-1">
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
                {stockErrorMode === "blocked"
                  ? "Some items could not be ordered"
                  : "Cart updated — stock availability changed"}
              </p>
            </div>
            <ul className="space-y-1">
              {stockErrors.map((err) => (
                <li
                  key={`${err.productId}:${err.variantId || ""}`}
                  className="text-xs text-amber-700"
                >
                  •{" "}
                  <span className="font-semibold">
                    {err.name || "Item"}
                    {err.variantLabel ? ` — ${err.variantLabel}` : ""}
                  </span>
                  :{" "}
                  {err.reason === "insufficient"
                    ? stockErrorMode === "blocked"
                      ? `Only ${err.availableStock} available — not ordered`
                      : `Quantity reduced to ${err.availableStock} (only available)`
                    : stockErrorMode === "blocked"
                      ? "Unavailable — not ordered"
                      : "Removed — no longer available"}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-600 mt-2">
              {stockErrorMode === "blocked"
                ? "Your cart has been left unchanged. Please adjust these items and try again."
                : "Please review your cart and submit again when ready."}
            </p>
          </div>
        )}

        {verifyingReturn ? (
          /* ── Returning from Paystack — verifying ── */
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FiLoader className="animate-spin w-8 h-8 text-[#047857] mx-auto mb-3" />
            <h2 className="font-semibold text-[#101828]">Verifying payment…</h2>
            <p className="text-sm text-[#667085] mt-1">
              Please wait while we confirm your payment with Paystack.
            </p>
          </div>
        ) : !order ? (
          /* ── Shipping Form ── */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-[#ECFDF5] px-5 py-4">
              <h2 className="font-semibold text-[#101828]">
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

              <div className="rounded-lg border border-emerald-100 bg-[#ECFDF5] px-4 py-3 text-sm">
                <div className="flex justify-between py-0.5">
                  <span className="text-[#667085]">Items subtotal</span>
                  <span className="font-semibold">NGN {cartItemsSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-[#667085]">
                    Delivery{visibleShippingQuote?.shippingZone ? ` (${visibleShippingQuote.shippingZone})` : ""}
                  </span>
                  <span className="font-semibold">
                    {quoteLoading
                      ? "Calculating…"
                      : visibleShippingQuote
                        ? visibleShippingQuote.freeShipping
                          ? "FREE"
                          : `NGN ${Number(visibleShippingQuote.shippingPrice).toLocaleString()}`
                        : "Enter delivery state"}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-emerald-200 pt-2 font-bold">
                  <span>Total to pay</span>
                  <span>NGN {Number(visibleShippingQuote?.totalPrice ?? cartItemsSubtotal).toLocaleString()}</span>
                </div>
                {visibleShippingQuote?.freeShipping && (
                  <p className="mt-1 text-xs text-[#047857]">Your order qualifies for free shipping.</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading || validating}
                  className="px-5 py-2.5 rounded-lg bg-[#047857] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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
            <div className="bg-[#ECFDF5] px-5 py-4">
              <h2 className="font-semibold text-[#101828]">Complete Payment</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Success notice */}
              <div className="flex items-center gap-2 bg-[#ECFDF5] rounded-lg px-4 py-3">
                <FiCheckCircle className="w-5 h-5 text-[#047857] shrink-0" />
                <span className="text-sm font-semibold text-[#047857]">
                  {location.state?.pendingOrder
                    ? "Pending Order Recovered"
                    : "Order placed successfully"}
                </span>
              </div>

              {/* Order ID */}
              <div className="bg-[#ECFDF5] rounded-lg px-4 py-3">
                <p className="text-xs text-[#667085] mb-0.5">Order ID</p>
                <p className="text-sm font-mono text-[#101828]">{order._id}</p>
              </div>

              {/* Order Items */}
              {order.orderItems?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wide">
                    Items Ordered
                  </p>
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                    {order.orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-[#ECFDF5] px-4 py-3"
                      >
                        <ItemImage
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg border border-white/60 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#101828] truncate">
                            {item.name}
                            {item.variantLabel ? ` — ${item.variantLabel}` : ""}
                          </p>
                          <p className="text-xs text-[#667085] mt-0.5">
                            Qty: {item.quantity} × ₦
                            {Number(item.price).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[#101828] shrink-0">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment deadline — unpaid orders release their stock */}
              {paymentDeadline && order.status === "pending" && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    paymentExpired
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                  role="status"
                >
                  {paymentExpired ? (
                    <>
                      <span className="font-semibold">
                        This payment window has expired.
                      </span>{" "}
                      The reserved items have been released. Please place a
                      new order to continue.
                    </>
                  ) : (
                    <>
                      Pay within{" "}
                      <span className="font-bold tabular-nums">
                        {countdownLabel}
                      </span>{" "}
                      to keep these items reserved for you.
                    </>
                  )}
                </div>
              )}

              {/* Info text */}
              <p className="text-sm text-[#667085]">
                Complete payment to confirm your order and notify sellers to
                dispatch your items.
              </p>

              {/* Totals — delivery is part of the amount sent to Paystack */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#667085]">Items subtotal</span>
                  <span>₦{Number(order.itemsSubtotal ?? Math.max(0, order.totalPrice - (order.shippingPrice || 0))).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085]">Delivery{order.shippingZone ? ` (${order.shippingZone})` : ""}</span>
                  <span>{Number(order.shippingPrice || 0) === 0 ? "FREE" : `₦${Number(order.shippingPrice).toLocaleString()}`}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="font-semibold text-[#101828]">Total</span>
                  <span className="text-lg font-bold text-[#B45309]">
                    ₦{order.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {paymentExpired ? (
                <button
                  type="button"
                  onClick={() => setOrder(null)}
                  className="primary-btn w-full"
                >
                  Start a new order
                </button>
              ) : (
                <PayButton
                  orderId={order._id}
                  email={user?.email}
                  amount={order.totalPrice}
                  onSuccessCallback={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onPaymentExpired={() => {
                    setOrder(null);
                    setMsg(
                      "This order's payment window has expired. Your cart items may need to be checked out again.",
                    );
                    setMsgOpen(true);
                  }}
                />
              )}
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
