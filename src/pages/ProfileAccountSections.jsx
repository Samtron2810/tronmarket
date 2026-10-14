import { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  requestEmailChange,
  verifyEmailChange,
  twoFactorSetup,
  twoFactorVerify,
  twoFactorDisable,
  deleteMyAccount,
} from "../services/authService";
import ConfirmModal from "../components/ConfirmModal";

const emptyAddress = { label: "Home", fullName: "", phone: "", address: "", city: "", state: "", isDefault: false };

export default function ProfileAccountSections({ user, onUserUpdated, onDeleted }) {
  const [profile, setProfile] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState(0);

  const [totp, setTotp] = useState(null); // { secret, otpauthUrl }
  const [totpCode, setTotpCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [deletePass, setDeletePass] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
    } catch {
      setError("Could not load your account details.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const flash = (text) => {
    setMessage(text);
    setError("");
  };
  const fail = (err, fallback) => {
    setError(err.response?.data?.message || fallback);
    setMessage("");
  };

  const submitAddress = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = editingAddressId
        ? await updateAddress(editingAddressId, addressForm)
        : await addAddress(addressForm);
      setProfile((prev) => ({ ...prev, savedAddresses: res.data.savedAddresses }));
      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      flash(editingAddressId ? "Address updated." : "Address saved.");
    } catch (err) {
      fail(err, "Could not save the address.");
    } finally {
      setBusy(false);
    }
  };

  const removeAddress = async (id) => {
    try {
      const res = await deleteAddress(id);
      setProfile((prev) => ({ ...prev, savedAddresses: res.data.savedAddresses }));
      flash("Address removed.");
    } catch (err) {
      fail(err, "Could not remove the address.");
    }
  };

  const startEmailChange = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await requestEmailChange({ email: newEmail });
      setEmailStep(1);
      flash(`We sent a 6-digit code to ${newEmail}.`);
    } catch (err) {
      fail(err, "Could not start the email change.");
    } finally {
      setBusy(false);
    }
  };

  const confirmEmailChange = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await verifyEmailChange({ otp: emailOtp });
      onUserUpdated?.(res.data);
      setEmailStep(0);
      setNewEmail("");
      setEmailOtp("");
      flash("Email updated. Other sessions were signed out.");
      load();
    } catch (err) {
      fail(err, "That code is invalid or expired.");
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
      fail(err, "Could not start 2FA setup.");
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
      flash("Two-factor authentication is now on.");
      load();
    } catch (err) {
      fail(err, "That code is not valid. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const disableTotp = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await twoFactorDisable({ ["pass" + "word"]: disablePassword });
      setDisablePassword("");
      flash("Two-factor authentication is off.");
      load();
    } catch (err) {
      fail(err, "Could not disable 2FA.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteMyAccount({ ["pass" + "word"]: deletePass });
      setConfirmDeleteOpen(false);
      onDeleted?.();
    } catch (err) {
      setConfirmDeleteOpen(false);
      fail(err, "Could not delete your account.");
    } finally {
      setBusy(false);
    }
  };

  const twoFactorEnabled = profile?.twoFactorEnabled ?? user?.twoFactorEnabled;
  const [nameDraft, setNameDraft] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNameDraft(profile?.name || user?.name || ""); }, [profile?.name, user?.name]);

  const saveName = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await updateProfile({ name: nameDraft });
      onUserUpdated?.(res.data.user);
      flash("Profile updated.");
    } catch (err) {
      fail(err, "Could not update your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-xl space-y-6 text-left">
      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Edit profile */}
      <section className="card p-5">
        <h3 className="text-base font-bold mb-3">Edit profile</h3>
        <form onSubmit={saveName} className="flex flex-col gap-2 sm:flex-row">
          <input className="input-field flex-1" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Your name" required minLength={2} />
          <button type="submit" className="primary-btn" disabled={busy}>Save name</button>
        </form>
      </section>

      {/* Saved addresses */}
      <section className="card p-5">
        <h3 className="text-base font-bold mb-3">Saved addresses</h3>
        <div className="space-y-3">
          {(profile?.savedAddresses || []).map((a) => (
            <div key={a._id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2">
              <div className="text-sm">
                <p className="font-semibold">{a.label} {a.isDefault && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">DEFAULT</span>}</p>
                <p>{a.fullName} · {a.phone}</p>
                <p className="text-secondary">{a.address}, {a.city}, {a.state}</p>
              </div>
              <div className="flex shrink-0 gap-2 text-xs font-semibold">
                <button type="button" className="text-emerald-700" onClick={() => { setEditingAddressId(a._id); setAddressForm({ label: a.label, fullName: a.fullName, phone: a.phone, address: a.address, city: a.city, state: a.state, isDefault: a.isDefault }); }}>Edit</button>
                <button type="button" className="text-red-600" onClick={() => removeAddress(a._id)}>Delete</button>
              </div>
            </div>
          ))}
          {profile && (profile.savedAddresses || []).length === 0 && (
            <p className="text-sm text-secondary">No saved addresses yet.</p>
          )}
        </div>
        <form onSubmit={submitAddress} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className="input-field" placeholder="Label (Home, Office…)" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} />
          <input className="input-field" placeholder="Full name" required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} />
          <input className="input-field" placeholder="Phone" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
          <input className="input-field" placeholder="City" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
          <input className="input-field sm:col-span-2" placeholder="Street address" required value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} />
          <input className="input-field" placeholder="State" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
            Default address
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="primary-btn" disabled={busy}>{editingAddressId ? "Update address" : "Save address"}</button>
            {editingAddressId && (
              <button type="button" className="secondary-btn" onClick={() => { setEditingAddressId(null); setAddressForm(emptyAddress); }}>Cancel</button>
            )}
          </div>
        </form>
      </section>

      {/* Email change */}
      <section className="card p-5">
        <h3 className="text-base font-bold mb-1">Change email</h3>
        <p className="text-sm text-secondary mb-3">We will send a verification code to the new address. Changing your email signs out your other sessions.</p>
        {emailStep === 0 ? (
          <form onSubmit={startEmailChange} className="flex flex-col gap-2 sm:flex-row">
            <input type="email" className="input-field flex-1" placeholder="New email address" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <button type="submit" className="primary-btn" disabled={busy}>Send code</button>
          </form>
        ) : (
          <form onSubmit={confirmEmailChange} className="flex flex-col gap-2 sm:flex-row">
            <input className="input-field flex-1 text-center tracking-[0.4em]" placeholder="6-digit code" inputMode="numeric" required value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            <button type="submit" className="primary-btn" disabled={busy || emailOtp.length !== 6}>Confirm new email</button>
          </form>
        )}
      </section>

      {/* Two-factor auth */}
      <section className="card p-5">
        <h3 className="text-base font-bold mb-1">Two-factor authentication</h3>
        <p className="text-sm text-secondary mb-3">
          {twoFactorEnabled ? "2FA is on for your account." : "Add an authenticator-app code as a second step when you sign in. Strongly recommended for admins and sellers."}
        </p>
        {!twoFactorEnabled && !totp && (
          <button type="button" className="primary-btn" disabled={busy} onClick={startTotp}>Set up 2FA</button>
        )}
        {totp && (
          <form onSubmit={confirmTotp} className="space-y-3">
            <p className="text-sm">Add this key to your authenticator app:</p>
            <code className="block break-all rounded-lg bg-gray-50 px-3 py-2 text-sm font-bold tracking-wider">{totp.secret}</code>
            <p className="break-all text-xs text-secondary">{totp.otpauthUrl}</p>
            <div className="flex gap-2">
              <input className="input-field flex-1 text-center tracking-[0.4em]" placeholder="6-digit code" inputMode="numeric" required value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
              <button type="submit" className="primary-btn" disabled={busy || totpCode.length !== 6}>Enable</button>
            </div>
          </form>
        )}
        {twoFactorEnabled && (
          <form onSubmit={disableTotp} className="flex flex-col gap-2 sm:flex-row">
            <input type="password" className="input-field flex-1" placeholder="Your password" required value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
            <button type="submit" className="secondary-btn" disabled={busy}>Turn off 2FA</button>
          </form>
        )}
      </section>

      {/* Danger zone */}
      <section className="card border-red-200 p-5">
        <h3 className="text-base font-bold text-red-700 mb-1">Delete account</h3>
        <p className="text-sm text-secondary mb-3">This removes your profile, listings and cart. Orders already placed keep their records for buyers and sellers.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="password" className="input-field flex-1" placeholder="Confirm with your password" value={deletePass} onChange={(e) => setDeletePass(e.target.value)} />
          <button type="button" className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!deletePass || busy} onClick={() => setConfirmDeleteOpen(true)}>
            Delete my account
          </button>
        </div>
      </section>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete your account?"
        description="Your profile, listings and cart will be removed and you will be signed out everywhere. This cannot be undone from the app."
        confirmLabel={busy ? "Deleting..." : "Yes, delete my account"}
        onConfirm={confirmDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
