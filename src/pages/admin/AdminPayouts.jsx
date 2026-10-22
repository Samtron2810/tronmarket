import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import ConfirmModal from "../../components/ConfirmModal";
import {
  getAdminPayouts,
  markSellerPaid,
  setSellerBankVerified,
  setSellerVerified,
} from "../../services/storefrontService";

function Figure({ label, value, tone = "" }) {
  return (
    <span className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <strong className={tone}>{money(value)}</strong>
    </span>
  );
}

export default function AdminPayouts() {
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [payTarget, setPayTarget] = useState(null);

  const load = () =>
    getAdminPayouts()
      .then((res) => {
        setBalances(res.data.balances || []);
        setHistory(res.data.history || []);
      })
      .catch(() => toast.error("Could not load payouts"));

  useEffect(() => {
    void load();
  }, []);

  const pay = async () => {
    const balance = payTarget;
    setPayTarget(null);
    setBusyId(balance.seller);
    try {
      const res = await markSellerPaid(balance.seller, { method: "bank_transfer" });
      toast.success(`Recorded ${money(res.data.amount)} paid to ${balance.sellerName}`);
      void load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not record the payout");
    } finally {
      setBusyId(null);
    }
  };

  const toggleBank = async (balance) => {
    try {
      await setSellerBankVerified(balance.seller, !balance.bank?.verified);
      toast.success(balance.bank?.verified ? "Bank details unverified" : "Bank details verified");
      void load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update bank verification");
    }
  };

  const toggleSeller = async (balance) => {
    try {
      await setSellerVerified(balance.seller, !balance.sellerVerified);
      toast.success(balance.sellerVerified ? "Verification badge removed" : "Seller marked verified");
      void load();
    } catch {
      toast.error("Could not update seller verification");
    }
  };

  return (
    <AdminShell
      title="Seller payout ledger"
      subtitle="Money is released once the buyer's report window closes. Open returns, refunds and 'not received' reports hold a seller's money. Each payout settles exact packages, and a package is never paid twice."
    >
      <div className="space-y-3 mb-8">
        {balances.map((b) => {
          const bankReady = Boolean(b.bank?.configured && b.bank?.verified);
          const canPay = bankReady && b.payable > 0 && busyId !== b.seller;
          return (
            <div key={b.seller} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-48">
                  <Link to={`/admin/users/${b.seller}`} className="font-bold hover:underline">{b.sellerName}</Link>
                  {b.sellerVerified && <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Verified</span>}
                  <p className="text-muted">{b.sellerEmail}</p>
                </div>

                <div className="text-xs">
                  {!b.bank?.configured && <p className="font-semibold text-amber-700">No bank details yet. The seller has to add them before any payout.</p>}
                  {b.bank?.configured && (
                    <p className="text-muted">
                      {b.bank.bankName} · {b.bank.accountNumber} · {b.bank.accountName}
                    </p>
                  )}
                  {b.bank?.configured && (
                    <button onClick={() => toggleBank(b)} className="mt-1 font-semibold text-emerald-700 hover:underline">
                      {b.bank.verified ? "Unverify bank details" : "Mark bank details verified"}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
                <Figure label="Earned" value={b.earned} />
                <Figure label="Paid" value={b.paidOut} />
                <Figure label="Pending release" value={b.pendingRelease} />
                <Figure label="Held" value={b.held} tone="text-amber-700" />
                <Figure label="Payable now" value={b.payable} tone="text-emerald-700" />
                <span className="text-muted">{b.fulfilments} package{b.fulfilments === 1 ? "" : "s"}</span>
                <span className="ml-auto flex flex-wrap gap-2">
                  <button
                    disabled={!canPay}
                    title={!bankReady ? "Verify bank details first" : b.payable <= 0 ? "Nothing payable right now" : ""}
                    onClick={() => setPayTarget(b)}
                    className="primary-btn disabled:opacity-40"
                  >
                    {busyId === b.seller ? "Recording…" : `Pay ${money(b.payable)}`}
                  </button>
                  <button onClick={() => toggleSeller(b)} className="secondary-btn">
                    {b.sellerVerified ? "Remove badge" : "Verify seller"}
                  </button>
                </span>
              </div>
            </div>
          );
        })}
        {balances.length === 0 && <p className="card p-6 text-sm text-muted">No seller earnings yet.</p>}
      </div>

      <h2 className="text-xl font-bold mb-3">Payout history</h2>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h._id} className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <strong>{money(h.amount)}</strong>
            <span>{h.seller?.name || "Seller"} ({h.seller?.email || ""})</span>
            <span className="capitalize text-muted">{h.method.replace(/_/g, " ")}</span>
            <span className="text-muted">{h.fulfilmentCount} package{h.fulfilmentCount === 1 ? "" : "s"}</span>
            <span className="text-muted">{new Date(h.paidAt || h.createdAt).toLocaleString()}</span>
            {h.note && <span className="text-muted">{h.note}</span>}
          </div>
        ))}
        {history.length === 0 && <p className="card p-6 text-sm text-muted">No payouts recorded yet.</p>}
      </div>

      <ConfirmModal
        open={Boolean(payTarget)}
        title="Record payout"
        description={
          payTarget
            ? `Record ${money(payTarget.payable)} paid to ${payTarget.sellerName}? This settles their released packages. Only do this after you have sent the transfer.`
            : ""
        }
        confirmLabel="Yes, record payout"
        cancelLabel="Not yet"
        onConfirm={pay}
        onClose={() => setPayTarget(null)}
      />
    </AdminShell>
  );
}
