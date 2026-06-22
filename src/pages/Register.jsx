import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  register as apiRegister,
  login as apiLogin,
} from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import MessageModal from "../components/MessageModal";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Step 1: Register the account
      await apiRegister({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // Step 2: Immediately log in so user lands on the right dashboard
      const loginRes = await apiLogin({
        email: form.email,
        password: form.password,
      });

      const token = loginRes.data.token;
      const user = {
        _id: loginRes.data._id,
        name: loginRes.data.name,
        email: loginRes.data.email,
        role: loginRes.data.role || "customer",
      };

      login(token, user);
      navigate("/", { replace: true });
    } catch (err) {
      // Show the first field-level error if available, otherwise the top-level message
      const data = err.response?.data;
      const fieldError = data?.errors?.[0]?.message;
      setMsg(fieldError || data?.message || "Registration failed");
      setMsgOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold mb-2">Create account</h1>
        <p className="text-sm text-secondary mb-6">
          Join TronMarket and start shopping
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Full name"
              required
            />
          </label>

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
              {loading ? "Creating..." : "Create account"}
            </button>

            <Link to="/login" className="text-sm text-secondary">
              Already have an account?
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

export default Register;
