import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  forgotPassword as forgotPasswordRequest,
  resetPassword,
} from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import MessageModal from "../components/MessageModal";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const showError = (error, fallback) => {
    const data = error.response?.data;
    setMsg(data?.errors?.[0]?.message || data?.message || fallback);
    setMsgOpen(true);
  };

  const requestCode = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const res = await forgotPasswordRequest({ email });
      // The API intentionally gives the same answer whether or not the
      // email has an account, so nobody can probe registered addresses.
      setNotice(
        res.data?.message ||
          "If an account exists for this email, a code has been sent.",
      );
      setStep("reset");
    } catch (error) {
      showError(error, "Could not request a reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMsg("The new passwords do not match.");
      setMsgOpen(true);
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword({ email, otp, password });
      const { token, _id, name, role, isVerified } = res.data;
      if (token) {
        login(token, {
          _id,
          name,
          email: res.data.email || email,
          role: role || "customer",
          isVerified,
        });
        navigate("/profile", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      showError(error, "Could not reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
        <p className="text-sm text-secondary mb-6">
          {step === "email"
            ? "Enter your account email and we will send you a 6-digit reset code."
            : "Enter the 6-digit code from your email and choose a new password."}
        </p>

        {notice && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={requestCode} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field w-full"
              placeholder="Email address"
              autoComplete="email"
              required
            />
            <button
              type="submit"
              className="primary-btn w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="space-y-4">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field w-full"
              placeholder="Email address"
              autoComplete="email"
              required
            />
            <input
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="input-field w-full tracking-[0.4em]"
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field w-full"
              placeholder="New password"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input-field w-full"
              placeholder="Confirm new password"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button
              type="submit"
              className="primary-btn w-full"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
            <button
              type="button"
              onClick={requestCode}
              disabled={loading || !email}
              className="w-full text-sm font-medium text-[#047857] hover:underline disabled:opacity-50"
            >
              Send another code
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-secondary">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-[#047857]">
            Back to sign in
          </Link>
        </p>

        <MessageModal
          open={msgOpen}
          message={msg}
          onClose={() => setMsgOpen(false)}
        />
      </div>
    </main>
  );
}
