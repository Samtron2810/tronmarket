import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import api from "../../services/api";

export default function AdminOrderLookup() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (event) => {
    event?.preventDefault();
    setBusy(true);
    try {
      const res = await api.get("/orders", {
        params: { search: query, status: status || undefined, limit: 20 },
      });
      setOrders(res.data.orders || []);
      setSearched(true);
    } catch {
      setOrders([]);
      setSearched(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell title="Support order lookup" subtitle="Find any order by order ID (even a partial one), buyer email or name.">
      <form onSubmit={search} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          className="input-field flex-1"
          placeholder="Order ID, buyer email or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {["pending", "paid", "processing", "shipped", "delivered", "completed", "cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="primary-btn" disabled={busy}>{busy ? "Searching…" : "Search"}</button>
      </form>

      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <span className="font-mono text-xs">{o._id}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold capitalize">{o.status}</span>
            <span>{o.user?.name || o.name} ({o.user?.email || o.email})</span>
            <strong>{money(o.grandTotal ?? o.totalPrice)}</strong>
            <span className="text-[#667085]">{new Date(o.createdAt).toLocaleString()}</span>
            <Link to={`/orders/${o._id}/invoice`} className="ml-auto font-semibold text-emerald-700 hover:underline">Invoice</Link>
          </div>
        ))}
        {searched && orders.length === 0 && <p className="card p-6 text-sm text-[#667085]">No orders matched that search.</p>}
      </div>
    </AdminShell>
  );
}
