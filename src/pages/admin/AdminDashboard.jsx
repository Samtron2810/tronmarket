import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/users");
        setUsers(res.data || []);
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const changeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, role } : x)));
      toast.success("Role updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update role");
    }
  };

  const removeUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((u) => u.filter((x) => x._id !== id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete user");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {loading ? (
        <div className="space-y-3">
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
          <div className="h-40 bg-gray-100 animate-pulse rounded" />
        </div>
      ) : (
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      className="p-2 rounded border"
                    >
                      <option value="customer">customer</option>
                      <option value="seller">seller</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => removeUser(u._id)}
                      className="px-3 py-1 rounded bg-red-500 text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
