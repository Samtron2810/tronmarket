import { useState } from "react";
import { usePaystackPayment } from "react-paystack";
import { FiLock, FiLoader } from "react-icons/fi";
import api from "../services/api";

export default function PayButton({
  orderId,
  email,
  amount,
  onSuccessCallback,
  onError,
}) {
  const [verifying, setVerifying] = useState(false);

  const config = {
    reference: `TRON-${orderId}-${Date.now()}`,
    email,
    // Paystack expects amount in kobo (lowest currency unit)
    amount: Math.round(Number(amount) * 100),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    currency: "NGN",
    metadata: {
      orderId,
      custom_fields: [],
    },
  };

  const initializePayment = usePaystackPayment(config);

  const handleSuccess = async (reference) => {
    setVerifying(true);
    try {
      const res = await api.post("/payments/verify", {
        reference: reference.reference,
        orderId,
      });

      if (res.data.success) {
        onSuccessCallback?.(res.data.order);
      } else {
        onError?.(res.data.message || "Payment verification failed");
      }
    } catch (err) {
      onError?.(
        err.response?.data?.message ||
          "Could not verify payment. Please contact support.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    onError?.("Payment window closed. Your order is still pending.");
  };

  return (
    <button
      type="button"
      disabled={verifying}
      onClick={() =>
        initializePayment({ onSuccess: handleSuccess, onClose: handleClose })
      }
      className="primary-btn w-full flex items-center justify-center gap-2"
      style={{
        opacity: verifying ? 0.7 : 1,
        cursor: verifying ? "not-allowed" : "pointer",
      }}
    >
      {verifying ? (
        <>
          <FiLoader className="animate-spin" />
          Verifying payment...
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
