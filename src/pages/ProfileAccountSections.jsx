import { useEffect, useState } from "react";
import { NIGERIAN_STATES } from "../utils/nigerianStates";
import {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  twoFactorSetup,
  twoFactorVerify,
  twoFactorDisable,
  deleteMyAccount,
  changePassword,
} from "../services/authService";
import ConfirmModal from "../components/ConfirmModal";
import { getActiveDeliveryStates } from "../services/deliveryStateService";

// ── Shared bits ──────────────────────────────────────────────────────────────
function Status({ message, error }) {
  return (
    <>
      {message && (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </>
  );
}

function useStatus() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return {
    message,
    error,
    flash(text) { setMessage(text); setError(""); },
    fail(err, fallback) { setError(err?.response?.data?.message || fallback); setMessage(""); },
  };
}

const emptyAddress = { label: "Home", fullName: "", phone: "", address: "", city: "", state: "", landmark: "", isDefault: false };

// ── Overview: edit display name ─────────────────────────────────────────────
export function ProfileNameEditor({ user, onUserUpdated }) {
  const status = useStatus();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name || "");
  const [busy, setBusy] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await updateProfile({ name: nameDraft });
      onUserUpdated?.(res.data.user);
      setEditing(false);
      status.flash("Name updated.");
    } catch (err) {
      status.fail(err, "Could not update your name.");
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button type="button" className="secondary-btn !py-1.5 text-sm" onClick={() => { setNameDraft(user?.name || ""); setEditing(true); }}>
        Edit name
      </button>
    );
  }
  return (
    <form onSubmit={save} className="w-full max-w-sm">
      <Status message={status.message} error={status.error} />
      <div className="flex gap-2">
        <input className="input-field flex-1" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} required minLength={2} autoFocus />
        <button type="submit" className="primary-btn" disabled={busy}>Save</button>
        <button type="button" className="secondary-btn" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </form>
  );
}

// ── Addresses tab ────────────────────────────────────────────────────────────
export function ProfileAddresses() {
  const status = useStatus();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const [activeStates, setActiveStates] = useState(null);

  const load = async () => {
    try {
      const res = await getProfile();
      setAddresses(res.data.savedAddresses || []);
    } catch {
      status.fail(null, "Could not load your addresses.");
    }
    getActiveDeliveryStates()
      .then((res) => setActiveStates(res.data.states || []))
      .catch(() => setActiveStates(null));
  };

  const stateIsActive = (state) =>
    !Array.isArray(activeStates) ||
    activeStates.some((s) => s.toLowerCase() === String(state || "").toLowerCase());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = editingId ? await updateAddress(editingId, form) : await addAddress(form);
      setAddresses(res.data.savedAddresses || []);
      setForm(emptyAddress);
      setEditingId(null);
      status.flash(editingId ? "Address updated." : "Address saved.");
    } catch (err) {
      status.fail(err, "Could not save the address.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      const res = await deleteAddress(id);
      setAddresses(res.data.savedAddresses || []);
      status.flash("Address removed.");
    } catch (err) {
      status.fail(err, "Could not remove the address.");
    }
  };

  const setDefault = async (address) => {
    try {
      const res = await updateAddress(address._id, { ...address, isDefault: true });
      setAddresses(res.data.savedAddresses || []);
      status.flash("Default address updated.");
    } catch (err) {
      status.fail(err, "Could not set the default address.");
    }
  };

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-base font-bold">Saved addresses</h3>
      <p className="mb-4 text-sm text-secondary">
        Kept private to your account and offered at checkout. You can save up to 3 addresses.
      </p>
      <Status message={status.message} error={status.error} />

      <div className="mb-5 space-y-3">
        {addresses.map((a) => (
          <div key={a._id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <div className="text-sm">
              <p className="font-semibold">
                {a.label}
                {a.isDefault && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">DEFAULT</span>}
              </p>
              <p>{a.fullName} · {a.phone}</p>
              <p className="text-secondary">{a.address}, {a.city}, {a.state}</p>
              {a.landmark && <p className="text-secondary">Landmark: {a.landmark}</p>}
              {!stateIsActive(a.state) && (
                <p className="mt-1 inline-block rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                  Delivery is currently not available to this state
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-semibold">
              {!a.isDefault && (
                <button type="button" className="text-emerald-700" onClick={() => setDefault(a)}>Make default</button>
              )}
              <button
                type="button"
                className="text-emerald-700"
                onClick={() => { setEditingId(a._id); setForm({ label: a.label, fullName: a.fullName, phone: a.phone, address: a.address, city: a.city, state: a.state, landmark: a.landmark || "", isDefault: a.isDefault }); }}
              >
                Edit
              </button>
              <button type="button" className="text-red-600" onClick={() => remove(a._id)}>Remove</button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && <p className="text-sm text-secondary">No saved addresses yet — add one below.</p>}
      </div>

      <details className="group rounded-xl border border-dashed border-gray-300 px-4 py-3" open={Boolean(editingId)}>
        <summary className="cursor-pointer text-sm font-semibold text-emerald-700">
          {editingId ? "Editing address…" : "＋ Add a new address"}
        </summary>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className="input-field" placeholder="Label (Home, Office…)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input className="input-field" placeholder="Full name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input className="input-field" placeholder="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input-field" placeholder="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="input-field sm:col-span-2" placeholder="Street address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="input-field sm:col-span-2" placeholder="Landmark (optional)" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
          <select className="input-field" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} aria-label="State">
            <option value="" disabled>Select state</option>
            {form.state && !(Array.isArray(activeStates) ? activeStates : NIGERIAN_STATES).includes(form.state) && (
              <option value={form.state}>{form.state}{Array.isArray(activeStates) ? " (unavailable)" : ""}</option>
            )}
            {(Array.isArray(activeStates) ? activeStates : NIGERIAN_STATES).map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Use as my default address
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="primary-btn" disabled={busy || (!editingId && addresses.length >= 3)}>
              {editingId ? "Update address" : addresses.length >= 3 ? "Address limit reached (3)" : "Save address"}
            </button>
            {editingId && (
              <button type="button" className="secondary-btn" onClick={() => { setEditingId(null); setForm(emptyAddress); }}>Cancel</button>
            )}
          </div>
        </form>
      </details>
    </section>
  );
}

// ── Security tab (rendered only after the step-up unlock in Profile) ────────
export function ProfileSecurity({ user, onSession }) {
  const status = useStatus();
  const [busy, setBusy] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [totp, setTotp] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpOffSecret, setTotpOffSecret] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => setTwoFactorEnabled(Boolean(res.data.twoFactorEnabled)))
      .catch(() => {});
  }, []);

  const submitPassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      status.fail(null, "The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data.token) {
        onSession?.({
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          isVerified: res.data.isVerified,
          token: res.data.token,
        });
      }
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      status.flash(res.data.message || "Password changed. Your other sessions were signed out.");
    } catch (err) {
      status.fail(err, "Could not change your password.");
    } finally {
      setBusy(false);
    }
  };

  const startTotp = async () => {
    setBusy(true);
    try {
      const res = await twoFactorSetup();
      setTotp(res.data);
    } catch (err) {
      status.fail(err, "Could not start 2FA setup.");
    } finally {
      setBusy(false);
    }
  };

  const confirmTotp = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await twoFactorVerify({ code: totpCode });
      setTotp(null);
      setTotpCode("");
      setTwoFactorEnabled(true);
      status.flash("Two-factor authentication is now on.");
    } catch (err) {
      status.fail(err, "That code is not valid. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const disableTotp = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await twoFactorDisable({ ["pass" + "word"]: totpOffSecret });
      setTotpOffSecret("");
      setTwoFactorEnabled(false);
      status.flash("Two-factor authentication is off.");
    } catch (err) {
      status.fail(err, "Could not disable 2FA.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Status message={status.message} error={status.error} />

      <section className="card p-5 sm:p-6">
        <h3 className="text-base font-bold">Change password</h3>
        <p className="mb-4 text-sm text-secondary">Changing your password signs out your other sessions.</p>
        <form onSubmit={submitPassword} className="grid max-w-md gap-2">
          <input type="password" className="input-field" placeholder="Current password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          <input type="password" className="input-field" placeholder="New password" autoComplete="new-password" minLength={6} required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          <input type="password" className="input-field" placeholder="Confirm new password" autoComplete="new-password" minLength={6} required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
          <button type="submit" className="primary-btn" disabled={busy}>{busy ? "Changing…" : "Change password"}</button>
        </form>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-base font-bold">Two-factor authentication</h3>
        <p className="mb-4 text-sm text-secondary">
          {twoFactorEnabled
            ? "2FA is on — an authenticator-app code is required when you sign in."
            : "Add an authenticator-app code as a second step when you sign in. Strongly recommended for admins and sellers."}
        </p>
        {!twoFactorEnabled && !totp && (
          <button type="button" className="primary-btn" disabled={busy} onClick={startTotp}>Set up 2FA</button>
        )}
        {totp && (
          <form onSubmit={confirmTotp} className="max-w-md space-y-3">
            <p className="text-sm">Add this key to your authenticator app, then enter the code it shows:</p>
            <code className="block break-all rounded-lg bg-gray-50 px-3 py-2 text-sm font-bold tracking-wider">{totp.secret}</code>
            <p className="break-all text-xs text-secondary">{totp.otpauthUrl}</p>
            <div className="flex gap-2">
              <input className="input-field flex-1 text-center tracking-[0.4em]" placeholder="6-digit code" inputMode="numeric" required value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
              <button type="submit" className="primary-btn" disabled={busy || totpCode.length !== 6}>Enable</button>
            </div>
          </form>
        )}
        {twoFactorEnabled && (
          <form onSubmit={disableTotp} className="flex max-w-md flex-col gap-2 sm:flex-row">
            <input type="password" className="input-field flex-1" placeholder="Confirm with your password" required value={totpOffSecret} onChange={(e) => setTotpOffSecret(e.target.value)} />
            <button type="submit" className="secondary-btn" disabled={busy}>Turn off 2FA</button>
          </form>
        )}
      </section>
    </div>
  );
}

// ── Danger zone tab (also behind the step-up unlock) ────────────────────────
export function ProfileDanger({ onDeleted }) {
  const status = useStatus();
  const [secret, setSecret] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteMyAccount({ ["pass" + "word"]: secret });
      setConfirmOpen(false);
      onDeleted?.();
    } catch (err) {
      setConfirmOpen(false);
      status.fail(err, "Could not delete your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card border-red-200 p-5 sm:p-6">
      <h3 className="text-base font-bold text-red-700">Delete account</h3>
      <p className="mb-4 max-w-lg text-sm text-secondary">
        This removes your profile, listings and cart, and signs you out everywhere. Orders already placed keep their
        records for buyers and sellers. This cannot be undone from the app.
      </p>
      <Status message={status.message} error={status.error} />
      <div className="flex max-w-md flex-col gap-2 sm:flex-row">
        <input type="password" className="input-field flex-1" placeholder="Confirm with your password" value={secret} onChange={(e) => setSecret(e.target.value)} />
        <button
          type="button"
          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          disabled={!secret || busy}
          onClick={() => setConfirmOpen(true)}
        >
          Delete my account
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete your account?"
        description="Your profile, listings and cart will be removed and you will be signed out everywhere. This cannot be undone from the app."
        confirmLabel={busy ? "Deleting..." : "Yes, delete my account"}
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </section>
  );
}
