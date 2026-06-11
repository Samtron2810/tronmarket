import React, { useState, useContext } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login as apiLogin } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import MessageModal from "../components/MessageModal";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await apiLogin(form);
      const token = res.data.token;

      if (token) {
        // decode token to extract role/id
        let payload = null;
        try {
          payload = JSON.parse(atob(token.split(".")[1]));
        } catch (err) {}

        const user = {
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: payload?.role || res.data.role || "customer",
        };
        login(token, user);
        navigate(from, { replace: true });
      } else {
        setMsg("Login failed");
        setMsgOpen(true);
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Error logging in");
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

          <div className="flex justify-between items-center">
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <Link to="/register" className="text-sm text-secondary">
              Create account
            </Link>
          </div>
        </form>
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
