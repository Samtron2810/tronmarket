import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyOtp, resendOtp } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import MessageModal from "../components/MessageModal";

const RESEND_COOLDOWN = 60;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const email = location.state?.email || "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  const otp = digits.join("");

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);
    const lastIdx = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      setMsg("Please enter all 6 digits.");
      setMsgOpen(true);
      return;
    }
    try {
      setLoading(true);
      const res = await verifyOtp({ email, otp });
      const { token, _id, name, email: resEmail, role } = res.data;
      login(token, { _id, name, email: resEmail, role });
      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setMsg(data?.message || "Verification failed. Please try again.");
      setMsgOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    try {
      setResending(true);
      await resendOtp({ email });
      setCountdown(RESEND_COOLDOWN);
      setMsg("A new code has been sent to your email.");
      setMsgOpen(true);
    } catch (err) {
      const data = err.response?.data;
      setMsg(data?.message || "Failed to resend code.");
      setMsgOpen(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="page-container flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md card p-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-[#2B80FF] flex items-center justify-center text-2xl">
            ✉️
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-1 text-center">
          Verify your email
        </h1>
        <p className="text-sm text-secondary mb-1 text-center">
          We sent a 6-digit code to
        </p>
        <p className="text-sm font-semibold text-center text-[#2B80FF] mb-6 break-all">
          {email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={[
                  "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-[#EBF2FF] outline-none transition-colors",
                  d
                    ? "border-[#2B80FF] text-[#1A1A1A]"
                    : "border-gray-200 text-[#1A1A1A]",
                  "focus:border-[#2B80FF]",
                ].join(" ")}
              />
            ))}
          </div>

          <button
            type="submit"
            className="primary-btn w-full"
            disabled={loading || otp.length < 6}
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-secondary">
          Didn't receive the code?{" "}
          {countdown > 0 ? (
            <span className="text-gray-400">Resend in {countdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-[#2B80FF] font-semibold hover:underline disabled:opacity-50 cursor-pointer"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          )}
        </div>

        <div className="mt-3 text-center">
          <Link
            to="/register"
            className="text-xs text-secondary hover:underline"
          >
            ← Back to registration
          </Link>
        </div>
      </div>

      <MessageModal
        open={msgOpen}
        message={msg}
        onClose={() => setMsgOpen(false)}
      />
    </main>
  );
}
