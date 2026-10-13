import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/audit-logs", {
        params: { page, limit: 20, ...(action ? { action } : {}) },
      });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [action, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/admin" className="mb-3 inline-block text-sm font-semibold text-[#047857]">
              ← Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-[#101828]">Audit Trail</h1>
            <p className="mt-1 text-sm text-[#667085]">
              Role, account, seller-application and order actions by admins.
            </p>
          </div>
          <span className="text-sm text-[#667085]">{total} records</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 bg-[#ECFDF5] px-5 py-4">
            <label className="text-sm font-medium text-[#101828]" htmlFor="audit-action">
              Action filter
            </label>
            <select
              id="audit-action"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#047857]/30 bg-white px-3 py-2 text-sm"
            >
              <option value="">All actions</option>
              <option value="user.role-changed">Role changed</option>
              <option value="user.deleted">User deleted</option>
              <option value="user.updated">User updated</option>
              <option value="seller-application.approved">Seller approved</option>
              <option value="seller-application.rejected">Seller rejected</option>
              <option value="order.status-changed">Order status changed</option>
              <option value="order.manually-completed">Order manually completed</option>
              <option value="order.cancelled">Order cancelled by admin</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              <div className="h-5 w-48 animate-pulse rounded bg-[#ECFDF5]" />
              <div className="h-40 animate-pulse rounded bg-[#ECFDF5]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-[#ECFDF5] text-left text-[#101828]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-5 py-3 font-semibold">Admin</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                    <th className="px-5 py-3 font-semibold">Target</th>
                    <th className="px-5 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="align-top hover:bg-[#ECFDF5]/40">
                      <td className="whitespace-nowrap px-5 py-3 text-[#667085]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("en-NG") : ""}
                      </td>
                      <td className="px-5 py-3">
                        <span className="block font-medium text-[#101828]">{log.actorEmail || log.actor}</span>
                        <span className="text-xs text-[#667085]">{log.actorRole}</span>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#101828]">{log.action}</td>
                      <td className="px-5 py-3 text-[#667085]">
                        {log.targetType}
                        {log.targetId ? <span className="block break-all font-mono text-xs">{log.targetId}</span> : null}
                      </td>
                      <td className="max-w-md px-5 py-3">
                        <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-5 text-[#667085]">
                          {JSON.stringify(log.details || {}, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-[#667085]">No audit records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Previous</button>
              <span className="text-sm text-[#667085]">Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
