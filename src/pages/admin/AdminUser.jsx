import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import uploadService from "../../services/uploadService";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";

const categories = ["phones", "laptops", "fashion", "home", "electronics"];

export default function AdminUser() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productPages, setProductPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [orders, setOrders] = useState([]);
  const [creating, setCreating] = useState(false);
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [prevRole, setPrevRole] = useState(null);
  const [confirmUserOpen, setConfirmUserOpen] = useState(false);
  const [confirmProductOpen, setConfirmProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category: "",
    description: "",
    stock: 0,
    images: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [uRes, pRes, oRes] = await Promise.all([
          api.get(`/admin/users/${id}`),
          api.get(
            `/admin/users/${id}/products?search=${encodeURIComponent(productSearch)}&page=${productPage}`,
          ),
          api.get(`/admin/users/${id}/orders`),
        ]);
        setUser(uRes.data);
        setPrevRole(uRes.data.role);
        setProducts(pRes.data.products || []);
        setProductTotal(pRes.data.total || 0);
        setProductPages(pRes.data.pages || 1);
        setProductPage(pRes.data.page || 1);
        setOrders(oRes.data || []);
      } catch (err) {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, productSearch, productPage]);

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

  const removeProduct = async () => {
    const productId = selectedProduct;
    try {
      await api.delete(`/admin/users/${id}/products/${productId}`);
      setProducts((p) => p.filter((x) => x._id !== productId));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete product");
    } finally {
      setConfirmProductOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      let urls = [];
      if (newProduct.images && newProduct.images.length > 0) {
        urls = await uploadService.uploadImages(newProduct.images);
      }
      const payload = { ...newProduct, images: urls, image: urls[0] };
      const res = await api.post(`/admin/users/${id}/products`, payload);
      setProducts((p) => [res.data, ...p]);
      setNewProduct({
        name: "",
        price: 0,
        category: "",
        description: "",
        stock: 0,
        images: [],
      });
      toast.success("Product created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create product");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (product) => {
    setEditProduct({ ...product });
    setEditOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editProduct };
      let urls = [];
      if (
        payload.images &&
        payload.images.length > 0 &&
        payload.images[0] instanceof File
      ) {
        urls = await uploadService.uploadImages(payload.images);
        payload.images = urls;
        payload.image = urls[0];
      }
      const res = await api.put(
        `/admin/users/${id}/products/${editProduct._id}`,
        payload,
      );
      setProducts((p) => p.map((x) => (x._id === res.data._id ? res.data : x)));
      toast.success("Product updated");
      setEditOpen(false);
      setEditProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update product");
    }
  };

  /* ── shared input class ── */
  const inputCls =
    "w-full bg-[#EBF2FF] border border-[#2B80FF]/20 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#2B80FF]";

  if (loading)
    return (
      <div className="min-h-screen bg-[#FF8C00] px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-[#FFAA4D]/60 rounded-xl px-5 py-4 animate-pulse">
            <div className="h-4 w-24 bg-white/40 rounded mb-2" />
            <div className="h-6 w-36 bg-white/40 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="h-5 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-10 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-10 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-10 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-10 w-28 bg-gray-200 animate-pulse rounded-lg" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="h-5 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-16 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-16 bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FF8C00] px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Page Header ── */}
        <div className="bg-[#FFAA4D] rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#555555] font-medium uppercase tracking-wide">
              Admin / Users
            </p>
            <h2 className="text-xl font-bold text-[#1A1A1A] mt-0.5">
              {user?.name}
            </h2>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg border border-[#1A1A1A]/20 text-sm text-[#1A1A1A] hover:bg-white/30 transition-colors"
            >
              ← Back
            </Link>
            <button
              onClick={() => setConfirmUserOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#FF2E3B] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Delete User
            </button>
          </div>
        </div>

        {/* ── Edit User + Orders ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Edit User */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Edit User</h3>
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
                className="px-4 py-2 rounded-lg bg-[#2B80FF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">
              Orders{" "}
              <span className="ml-1 text-xs bg-[#EBF2FF] text-[#2B80FF] font-semibold px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            </h3>
            <div className="space-y-2 max-h-52 overflow-auto pr-1">
              {orders.length === 0 && (
                <p className="text-sm text-[#555555]">No orders yet.</p>
              )}
              {orders.map((o) => (
                <div key={o._id} className="bg-[#EBF2FF] rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-mono text-[#555555] truncate">
                      #{o._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs text-[#555555] mt-1">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString("en-NG", {
                            dateStyle: "medium",
                          })
                        : ""}
                    </span>
                  </div>

                  <div className="text-xs text-[#1A1A1A] font-medium mt-1 truncate">
                    {o.orderItems?.map((item) => item.name).join(", ") || "N/A"}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold text-[#1A1A1A]">
                      ₦{Number(o.totalPrice).toLocaleString()}
                    </span>
                    <span className="text-xs bg-white border border-gray-200 text-[#555555] px-2 py-0.5 rounded-full capitalize">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {orders.length > 0 && (
              <Link
                to={`/admin/users/${id}/orders`}
                className="mt-3 inline-block w-full text-center px-3 py-2 rounded-lg bg-[#2B80FF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                View All Orders →
              </Link>
            )}
          </div>
        </div>

        {/* ── Products Section ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Section Header */}
          <div className="bg-[#FFAA4D] px-5 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#1A1A1A]">
              Products{" "}
              <span className="ml-1 text-xs bg-white/60 text-[#1A1A1A] font-semibold px-2 py-0.5 rounded-full">
                {productTotal}
              </span>
            </h3>
            <input
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setProductPage(1);
              }}
              placeholder="Search products…"
              className="bg-white border border-white/60 rounded-lg px-3 py-1.5 text-sm text-[#1A1A1A] placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#2B80FF] w-48"
            />
          </div>

          <div className="p-5 space-y-5">
            {/* Create Product Form (sellers only) */}
            {user?.role === "seller" && (
              <div className="bg-[#EBF2FF] rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                  Add New Product
                </h4>
                <form onSubmit={handleCreate} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      placeholder="Product name"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct((n) => ({ ...n, name: e.target.value }))
                      }
                      className={`${inputCls} col-span-2`}
                    />
                    <label className="text-sm font-medium text-[#1A1A1A] bg-gray-200 p-0.5 rounded-md">
                      Price (₦)
                      <input
                        placeholder="Price"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct((n) => ({
                            ...n,
                            price: Number(e.target.value),
                          }))
                        }
                        className={inputCls}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct((n) => ({
                          ...n,
                          category: e.target.value,
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="">Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <label className="text-sm font-medium text-[#1A1A1A] bg-gray-200 p-0.5 rounded-md">
                      No of available Stock:
                      <input
                        placeholder="Stock"
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) =>
                          setNewProduct((n) => ({
                            ...n,
                            stock: Number(e.target.value),
                          }))
                        }
                        className={inputCls}
                      />
                    </label>
                    <label className="text-sm font-medium text-[#1A1A1A] bg-gray-200 p-0.5 rounded-md">
                      Product Images
                      <input
                        type="file"
                        multiple
                        onChange={(e) =>
                          setNewProduct((n) => ({
                            ...n,
                            images: Array.from(e.target.files),
                          }))
                        }
                        className="text-sm text-[#555555] file:mr-2 file:px-3 file:py-2.5 file:rounded-lg file:border-0 file:bg-[#2B80FF] file:text-white file:text-xs file:font-medium file:cursor-pointer"
                      />
                    </label>
                  </div>
                  <textarea
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct((n) => ({
                        ...n,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    className={inputCls}
                  />
                  <button
                    disabled={creating}
                    className="px-4 py-2 rounded-lg bg-[#2B80FF] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {creating ? "Creating…" : "Create Product"}
                  </button>
                </form>
              </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-28 w-full object-cover"
                  />
                  <div className="p-3">
                    <div className="text-sm font-semibold text-[#1A1A1A] truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-[#555555] mt-0.5">
                      ₦{p.price}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <Link
                        to={`/product/${p._id}`}
                        className="px-2 py-1 rounded-lg bg-[#EBF2FF] text-[#2B80FF] text-xs font-medium hover:opacity-80 transition-opacity"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => openEdit(p)}
                        className="px-2 py-1 rounded-lg bg-[#FF8C00] text-white text-xs font-medium hover:opacity-80 transition-opacity"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(p._id);
                          setConfirmProductOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-[#FF2E3B] text-white text-xs font-medium hover:opacity-80 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="col-span-3 text-sm text-[#555555] py-4">
                  No products found.
                </p>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                disabled={productPage <= 1}
                onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#1A1A1A] disabled:opacity-40 hover:bg-[#EBF2FF] transition-colors"
              >
                Prev
              </button>
              <span className="text-sm text-[#555555]">
                {productPage} / {productPages}
              </span>
              <button
                disabled={productPage >= productPages}
                onClick={() =>
                  setProductPage((p) => Math.min(productPages, p + 1))
                }
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#1A1A1A] disabled:opacity-40 hover:bg-[#EBF2FF] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <ConfirmModal
        open={confirmProductOpen}
        title="Delete product"
        description="Delete this product?"
        onConfirm={removeProduct}
        onClose={() => setConfirmProductOpen(false)}
      />
      <ConfirmModal
        open={confirmUserOpen}
        title="Delete user"
        description="Delete this user?"
        onConfirm={removeUser}
        onClose={() => setConfirmUserOpen(false)}
      />
      <ConfirmModal
        open={confirmRoleOpen}
        title="Change user role"
        description={`Change role to ${pendingRole}? This will update permissions.`}
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

      {/* ── Edit Product Modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/40"
            onClick={() => setEditOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-xl overflow-hidden shadow-xl">
            <div className="bg-[#FFAA4D] px-5 py-4">
              <h3 className="font-bold text-[#1A1A1A]">Edit Product</h3>
            </div>
            <form onSubmit={handleEditSave} className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <input
                  placeholder="Name"
                  value={editProduct.name}
                  onChange={(e) =>
                    setEditProduct((s) => ({ ...s, name: e.target.value }))
                  }
                  className={`${inputCls} col-span-2`}
                />
                <input
                  placeholder="Price"
                  type="number"
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct((s) => ({
                      ...s,
                      price: Number(e.target.value),
                    }))
                  }
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={editProduct.category || ""}
                  onChange={(e) =>
                    setEditProduct((s) => ({ ...s, category: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="">Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Stock"
                  type="number"
                  value={editProduct.stock || 0}
                  onChange={(e) =>
                    setEditProduct((s) => ({
                      ...s,
                      stock: Number(e.target.value),
                    }))
                  }
                  className={inputCls}
                />
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setEditProduct((s) => ({
                      ...s,
                      images: Array.from(e.target.files),
                    }))
                  }
                  className="text-sm text-[#555555] file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#2B80FF] file:text-white file:text-xs file:font-medium file:cursor-pointer"
                />
              </div>
              <textarea
                placeholder="Description"
                value={editProduct.description || ""}
                onChange={(e) =>
                  setEditProduct((s) => ({ ...s, description: e.target.value }))
                }
                rows={3}
                className={inputCls}
              />
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-[#1A1A1A] hover:bg-[#EBF2FF] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2B80FF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
