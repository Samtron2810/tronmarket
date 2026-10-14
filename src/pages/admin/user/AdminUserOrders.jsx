import { Link } from "react-router-dom";

// The managed user's own purchase orders (first page), with a link through
// to the full admin orders list for this user.
export default function AdminUserOrders({ orders, ordersTotal, isSeller, userId }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-[#101828] mb-4">
        {isSeller ? "User's Purchases" : "Orders"}{" "}
        <span className="ml-1 text-xs bg-[#ECFDF5] text-[#047857] font-semibold px-2 py-0.5 rounded-full">
          {ordersTotal}
        </span>
      </h3>
      <div className="space-y-2 max-h-52 overflow-auto pr-1">
        {orders.length === 0 && (
          <p className="text-sm text-[#667085]">No orders yet.</p>
        )}
        {orders.map((o) => (
          <div key={o._id} className="bg-[#ECFDF5] rounded-lg px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#667085] truncate">
                #{o._id.slice(-8).toUpperCase()}
              </span>
              <span className="text-xs text-[#667085]">
                {o.createdAt
                  ? new Date(o.createdAt).toLocaleDateString("en-NG", {
                      dateStyle: "medium",
                    })
                  : ""}
              </span>
            </div>
            <div className="text-xs text-[#101828] font-medium mt-1 truncate">
              {o.orderItems
                ?.map((item) =>
                  item.variantLabel
                    ? `${item.name} (${item.variantLabel})`
                    : item.name,
                )
                .join(", ") || "N/A"}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-semibold text-[#101828]">
                ₦{Number(o.totalPrice).toLocaleString()}
              </span>
              <span className="text-xs bg-white border border-gray-200 text-[#667085] px-2 py-0.5 rounded-full capitalize">
                {o.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      {ordersTotal > 0 && (
        <Link
          to={`/admin/users/${userId}/orders`}
          className="mt-3 inline-block w-full text-center px-3 py-2 rounded-lg bg-[#047857] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          View All Orders →
        </Link>
      )}
    </div>
  );
}
