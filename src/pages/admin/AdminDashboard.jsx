import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [pendingUserId, setPendingUserId] = useState(null);
  const debounceRef = useRef(null);

  // Debounce search input — only update debouncedSearch after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `/admin/users?search=${encodeURIComponent(debouncedSearch)}&page=${page}`,
        );
        setUsers(res.data.users || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
        setPage(res.data.page || 1);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [debouncedSearch, page]);

  const changeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, role } : x)));
      toast.success("Role updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update role");
    }
  };

  const confirmRemove = (id) => {
    setSelectedUser(id);
    setConfirmOpen(true);
  };

  const removeUser = async () => {
    const id = selectedUser;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((u) => u.filter((x) => x._id !== id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete user");
    } finally {
      setConfirmOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* return back to home button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#101828", color: "#fff" }}
          >
            ← Back to Home
          </Link>
        </div>
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[#667085] mt-1">
              Manage users, roles, and permissions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/seller-applications"
              className="inline-flex w-fit rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Review Seller Applications
            </Link>
            <Link
              to="/admin/audit-logs"
              className="inline-flex w-fit rounded-xl border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              View Audit Trail
            </Link>
          </div>
        </div>

        {/* Card — toolbar always rendered so input never loses focus */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-[#ECFDF5] px-5 py-4 flex items-center justify-between gap-4">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search by name or email…"
              className="w-full max-w-sm bg-white border border-white/60 rounded-lg px-3 py-2 text-sm text-[#101828] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#047857]"
            />
            <span className="text-sm font-medium text-[#101828] whitespace-nowrap">
              {total} {total === 1 ? "user" : "users"}
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-5 w-48 bg-[#ECFDF5] animate-pulse rounded" />
              <div className="h-40 bg-[#ECFDF5] animate-pulse rounded" />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#ECFDF5] text-[#101828]">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">
                        Name
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        Email
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        Role
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr
                        key={u._id}
                        className="hover:bg-[#ECFDF5]/40 transition-colors"
                      >
                        <td className="px-5 py-3 text-[#101828] font-medium">
                          {u.name}
                        </td>
                        <td className="px-5 py-3 text-[#667085]">{u.email}</td>
                        <td className="px-5 py-3">
                          <select
                            disabled
                            value={u.role}
                            onChange={(e) => {
                              setPendingRole(e.target.value);
                              setPendingUserId(u._id);
                              setRoleConfirmOpen(true);
                            }}
                            className="bg-[#ECFDF5] border border-[#047857]/30 text-[#101828] text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#047857]"
                          >
                            <option value="customer">customer</option>
                            <option value="seller">seller</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/admin/users/${u._id}`}
                              className="px-3 py-1.5 rounded-lg bg-[#047857] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                            >
                              Manage
                            </Link>
                            <button
                              onClick={() => confirmRemove(u._id)}
                              className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {users.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-10 text-center text-[#667085]"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#101828] disabled:opacity-40 hover:bg-[#ECFDF5] transition-colors"
                >
                  Prev
                </button>
                <span className="text-sm text-[#667085] px-1">
                  {page} / {pages}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#101828] disabled:opacity-40 hover:bg-[#ECFDF5] transition-colors"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete user"
        description="Delete this user?"
        onConfirm={removeUser}
        onClose={() => setConfirmOpen(false)}
      />
      <ConfirmModal
        open={roleConfirmOpen}
        title="Change user role"
        description={
          pendingRole ? `Change role to ${pendingRole}?` : "Change user role?"
        }
        onConfirm={() => {
          if (pendingUserId && pendingRole)
            changeRole(pendingUserId, pendingRole);
          setRoleConfirmOpen(false);
          setPendingRole(null);
          setPendingUserId(null);
        }}
        onClose={() => {
          setRoleConfirmOpen(false);
          setPendingRole(null);
          setPendingUserId(null);
        }}
      />
    </div>
  );
}
