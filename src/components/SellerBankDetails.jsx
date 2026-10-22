import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getMySellerBankDetails, saveSellerBankDetails } from "../services/storefrontService";

const EMPTY = { bankName: "", accountNumber: "", accountName: "" };

// Where the seller's payouts are sent. Changing the account needs a fresh
// admin check before any money moves, so the status is shown clearly.
export default function SellerBankDetails({ onChange }) {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    getMySellerBankDetails()
      .then((res) => {
        setSaved(res.data);
        setForm({
          bankName: res.data.bankName || "",
          accountNumber: res.data.accountNumber || "",
          accountName: res.data.accountName || "",
        });
        setEditing(!res.data.configured);
      })
      .catch(() => toast.error("Could not load your bank details"));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await saveSellerBankDetails(form);
      setSaved(res.data);
      setEditing(false);
      toast.success("Bank details saved. An admin will verify them before payouts.");
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save bank details");
    } finally {
      setBusy(false);
    }
  };

  if (!saved) return <p className="text-sm text-emerald-700">Loading bank details…</p>;

  const status = !saved.configured
    ? { label: "Not added", tone: "text-amber-700" }
    : saved.verified
      ? { label: "Verified", tone: "text-emerald-700" }
      : { label: "Awaiting verification", tone: "text-amber-700" };

  return (
    <div className="text-sm text-emerald-900">
      <p className="mb-2">
        Bank account for payouts: <strong className={status.tone}>{status.label}</strong>
      </p>

      {!editing && saved.configured && (
        <div className="mb-2 space-y-0.5 rounded-lg bg-white/70 p-3">
          <p>{saved.bankName}</p>
          <p>{saved.accountNumber}</p>
          <p>{saved.accountName}</p>
          <button type="button" onClick={() => setEditing(true)} className="mt-1 text-xs font-semibold text-emerald-700 hover:underline">
            Change bank account
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={submit} className="space-y-2">
          <input
            className="input-field w-full"
            placeholder="Bank name"
            value={form.bankName}
            maxLength={100}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            required
          />
          <input
            className="input-field w-full"
            placeholder="10-digit account number"
            inputMode="numeric"
            pattern="\d{10}"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            required
          />
          <input
            className="input-field w-full"
            placeholder="Account name (as on the bank record)"
            value={form.accountName}
            maxLength={120}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="primary-btn disabled:opacity-50">
              {busy ? "Saving…" : "Save bank details"}
            </button>
            {saved.configured && (
              <button type="button" onClick={() => setEditing(false)} className="secondary-btn">Cancel</button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
