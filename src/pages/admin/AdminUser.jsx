import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";
import { inputCls } from "./user/adminUserShared";
import AdminUserOrders from "./user/AdminUserOrders";
import AdminUserSales from "./user/AdminUserSales";
import AdminUserProducts from "./user/AdminUserProducts";

// Admin view of a single user: profile/role editing and account deletion
// live here; the orders, seller-sales and products sections are separate
// components under ./user/ with their own data fetching and pagination.
export default function AdminUser() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [prevRole, setPrevRole] = useState(null);
  const [confirmUserOpen, setConfirmUserOpen] = useState(false);

  // Load user + their customer orders on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [uRes, oRes] = await Promise.all([
          api.get(`/admin/users/${id}`),
          api.get(`/admin/users/${id}/orders?limit=5`),
        ]);
        setUser(uRes.data);
        setPrevRole(uRes.data.role);
        setOrders(oRes.data.orders || []);
        setOrdersTotal(oRes.data.total || 0);
      } catch {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const saveUser = async (changes) => {
    try {
      const res = await api.put(`/admin/users/${id}`, changes);
      setUser(res.data.user);
      if (changes.role) setPrevRole(changes.role);
      toast.success("User updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update user");
    }
  };

  const removeUser = async () => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted");
      window.location.href = "/admin";
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete user");
    } finally {
      setConfirmUserOpen(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F6F7F4] px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-[#D1FAE5] rounded-xl px-5 py-4 animate-pulse">
            <div className="h-4 w-24 bg-white/40 rounded mb-2" />
            <div className="h-6 w-36 bg-white/40 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-10 bg-gray-200 animate-pulse rounded-lg"
                />
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-16 bg-gray-200 animate-pulse rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  const isSeller = user?.role === "seller";

  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Page Header ── */}
        <div className="bg-[#101828] rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#98A2B3] font-medium uppercase tracking-wide">
              Admin / Users
            </p>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {user?.name}
            </h2>
            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize bg-white/50 text-[#101828]">
              {user?.role}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg border border-white/30 text-sm text-white hover:bg-white/10 transition-colors"
            >
              ← Back
            </Link>
            <button
              onClick={() => setConfirmUserOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Delete User
            </button>
          </div>
        </div>

        {/* ── Edit User + Customer Orders ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Edit User */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#101828] mb-4">Edit User</h3>
            <div className="space-y-3">
              <input
                value={user?.name || ""}
                onChange={(e) =>
                  setUser((u) => ({ ...u, name: e.target.value }))
                }
                placeholder="Name"
                className={inputCls}
              />
              <input
                value={user?.email || ""}
                onChange={(e) =>
                  setUser((u) => ({ ...u, email: e.target.value }))
                }
                placeholder="Email"
                className={inputCls}
              />
              <select
                value={user?.role || "customer"}
                onChange={(e) => {
                  setPendingRole(e.target.value);
                  setConfirmRoleOpen(true);
                }}
                className={inputCls}
              >
                <option value="customer">customer</option>
                <option value="seller">seller</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={() =>
                  saveUser({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                  })
                }
                className="px-4 py-2 rounded-lg bg-[#047857] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Customer purchase orders */}
          <AdminUserOrders
            orders={orders}
            ordersTotal={ordersTotal}
            isSeller={isSeller}
            userId={id}
          />
        </div>

        {/* ── Seller-only sections ── */}
        {isSeller && (
          <>
            {/* Seller Sales (orders from customers who bought their products) */}
            <AdminUserSales userId={id} />

            {/* Products */}
            <AdminUserProducts userId={id} userRole={user?.role} />
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <ConfirmModal
        open={confirmUserOpen}
        title="Delete user"
        description="Delete this user? This cannot be undone."
        onConfirm={removeUser}
        onClose={() => setConfirmUserOpen(false)}
      />
      <ConfirmModal
        open={confirmRoleOpen}
        title="Change user role"
        description={`Change role to "${pendingRole}"? This will update their permissions.`}
        onConfirm={() => {
          saveUser({ role: pendingRole });
          setConfirmRoleOpen(false);
          setPendingRole(null);
        }}
        onClose={() => {
          setUser((u) => ({ ...u, role: prevRole }));
          setConfirmRoleOpen(false);
          setPendingRole(null);
        }}
        confirmLabel="Confirm"
      />
    </div>
  );
}
