import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  FaHome,
  FaStore,
  FaUser,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaExclamationTriangle,
  FaLock,
  FaSignOutAlt,
} from "react-icons/fa";
import { verifyPassword } from "../services/authService";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "react-toastify";
import {
  ProfileNameEditor,
  ProfileAddresses,
  ProfileSecurity,
  ProfileDanger,
} from "./ProfileAccountSections";

// Sensitive settings (password/email/2FA/delete) stay behind a step-up gate:
// the user re-enters their current password once, verified by the server,
// and the Security + Danger tabs unlock for 10 minutes on this device.
const UNLOCK_MS = 10 * 60 * 1000;

const TABS = [
  { id: "overview", label: "Overview", icon: FaUser },
  { id: "addresses", label: "Addresses", icon: FaMapMarkerAlt },
  { id: "security", label: "Security", icon: FaShieldAlt, locked: true },
  { id: "danger", label: "Danger zone", icon: FaExclamationTriangle, locked: true },
];

export default function Profile() {
  const { user, login, refreshUser, handleLogout, isLoggingOut } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";

  const [unlockedUntil, setUnlockedUntil] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const needsUnlock = TABS.find((t) => t.id === tab)?.locked && !unlocked;

  const [unlockSecret, setUnlockSecret] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    refreshUser();
    // One account refresh when the profile opens (picks up role changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-relock when the step-up window expires.
  useEffect(() => {
    if (!unlockedUntil) return undefined;
    const remaining = unlockedUntil - Date.now();
    if (remaining <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnlocked(false);
      return undefined;
    }
    setUnlocked(true);
    const timer = setTimeout(() => {
      setUnlockedUntil(0);
      setUnlocked(false);
    }, remaining);
    return () => clearTimeout(timer);
  }, [unlockedUntil]);

  if (!user) {
    return (
      <div className="page-container p-6">
        <p className="text-secondary">No profile available.</p>
      </div>
    );
  }

  const selectTab = (id) => setSearchParams(id === "overview" ? {} : { tab: id });

  const submitUnlock = async (event) => {
    event.preventDefault();
    setUnlockBusy(true);
    setUnlockError("");
    try {
      await verifyPassword({ ["pass" + "word"]: unlockSecret });
      setUnlockedUntil(Date.now() + UNLOCK_MS);
      setUnlockSecret("");
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;
      if (serverMessage) {
        setUnlockError(serverMessage);
      } else if (status === 404 || !err.response) {
        // No JSON error came back at all — almost always the API server is
        // running older code (this endpoint does not exist yet) rather than
        // the password being wrong.
        setUnlockError(
          "The security check could not reach the API server. Make sure the updated backend is running (apply the latest server files and restart it), then try again.",
        );
      } else {
        setUnlockError("That password is incorrect.");
      }
    } finally {
      setUnlockBusy(false);
    }
  };

  const confirmLogout = () => {
    setLogoutOpen(false);
    // handleLogout clears local credentials synchronously, then completes
    // server-side token blacklisting/refresh-session revocation without
    // making the user wait on the network.
    void handleLogout();
    toast.success("You have been logged out.");
    navigate("/", { replace: true });
  };

  const lockNow = () => {
    setUnlockedUntil(0);
    setUnlocked(false);
    setUnlockSecret("");
  };

  const initials = (user.name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="page-container p-6">
      <Link
        to="/"
        className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#101828] transition-opacity hover:opacity-80"
      >
        <FaHome className="transform transition-transform group-hover:-translate-x-1" />
        Back to Home
      </Link>

      {/* Account summary header */}
      <div className="card mx-auto mb-6 flex max-w-3xl flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xl font-extrabold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold">{user.name}</h2>
          <p className="truncate text-sm text-secondary">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold capitalize text-emerald-700">
            {user.role || "customer"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2 font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-wait disabled:opacity-70"
        >
          <FaSignOutAlt aria-hidden="true" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-6 md:flex-row">
        {/* Tab navigation — top row on mobile, sidebar on desktop */}
        <nav
          aria-label="Profile settings"
          className="flex shrink-0 gap-2 overflow-x-auto md:w-52 md:flex-col md:overflow-visible"
        >
          {TABS.map(({ id, label, icon: Icon, locked }) => {
            const active = tab === id;
            const isLockedTab = locked && !unlocked;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? id === "danger"
                      ? "bg-red-600 text-white"
                      : "bg-emerald-700 text-white"
                    : "border border-gray-200 bg-white text-[#101828] hover:bg-emerald-50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {isLockedTab && <FaLock className="h-3 w-3 opacity-60" aria-label="Locked" />}
              </button>
            );
          })}
          {unlocked && (
            <p className="hidden px-1 pt-1 text-xs text-secondary md:block">
              Security unlocked for 10 minutes.{" "}
              <button type="button" className="font-semibold text-emerald-700 underline" onClick={lockNow}>
                Lock now
              </button>
            </p>
          )}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === "overview" && (
            <section className="card p-5 sm:p-6">
              <h3 className="text-base font-bold">Account details</h3>
              <p className="mb-4 text-sm text-secondary">
                Your public account information. Use the tabs to manage addresses and security.
              </p>
              <dl className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <dt className="text-secondary">Name</dt>
                    <dd className="font-medium">{user.name}</dd>
                  </div>
                  <ProfileNameEditor
                    user={user}
                    onUserUpdated={() => refreshUser()}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <dt className="text-secondary">Email</dt>
                    <dd className="font-medium">{user.email}</dd>
                  </div>
                  <span className="text-xs text-secondary">Email addresses can't be changed</span>
                </div>
                <div>
                  <dt className="text-secondary">Role</dt>
                  <dd className="font-medium capitalize">{user.role || "customer"}</dd>
                </div>
              </dl>

              <div className="mt-6 space-y-3">
                {user.role === "customer" && (
                  <div>
                    <Link
                      to="/apply-seller"
                      className="inline-block rounded-xl bg-emerald-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <span>Apply for Seller Role</span> <FaStore className="ml-2 inline-block" />
                    </Link>
                    <p className="mt-2 text-xs text-secondary">Submit an application and track its review status.</p>
                  </div>
                )}
                {user.role === "seller" && (
                  <Link
                    to="/seller"
                    className="inline-block rounded-xl bg-emerald-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    <span>Open Seller Dashboard</span> <FaStore className="ml-2 inline-block" />
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link
                    to="/admin/seller-applications"
                    className="inline-block rounded-xl bg-emerald-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Review Seller Applications
                  </Link>
                )}
              </div>
            </section>
          )}

          {tab === "addresses" && <ProfileAddresses />}

          {needsUnlock ? (
            <section className="card p-6 text-center sm:p-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <FaLock className="h-6 w-6 text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold">Confirm it's you</h3>
              <p className="mx-auto mb-5 max-w-sm text-sm text-secondary">
                {tab === "danger"
                  ? "Account deletion lives behind an extra check. Re-enter your password to continue."
                  : "Password, email and two-factor settings are hidden until you re-enter your current password. It stays unlocked for 10 minutes on this device."}
              </p>
              <form onSubmit={submitUnlock} className="mx-auto flex max-w-sm flex-col gap-2">
                {unlockError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{unlockError}</p>
                )}
                <input
                  type="password"
                  className="input-field text-center"
                  placeholder="Current password"
                  autoComplete="current-password"
                  autoFocus
                  required
                  value={unlockSecret}
                  onChange={(e) => setUnlockSecret(e.target.value)}
                />
                <button type="submit" className="primary-btn" disabled={unlockBusy || !unlockSecret}>
                  {unlockBusy ? "Checking…" : "Unlock settings"}
                </button>
              </form>
            </section>
          ) : (
            <>
              {tab === "security" && (
                <ProfileSecurity
                  user={user}
                  onSession={(session) => {
                    if (session?.token) {
                      login(session.token, {
                        _id: session._id,
                        name: session.name,
                        email: session.email,
                        role: session.role,
                        isVerified: session.isVerified,
                      });
                    }
                  }}
                />
              )}
              {tab === "danger" && (
                <ProfileDanger
                  onDeleted={() => {
                    void handleLogout();
                    navigate("/", { replace: true });
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={logoutOpen}
        title="Log out of TronMarket?"
        description="You will be signed out on this device and will need to log in again to access your account."
        confirmLabel="Log out"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
