import { Link, NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/users", label: "Users", end: true },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/moderation", label: "Moderation" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/returns", label: "Returns & refunds" },
  { to: "/admin/payouts", label: "Payouts" },
  { to: "/admin/order-lookup", label: "Order lookup" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/delivery-states", label: "Delivery locations" },
];

export function AdminShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap gap-2">
          <Link to="/" className="rounded-xl bg-[#101828] px-4 py-2 text-sm font-semibold text-white">← Back to Home</Link>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || false}
              className={({ isActive }) =>
                `rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-300 bg-white hover:border-emerald-400"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-[#101828]">{title}</h1>
        {subtitle && <p className="text-sm text-[#667085] mt-1 mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
