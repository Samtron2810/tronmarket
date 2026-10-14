import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import { getAdminPayouts, markSellerPaid, setSellerVerified } from "../../services/storefrontService";
import { toast } from "react-toastify";

export default function AdminPayouts() {
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    getAdminPayouts()
      .then((res) => { setBalances(res.data.balances || []); setHistory(res.data.history || []); })
      .catch(() => toast.error("Could not load payouts"));

  useEffect(() => { load(); }, []);

  const pay = async (balance) => {
    const amount = amounts[balance.seller] !== undefined ? Number(amounts[balance.seller]) : balance.outstanding;
    setBusyId(balance.seller);
    try {
      await markSellerPaid(balance.seller, { amount, method: "bank_transfer" });
      toast.success(`Recorded ${money(amount)} paid to ${balance.sellerName}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not record the payout");
    } finally {
      setBusyId(null);
    }
  };

  const toggleVerified = async (balance) => {
    try {
      await setSellerVerified(balance.seller, !balance.sellerVerified);
      toast.success(balance.sellerVerified ? "Verification badge removed" : "Seller marked verified");
      load();
    } catch {
      toast.error("Could not update seller verification");
    }
  };

  return (
    <AdminShell title="Seller payout ledger" subtitle="Earnings come from delivered packages (after platform commission). Recording a payout here is the ledger entry for money you have sent the seller.">
      <div className="space-y-2 mb-8">
        {balances.map((b) => (
          <div key={b.seller} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <div className="min-w-48">
              <Link to={`/admin/users/${b.seller}`} className="font-bold hover:underline">{b.sellerName}</Link>
              {b.sellerVerified && <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Verified</span>}
              <p className="text-[#667085]">{b.sellerEmail}</p>
            </div>
            <span>Earned <strong>{money(b.earned)}</strong></span>
            <span>Paid <strong>{money(b.paidOut)}</strong></span>
            <span>Outstanding <strong className="text-emerald-700">{money(b.outstanding)}</strong></span>
            <span className="text-[#667085]">{b.fulfilments} delivered package{b.fulfilments === 1 ? "" : "s"}</span>
            <span className="ml-auto flex flex-wrap gap-2">
              <input
                type="number"
                min="0"
                className="input-field w-32"
                placeholder={String(b.outstanding)}
                value={amounts[b.seller] ?? ""}
                onChange={(e) => setAmounts({ ...amounts, [b.seller]: e.target.value })}
              />
              <button disabled={busyId === b.seller || b.outstanding <= 0} onClick={() => pay(b)} className="primary-btn disabled:opacity-40">
                Mark paid
              </button>
              <button onClick={() => toggleVerified(b)} className="secondary-btn">
                {b.sellerVerified ? "Remove badge" : "Verify seller"}
              </button>
            </span>
          </div>
        ))}
        {balances.length === 0 && <p className="card p-6 text-sm text-[#667085]">No delivered seller earnings yet.</p>}
      </div>

      <h2 className="text-xl font-bold mb-3">Payout history</h2>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h._id} className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <strong>{money(h.amount)}</strong>
            <span>{h.seller?.name || "Seller"} ({h.seller?.email || ""})</span>
            <span className="capitalize text-[#667085]">{h.method.replace(/_/g, " ")}</span>
            <span className="text-[#667085]">{new Date(h.paidAt || h.createdAt).toLocaleString()}</span>
            {h.note && <span className="text-[#667085]">{h.note}</span>}
          </div>
        ))}
        {history.length === 0 && <p className="card p-6 text-sm text-[#667085]">No payouts recorded yet.</p>}
      </div>
    </AdminShell>
  );
}
