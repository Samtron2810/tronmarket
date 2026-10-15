import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "./AdminOpsShared";
import { money } from "./adminMoney";
import { getAdminAnalytics } from "../../services/storefrontService";
import { getSellerApplications } from "../../services/sellerApplicationService";

/**
 * Admin overview — the /admin landing page.
 * Platform totals (last 30 days, from the analytics endpoint) plus queue
 * cards that click through to each work queue. The user table itself lives
 * on its own dedicated page at /admin/users.
 */
export default function AdminDashboard() {
  const [totals, setTotals] = useState(null);
  const [pendingApplications, setPendingApplications] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getAdminAnalytics(30),
      getSellerApplications({ status: "pending", page: 1, limit: 1 }),
    ]).then(([analytics, applications]) => {
      if (cancelled) return;
      if (analytics.status === "fulfilled") setTotals(analytics.value.data?.totals || null);
      if (applications.status === "fulfilled") {
        const d = applications.value.data || {};
        setPendingApplications(typeof d.total === "number" ? d.total : (d.applications?.length ?? null));
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const num = (v) => (loading ? "…" : typeof v === "number" ? v.toLocaleString() : "—");

  const queues = [
    {
      label: "Moderation pending",
      value: num(totals?.pendingModeration),
      hint: "Products waiting for review before they go live",
      to: "/admin/moderation",
      accent: "text-amber-600",
    },
    {
      label: "Open returns / refunds",
      value: loading ? "…" : totals ? `${totals.openReturns ?? "—"} / ${totals.pendingRefunds ?? "—"}` : "—",
      hint: "Return requests and refunds awaiting action",
      to: "/admin/returns",
      accent: "text-red-600",
    },
    {
      label: "Seller applications",
      value: num(pendingApplications),
      hint: "Applications waiting for approval",
      to: "/admin/seller-applications",
      accent: "text-emerald-700",
    },
    {
      label: "Total users",
      value: num(totals?.users),
      hint: "Manage accounts, roles and seller verification",
      to: "/admin/users",
      accent: "text-[#101828]",
    },
  ];

  const stats = [
    { label: "Revenue (30 days)", value: loading ? "…" : totals ? money(totals.revenue) : "—" },
    { label: "Platform commission", value: loading ? "…" : totals ? money(totals.commission) : "—" },
    { label: "Paid orders", value: num(totals?.paidOrders) },
    { label: "Avg. order value", value: loading ? "…" : totals ? money(totals.averageOrderValue) : "—" },
    { label: "Products live", value: num(totals?.products) },
  ];

  return (
    <AdminShell
      title="Admin overview"
      subtitle="What's happening on TronMarket, and what needs your attention."
    >
      {/* Queue cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {queues.map((q) => (
          <Link
            key={q.label}
            to={q.to}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">{q.label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${q.accent}`}>{q.value}</p>
            <p className="mt-1 text-sm text-[#667085]">{q.hint}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-emerald-700 group-hover:underline">
              Review →
            </span>
          </Link>
        ))}
      </div>

      {/* Platform totals */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[#101828]">Platform totals</h2>
          <Link to="/admin/analytics" className="text-sm font-semibold text-emerald-700 hover:underline">
            Full analytics →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-[#F6F7F4] px-4 py-3">
              <p className="text-xs font-medium text-[#667085]">{s.label}</p>
              <p className="mt-1 text-lg font-bold text-[#101828]">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shortcuts */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/admin/order-lookup" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow">
          <h3 className="font-bold text-[#101828]">Order lookup</h3>
          <p className="mt-1 text-sm text-[#667085]">Find any order, customer or payment by reference.</p>
        </Link>
        <Link to="/admin/payouts" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow">
          <h3 className="font-bold text-[#101828]">Payouts</h3>
          <p className="mt-1 text-sm text-[#667085]">See what each seller is owed and record payments.</p>
        </Link>
        <Link to="/admin/audit-logs" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow">
          <h3 className="font-bold text-[#101828]">Audit logs</h3>
          <p className="mt-1 text-sm text-[#667085]">Every sensitive admin action, recorded.</p>
        </Link>
      </div>
    </AdminShell>
  );
}
