import { useEffect, useState } from "react";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import { getModerationQueue, moderateProduct, bulkProducts, downloadAdminCsv } from "../../services/storefrontService";
import { toast } from "react-toastify";
import { firstProductImage } from "../../utils/productImages";

export default function AdminModeration() {
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("pending");
  const [notes, setNotes] = useState({});
  const [selected, setSelected] = useState([]);

  const load = () => {
    getModerationQueue(tab)
      .then((res) => { setProducts(res.data || []); setSelected([]); })
      .catch(() => toast.error("Could not load the moderation queue"));
  };

  useEffect(load, [tab]);

  const decide = async (id, decision) => {
    try {
      await moderateProduct(id, { decision, note: notes[id] || "" });
      toast.success(decision === "reject" ? "Listing rejected" : "Listing approved");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Moderation failed");
    }
  };

  const runBulk = async (action) => {
    if (!selected.length) return;
    try {
      const res = await bulkProducts({ ids: selected, action });
      toast.success(`${res.data.affected} product(s) updated`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk action failed");
    }
  };

  const toggleSelected = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <AdminShell title="Product moderation" subtitle="Seller listings wait here before they appear in the store. Rejected listings are hidden with a note for the seller.">
      <div className="mb-4 flex flex-wrap gap-2">
        {["pending", "rejected"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${tab === t ? "bg-emerald-600 text-white" : "bg-white border border-gray-300"}`}>
            {t}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-gray-300 sm:block" />
        {[
          ["activate", "Activate"],
          ["feature", "Feature"],
          ["unfeature", "Unfeature"],
          ["sponsor", "Sponsor (30d)"],
          ["unsponsor", "Unsponsor"],
          ["draft", "Move to draft"],
          ["deactivate", "Deactivate"],
          ["delete", "Delete"],
        ].map(([action, label]) => (
          <button key={action} disabled={!selected.length} onClick={() => runBulk(action)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-40">
            {label} selected
          </button>
        ))}
        <button onClick={() => downloadAdminCsv("products")} className="rounded-lg border border-emerald-700 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700">Export products CSV</button>
      </div>

      {products.length === 0 && <p className="card p-6 text-sm text-[#667085]">Nothing in this queue.</p>}
      <div className="space-y-3">
        {products.map((p) => (
          <article key={p._id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
            <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelected(p._id)} aria-label={`Select ${p.name}`} />
            <img src={firstProductImage(p)} alt={p.name || "Product"} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            <div className="flex-1 text-sm">
              <p className="font-bold">{p.name}</p>
              <p className="text-[#667085]">{p.brand || "No brand"} · {p.category || "General"} · {money(p.price)} · {p.countInStock ?? p.stock ?? 0} in stock</p>
              <p className="text-[#667085]">Seller: {p.seller?.name || "—"} ({p.seller?.email || ""}){p.seller?.sellerVerified ? " · verified" : ""}</p>
              {p.moderationNote && <p className="text-red-600">Note: {p.moderationNote}</p>}
            </div>
            <input
              className="input-field sm:w-56"
              placeholder="Rejection note (optional)"
              value={notes[p._id] || ""}
              onChange={(e) => setNotes({ ...notes, [p._id]: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={() => decide(p._id, "approve")} className="primary-btn">Approve</button>
              <button onClick={() => decide(p._id, "reject")} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">Reject</button>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
