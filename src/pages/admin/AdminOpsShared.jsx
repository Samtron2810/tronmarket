import { Link } from "react-router-dom";

export function AdminShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap gap-2">
          <Link to="/" className="rounded-xl bg-[#101828] px-4 py-2 text-sm font-semibold text-white">← Back to Home</Link>
          <Link to="/admin" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Users</Link>
          <Link to="/admin/analytics" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Analytics</Link>
          <Link to="/admin/moderation" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Moderation</Link>
          <Link to="/admin/coupons" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Coupons</Link>
          <Link to="/admin/returns" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Returns & refunds</Link>
          <Link to="/admin/payouts" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Payouts</Link>
          <Link to="/admin/order-lookup" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Order lookup</Link>
          <Link to="/admin/categories" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Categories</Link>
        </div>
        <h1 className="text-2xl font-bold text-[#101828]">{title}</h1>
        {subtitle && <p className="text-sm text-[#667085] mt-1 mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

