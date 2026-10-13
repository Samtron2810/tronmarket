import { useState } from "react";
import { FiLock, FiLoader } from "react-icons/fi";
import api from "../services/api";

const PENDING_PAYMENT_KEY = "tronmarket:pendingPayment";

// Payment is initialised on the SERVER: the backend fixes the amount,
// currency, reference and order binding and records the Payment row before
// Paystack is involved, then hands us a hosted-checkout URL. The browser
// never decides what is being charged, and the reference it comes back
// with can only ever pay for this one order.
export default function PayButton({
  orderId,
  amount,
  onError,
  onPaymentExpired,
}) {
  const [redirecting, setRedirecting] = useState(false);

  const handlePay = async () => {
    setRedirecting(true);
    try {
      const res = await api.post("/payments/initialize", {
        orderId,
        callbackUrl: `${window.location.origin}/checkout`,
      });

      const { authorization_url: authorizationUrl, reference } = res.data;
      if (!authorizationUrl || !reference) {
        throw new Error("Payment could not be initialized");
      }

      // Remember which order this reference belongs to so Checkout can
      // verify it when Paystack redirects back (the backend can also
      // derive the order from the reference on its own).
      try {
        sessionStorage.setItem(
          PENDING_PAYMENT_KEY,
          JSON.stringify({ orderId, reference, createdAt: Date.now() }),
        );
      } catch {
        // Private browsing etc. — verification still works via the
        // server-side reference binding.
      }

      window.location.assign(authorizationUrl);
    } catch (err) {
      if (err.response?.status === 410 && onPaymentExpired) {
        onPaymentExpired(err.response?.data?.order || null);
      } else {
        onError?.(
          err.response?.data?.message ||
            err.message ||
            "Could not start payment. Please try again.",
        );
      }
      setRedirecting(false);
    }
  };

  return (
    <button
      type="button"
      disabled={redirecting}
      onClick={handlePay}
      className="primary-btn w-full flex items-center justify-center gap-2"
      style={{
        opacity: redirecting ? 0.7 : 1,
        cursor: redirecting ? "not-allowed" : "pointer",
      }}
    >
      {redirecting ? (
        <>
          <FiLoader className="animate-spin" />
          Redirecting to Paystack...
        </>
      ) : (
        <>
          <FiLock />
          Pay ₦{Number(amount).toLocaleString()} with Paystack
        </>
      )}
    </button>
  );
}
