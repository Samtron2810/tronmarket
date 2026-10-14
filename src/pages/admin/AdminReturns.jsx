import { useEffect, useState } from "react";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import { getAdminReturns, reviewAdminReturn, getAdminRefunds } from "../../services/storefrontService";
import { toast } from "react-toastify";

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    getAdminReturns(status).then((res) => setReturns(res.data || [])).catch(() => toast.error("Could not load returns"));
    getAdminRefunds().then((res) => setRefunds(res.data || [])).catch(() => {});
  };

  useEffect(load, [status]);

  const decide = async (id, decision) => {
    setBusyId(id);
    try {
      await reviewAdminReturn(id, { decision, note: notes[id] || "" });
      toast.success(
        decision === "refund" ? "Refund requested from Paystack" : `Return ${decision === "approve" ? "approved" : "rejected"}`,
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not process this return");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell title="Returns, disputes & refund queue" subtitle="Approve a return, reject it, or approve + refund through Paystack in one step.">
      <div className="mb-4 flex gap-2">
        {["", "requested", "approved", "rejected", "refunded"].map((s) => (
          <button key={s || "all"} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${status === s ? "bg-emerald-600 text-white" : "bg-white border border-gray-300"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-8">
        {returns.map((r) => (
          <article key={r._id} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{r.reason}</strong>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold capitalize text-amber-800">{r.status}</span>
            </div>
            <p className="text-[#667085] mt-1">
              {r.user?.name} ({r.user?.email}) · Order {String(r.order?._id || r.order).slice(-8)} · {money(r.order?.grandTotal ?? r.order?.totalAmount)} · {new Date(r.createdAt).toLocaleString()}
            </p>
            {r.details && <p className="mt-1">{r.details}</p>}
            {(r.items || []).length > 0 && (
              <p className="mt-1 text-[#667085]">Items: {r.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</p>
            )}
            {r.refundReference && <p className="mt-1 text-[#667085]">Refund ref: {r.refundReference}</p>}
            {["requested", "approved"].includes(r.status) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="input-field flex-1 min-w-52"
                  placeholder="Note for the customer (optional)"
                  value={notes[r._id] || ""}
                  onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })}
                />
                <button disabled={busyId === r._id} onClick={() => decide(r._id, "approve")} className="secondary-btn">Approve</button>
                <button disabled={busyId === r._id} onClick={() => decide(r._id, "refund")} className="primary-btn">Approve & refund</button>
                <button disabled={busyId === r._id} onClick={() => decide(r._id, "reject")} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">Reject</button>
              </div>
            )}
          </article>
        ))}
        {returns.length === 0 && <p className="card p-6 text-sm text-[#667085]">No return requests here.</p>}
      </div>

      <h2 className="text-xl font-bold mb-3">Refund queue</h2>
      <div className="space-y-2">
        {refunds.map((p) => (
          <div key={p._id} className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <strong className="capitalize">{String(p.status || "").replace(/_/g, " ")}</strong>
            <span>{p.user?.email || p.order?.email || ""}</span>
            <span className="text-[#667085]">Ref: {p.reference}</span>
            <span className="text-[#667085]">{money(p.amount)}</span>
            <span className="text-[#667085]">{new Date(p.updatedAt).toLocaleString()}</span>
          </div>
        ))}
        {refunds.length === 0 && <p className="card p-6 text-sm text-[#667085]">No refunds waiting. Failed or pending refunds land here automatically from Paystack webhooks.</p>}
      </div>
    </AdminShell>
  );
}
