import { useEffect, useState } from "react";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import { getAdminAnalytics, downloadAdminCsv } from "../../services/storefrontService";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminAnalytics(days)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load analytics."));
  }, [days]);

  const maxRevenue = Math.max(1, ...(data?.series || []).map((s) => s.revenue));

  return (
    <AdminShell title="Sales & revenue analytics" subtitle="Paid orders only. Commission is the platform's cut; seller payout is what sellers earned.">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${days === d ? "bg-emerald-600 text-white" : "bg-white border border-gray-300"}`}>
            Last {d} days
          </button>
        ))}
        <span className="mx-2 hidden h-5 w-px bg-gray-300 sm:block" />
        {["orders", "products", "users"].map((kind) => (
          <button key={kind} onClick={() => downloadAdminCsv(kind)} className="rounded-lg border border-emerald-700 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700">
            Export {kind} CSV
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-sm text-[#667085]">Loading…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
            {[
              ["Revenue", money(data.totals.revenue)],
              ["Platform commission", money(data.totals.commission)],
              ["Paid orders", data.totals.paidOrders],
              ["Avg. order value", money(data.totals.averageOrderValue)],
              ["Users", data.totals.users],
              ["Products", data.totals.products],
              ["Pending moderation", data.totals.pendingModeration],
              ["Open returns / refunds", `${data.totals.openReturns} / ${data.totals.pendingRefunds}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">{label}</p>
                <p className="mt-1 text-xl font-extrabold text-[#101828]">{value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
            <h2 className="font-bold mb-3">Revenue — last {days} days</h2>
            {data.series.length === 0 ? (
              <p className="text-sm text-[#667085]">No paid orders in this period.</p>
            ) : (
              <div className="flex h-40 items-end gap-1 overflow-x-auto">
                {data.series.map((point) => (
                  <div key={point.date} className="flex min-w-6 flex-1 flex-col items-center gap-1" title={`${point.date}: ${money(point.revenue)} (${point.orders} orders)`}>
                    <div className="w-full rounded-t bg-emerald-600" style={{ height: `${Math.max(4, (point.revenue / maxRevenue) * 120)}px` }} />
                    <span className="text-[9px] text-[#667085]">{point.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-bold mb-3">Top products</h2>
              <ul className="space-y-2 text-sm">
                {data.topProducts.map((p) => (
                  <li key={p.product} className="flex justify-between gap-2">
                    <span>{p.name} <span className="text-[#667085]">× {p.units}</span></span>
                    <strong>{money(p.revenue)}</strong>
                  </li>
                ))}
                {data.topProducts.length === 0 && <li className="text-[#667085]">No sales yet.</li>}
              </ul>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-bold mb-3">Top sellers</h2>
              <ul className="space-y-2 text-sm">
                {data.topSellers.map((s) => (
                  <li key={s.seller} className="flex justify-between gap-2">
                    <span>{s.name} <span className="text-[#667085]">{s.email}</span></span>
                    <strong>{money(s.sellerPayout)} payout</strong>
                  </li>
                ))}
                {data.topSellers.length === 0 && <li className="text-[#667085]">No sales yet.</li>}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 mt-6">
            <h2 className="font-bold mb-3">Orders by status</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.ordersByStatus || {}).map(([status, count]) => (
                <span key={status} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize">{status}: {count}</span>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}
