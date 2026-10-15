import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as apiRegister } from "../services/authService";
import { toast } from "react-toastify";

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  const meta = [
    { label: "Weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-emerald-500" },
    { label: "Strong", color: "bg-emerald-600" },
  ][score];
  return { score, ...meta };
}

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const strength = passwordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiRegister({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      try {
        sessionStorage.setItem(
          "tronmarket:pendingVerificationEmail",
          form.email.trim(),
        );
      } catch {
        // navigation state below still carries the email
      }
      navigate("/verify-otp", { state: { email: form.email }, replace: true });
    } catch (err) {
      const data = err.response?.data;
      const fieldError = data?.errors?.[0]?.message;
      toast.error(fieldError || data?.message || "Registration failed");
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
            {form.password && (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Password strength: <span className="text-gray-700">{strength.label}</span>
                  {strength.score < 3 && <span className="font-normal"> — mix length, cases, numbers and symbols.</span>}
                </p>
              </div>
            )}
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
              {loading ? "Creating..." : "Create account"}
            </button>
            <Link to="/login" className="text-sm text-secondary">
              Already have an account?
            </Link>
          </div>
        </form>

      </div>
    </main>
  );
};

export default Register;
