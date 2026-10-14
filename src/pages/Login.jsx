import { useState, useContext } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  login as apiLogin,
  twoFactorLogin,
  googleLogin,
} from "../services/authService";
import GoogleButton from "../components/GoogleButton";
import { AuthContext } from "../context/AuthContext";
import MessageModal from "../components/MessageModal";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [twoFactor, setTwoFactor] = useState(null); // { pendingToken }
  const [totpCode, setTotpCode] = useState("");

  const finishLogin = (data) => {
    const { token, _id, name, email, role } = data;
    if (!token) {
      setMsg("Login failed");
      setMsgOpen(true);
      return;
    }
    login(token, { _id, name, email, role: role || "customer" });
    navigate(from, { replace: true });
  };

  const handleGoogleCredential = async (idToken) => {
    try {
      setLoading(true);
      const res = await googleLogin({ idToken });
      if (res.data.requiresTwoFactor) {
        setTwoFactor({ pendingToken: res.data.pendingToken });
        return;
      }
      finishLogin(res.data);
    } catch (err) {
      setMsg(err.response?.data?.message || "Google sign-in failed");
      setMsgOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await twoFactorLogin({
        pendingToken: twoFactor.pendingToken,
        code: totpCode,
      });
      finishLogin(res.data);
    } catch (err) {
      setMsg(err.response?.data?.message || "That code is not valid. Try again.");
      setMsgOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiLogin(form);
      if (res.data.requiresTwoFactor) {
        setTwoFactor({ pendingToken: res.data.pendingToken });
        return;
      }
      finishLogin(res.data);
    } catch (err) {
      const data = err.response?.data;

      // Server signals unverified account — redirect silently to OTP page
      if (data?.requiresVerification && data?.email) {
        try {
          sessionStorage.setItem(
            "tronmarket:pendingVerificationEmail",
            data.email,
          );
        } catch {
          // navigation state below still carries the email
        }
        navigate("/verify-otp", { state: { email: data.email } });
        return;
      }

      const fieldError = data?.errors?.[0]?.message;
      setMsg(fieldError || data?.message || "Error logging in");
      setMsgOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-sm text-secondary mb-6">
          Sign in to continue to TronMarket
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Email"
              required
            />
          </label>

          <label className="block">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Password"
              required
            />
            <div className="mt-2 flex items-center gap-2 text-sm">
              <input
                id="show-password"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="show-password" className="select-none">
                Show password
              </label>
            </div>
          </label>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="submit"
              className="primary-btn w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <Link to="/register" className="text-sm text-secondary">
              Create account
            </Link>
          </div>
          <p className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[#047857] hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
        </form>

        {twoFactor ? (
          <form onSubmit={handleTwoFactorSubmit} className="mt-6 space-y-4 border-t border-gray-100 pt-5">
            <p className="text-sm text-secondary">
              Enter the 6-digit code from your authenticator app to finish signing in.
            </p>
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="input-field w-full tracking-[0.5em] text-center text-lg"
              placeholder="••••••"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
            <div className="flex gap-3">
              <button type="submit" className="primary-btn flex-1" disabled={loading || totpCode.length !== 6}>
                {loading ? "Verifying..." : "Verify & sign in"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => { setTwoFactor(null); setTotpCode(""); }}
              >
                Back
              </button>
            </div>
          </form>
        ) : (
          <GoogleButton onCredential={handleGoogleCredential} onError={(m) => { setMsg(m); setMsgOpen(true); }} />
        )}

        <MessageModal
          open={msgOpen}
          message={msg}
          onClose={() => setMsgOpen(false)}
        />
      </div>
    </main>
  );
};

export default Login;
