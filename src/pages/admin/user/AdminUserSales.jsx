import { useEffect, useState, useCallback } from "react";
import api from "../../../services/api";
import { toast } from "react-toastify";
import { statusColors } from "./adminUserShared";

// Orders placed by customers for this seller's products, paginated
// independently of the rest of the AdminUser page.
export default function AdminUserSales({ userId }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/admin/users/${userId}/seller-sales?page=${page}&limit=5`,
      );
      setSales(res.data.orders || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error("Failed to load seller sales");
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSales();
  }, [fetchSales]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-[#ECFDF5] px-5 py-4 flex items-center justify-between">
        <h3 className="font-semibold text-[#101828]">
          Sales/Order from Customers{" "}
          <span className="ml-1 text-xs bg-white/60 text-[#101828] font-semibold px-2 py-0.5 rounded-full">
            {total}
          </span>
        </h3>
      </div>

      <div className="p-5 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#ECFDF5] rounded-xl p-4 animate-pulse"
              >
                <div className="flex justify-between mb-2">
                  <div className="h-3 w-32 bg-gray-300 rounded" />
                  <div className="h-3 w-16 bg-gray-300 rounded" />
                </div>
                <div className="h-4 w-48 bg-gray-300 rounded mb-2" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-300 rounded" />
                  <div className="h-5 w-16 bg-gray-300 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sales.length === 0 ? (
          <p className="text-sm text-[#667085] py-4 text-center">
            No sales yet.
          </p>
        ) : (
          <div className="space-y-3">
            {sales.map((o) => (
              <div key={o._id} className="bg-[#ECFDF5] rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-[#667085]">
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
                <div className="text-xs text-[#667085] mb-2">
                  Customer:{" "}
                  <span className="font-medium text-[#101828]">
                    {o.user?.name || "Unknown"} — {o.user?.email || ""}
                  </span>
                </div>
                <div className="text-xs text-[#667085] mb-2 truncate">
                  Items:{" "}
                  {o.orderItems?.map((item) => item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name).join(", ") || "N/A"}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#101828]">
                    ₦{Number(o.totalPrice).toLocaleString()}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize border ${statusColors[o.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#101828] disabled:opacity-40 hover:bg-[#ECFDF5] transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-[#667085]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#101828] disabled:opacity-40 hover:bg-[#ECFDF5] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
