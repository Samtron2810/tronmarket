import { useEffect, useState } from "react";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import { getAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon } from "../../services/storefrontService";
import { toast } from "react-toastify";

const empty = { code: "", type: "percent", value: 10, minSubtotal: 0, maxUsage: 0, expiresAt: "", isActive: true };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const load = () => getAdminCoupons().then((res) => setCoupons(res.data || [])).catch(() => toast.error("Could not load coupons"));
  useEffect(() => { load(); }, []);

  const create = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await createAdminCoupon({
        ...form,
        value: Number(form.value),
        minSubtotal: Number(form.minSubtotal) || 0,
        maxUsage: Number(form.maxUsage) || 0,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      setForm(empty);
      toast.success("Coupon created");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the coupon");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (coupon) => {
    try {
      await updateAdminCoupon(coupon._id, { isActive: !coupon.isActive });
      load();
    } catch {
      toast.error("Could not update the coupon");
    }
  };

  const remove = async (coupon) => {
    try {
      await deleteAdminCoupon(coupon._id);
      toast.success("Coupon deleted");
      load();
    } catch {
      toast.error("Could not delete the coupon");
    }
  };

  return (
    <AdminShell title="Coupons & discounts" subtitle="Percent or fixed-amount codes buyers can apply at checkout. Usage counts move only when an order is placed.">
      <form onSubmit={create} className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-7">
        <input className="input-field uppercase" placeholder="CODE" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="percent">% off</option>
          <option value="fixed">₦ off</option>
        </select>
        <input className="input-field" type="number" min="0" step="any" placeholder="Value" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <input className="input-field" type="number" min="0" placeholder="Min subtotal ₦" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} />
        <input className="input-field" type="number" min="0" placeholder="Max uses (0 = ∞)" value={form.maxUsage} onChange={(e) => setForm({ ...form, maxUsage: e.target.value })} />
        <input className="input-field" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        <button className="primary-btn" disabled={busy}>Create</button>
      </form>

      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <strong className="tracking-wide">{c.code}</strong>
            <span>{c.type === "percent" ? `${c.value}% off` : `${money(c.value)} off`}</span>
            <span className="text-[#667085]">min {money(c.minSubtotal)} · used {c.usedCount}{c.maxUsage ? ` / ${c.maxUsage}` : ""}</span>
            <span className="text-[#667085]">{c.expiresAt ? `expires ${new Date(c.expiresAt).toLocaleDateString()}` : "no expiry"}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{c.isActive ? "Active" : "Off"}</span>
            <span className="ml-auto flex gap-2">
              <button onClick={() => toggle(c)} className="secondary-btn !py-1.5">{c.isActive ? "Disable" : "Enable"}</button>
              <button onClick={() => remove(c)} className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white">Delete</button>
            </span>
          </div>
        ))}
        {coupons.length === 0 && <p className="card p-6 text-sm text-[#667085]">No coupons yet.</p>}
      </div>
    </AdminShell>
  );
}
