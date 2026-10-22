import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import { getAdminDisputes, resolveDispute } from "../../services/storefrontService";

const TABS = [
  { id: "open", label: "Open" },
  { id: "released", label: "Released" },
  { id: "upheld", label: "Upheld" },
  { id: "", label: "All" },
];

const STATUS_TONE = {
  open: "bg-amber-50 text-amber-800 border-amber-200",
  released: "bg-emerald-50 text-emerald-800 border-emerald-200",
  upheld: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function AdminDisputes() {
  const [tab, setTab] = useState("open");
  const [refreshKey, setRefreshKey] = useState(0);
  // Results are tagged with the tab they belong to, so a stale response never shows.
  const [result, setResult] = useState({ tab: null, items: [] });
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);
  const loading = result.tab !== tab;
  const disputes = result.items;

  useEffect(() => {
    let cancelled = false;
    getAdminDisputes(tab)
      .then((res) => {
        if (!cancelled) setResult({ tab, items: res.data || [] });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ tab, items: [] });
          toast.error("Could not load reports");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, refreshKey]);

  const decide = async (dispute, decision) => {
    const note = (notes[dispute._id] || "").trim();
    if (decision === "uphold" && note.length < 3) {
      toast.error("Add a note explaining the refund before upholding a report");
      return;
    }
    setBusyId(dispute._id);
    try {
      await resolveDispute(dispute._id, { decision, note });
      toast.success(decision === "release" ? "Report released. The seller can be paid." : "Report upheld. Refund the buyer for this package manually.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resolve the report");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell
      title="Not-received reports"
      subtitle="Buyers report packages that did not arrive. An open report holds that seller's payout for the package. Releasing it lets the seller be paid; upholding it keeps them unpaid, and the buyer must be refunded for that package."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id || "all"}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              tab === t.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-200 bg-white text-ink hover:border-emerald-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted">Loading reports…</p>}

      <div className="space-y-3">
        {!loading && disputes.map((d) => (
          <div key={d._id} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">
                  {d.reason}
                  <span className={`ml-2 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${STATUS_TONE[d.status] || ""}`}>{d.status}</span>
                </p>
                {d.details && <p className="mt-1 text-muted">{d.details}</p>}
                <p className="mt-1 text-xs text-muted">
                  Buyer: {d.user?.name || "Customer"} ({d.user?.email || "—"}) · Seller:{" "}
                  <Link to={`/admin/users/${d.seller?._id || d.seller}`} className="font-semibold hover:underline">
                    {d.seller?.name || "Seller"}
                  </Link>
                </p>
                <p className="text-xs text-muted">
                  Order {String(d.order?._id || d.order).slice(-8).toUpperCase()} · {money(d.order?.totalPrice)} · reported {new Date(d.createdAt).toLocaleString()}
                </p>
                {d.adminNote && d.status !== "open" && <p className="mt-1 text-xs">Note: {d.adminNote}</p>}
              </div>

              {d.status === "open" && (
                <div className="flex w-full flex-col gap-2 sm:w-72">
                  <input
                    className="input-field w-full"
                    placeholder="Note (required to uphold)"
                    value={notes[d._id] || ""}
                    onChange={(e) => setNotes({ ...notes, [d._id]: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === d._id}
                      onClick={() => decide(d, "release")}
                      className="primary-btn flex-1 disabled:opacity-40"
                    >
                      Release (pay seller)
                    </button>
                    <button
                      disabled={busyId === d._id}
                      onClick={() => decide(d, "uphold")}
                      className="secondary-btn flex-1 disabled:opacity-40"
                    >
                      Uphold (refund)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {!loading && disputes.length === 0 && <p className="card p-6 text-sm text-muted">No reports here.</p>}
      </div>
    </AdminShell>
  );
}
