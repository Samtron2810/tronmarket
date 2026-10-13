import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { FaHome, FaStore } from "react-icons/fa";
import { changePassword } from "../services/authService";

export default function Profile() {
  const { user, login, refreshUser, handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    refreshUser();
    // One account refresh when the profile opens (picks up role changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user)
    return (
      <div className="page-container p-6">
        <p className="text-secondary">No profile available.</p>
      </div>
    );

  const handlePasswordChange = (event) => {
    setPasswordForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      // The server invalidates older sessions and returns a fresh token
      // for this one.
      if (res.data.token) {
        login(res.data.token, {
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          isVerified: res.data.isVerified,
        });
      }
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage(
        res.data.message || "Password changed successfully.",
      );
    } catch (error) {
      const data = error.response?.data;
      setPasswordError(
        data?.errors?.[0]?.message ||
          data?.message ||
          "Could not change your password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="page-container p-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#101828] hover:opacity-80 transition-opacity mb-4 group"
      >
        <FaHome className="transform group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <div className="max-w-xl card p-6 text-center mx-auto">
        <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
        <div className="space-y-2 mb-6">
          <div>
            <div className="text-sm text-secondary">Name</div>
            <div className="font-medium">{user.name}</div>
          </div>
          <hr className="border border-emerald-200 my-4 w-1/2 mx-auto" />
          <div>
            <div className="text-sm text-secondary">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <hr className="border border-emerald-200 my-4 w-1/2 mx-auto" />
          <div>
            <div className="text-sm text-secondary">Role</div>
            <div className="font-medium capitalize">
              {user.role || "customer"}
            </div>
          </div>
        </div>
        <hr className="border border-emerald-200 my-4 w-1/2 mx-auto" />

        {user.role === "customer" && (
          <div className="mb-6">
            <Link
              to="/apply-seller"
              className="inline-block px-6 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              <span>Apply for Seller Role</span>{" "}
              <FaStore className="inline-block ml-2" />
            </Link>
            <p className="mt-2 text-xs text-secondary">
              Submit an application and track its review status.
            </p>
            <hr className="border border-emerald-200 my-4 w-1/2 mx-auto" />
          </div>
        )}

        {user.role === "seller" && (
          <div className="mb-6">
            <Link
              to="/seller"
              className="inline-block px-6 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              <span>Open Seller Dashboard</span>{" "}
              <FaStore className="inline-block ml-2" />
            </Link>
            <hr className="border border-emerald-200 my-4 w-1/2 mx-auto" />
          </div>
        )}

        {user.role === "admin" && (
          <div className="mb-6">
            <Link
              to="/admin/seller-applications"
              className="inline-block px-6 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              Review Seller Applications
            </Link>
            <hr className="border border-emerald-200 my-4 w-1/2 mx-auto" />
          </div>
        )}

        <form
          onSubmit={submitPasswordChange}
          className="mx-auto mb-6 max-w-md space-y-3 text-left"
        >
          <h3 className="text-center text-base font-bold">Change password</h3>
          {passwordMessage && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {passwordMessage}
            </p>
          )}
          {passwordError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </p>
          )}
          <input
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
            className="input-field w-full"
            placeholder="Current password"
            autoComplete="current-password"
            required
          />
          <input
            type="password"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            className="input-field w-full"
            placeholder="New password"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            value={passwordForm.confirmPassword}
            onChange={handlePasswordChange}
            className="input-field w-full"
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={changingPassword}
            className="primary-btn w-full disabled:opacity-50"
          >
            {changingPassword ? "Changing..." : "Change password"}
          </button>
        </form>

        <div className="flex justify-center">
          <button
            onClick={async () => {
              await handleLogout();
              navigate("/", { replace: true });
            }}
            className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold cursor-pointer hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
