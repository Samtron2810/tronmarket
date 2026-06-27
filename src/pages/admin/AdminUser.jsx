import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import uploadService from "../../services/uploadService";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";
import { thumbUrl } from "../../utils/cloudinaryUrl";

const categories = ["phones", "laptops", "fashion", "home", "electronics"];

const statusColors = {
  pending: "bg-amber-100 text-amber-800 border border-amber-200",
  paid: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  processing: "bg-blue-100 text-blue-800 border border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  "delivery-claimed": "bg-orange-100 text-orange-800 border border-orange-200",
  delivered: "bg-green-100 text-green-800 border border-green-200",
  completed: "bg-teal-100 text-teal-800 border border-teal-200",
  cancelled: "bg-rose-100 text-rose-800 border border-rose-200",
};

/* ── Shared input style ── */
const inputCls =
  "w-full bg-[#EBF2FF] border border-[#2B80FF]/20 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#2B80FF]";

/* ────────────────────────────────────────────────
   Sub-component: Products section
   - debounced search (500ms), no full page reload
   - own loading/pagination state
   ──────────────────────────────────────────────── */
function ProductsSection({ userId, userRole }) {
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productPages, setProductPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category: "",
    description: "",
    stock: 0,
    images: [],
  });
  const [confirmProductOpen, setConfirmProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  // Debounce: only fire request 500ms after user stops typing
  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setProductSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setProductPage(1);
    }, 500);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setProductLoading(true);
      const res = await api.get(
        `/admin/users/${userId}/products?search=${encodeURIComponent(debouncedSearch)}&page=${productPage}&limit=9`,
      );
      setProducts(res.data.products || []);
      setProductTotal(res.data.total || 0);
      setProductPages(res.data.pages || 1);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setProductLoading(false);
    }
  }, [userId, debouncedSearch, productPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const removeProduct = async () => {
    try {
      await api.delete(`/admin/users/${userId}/products/${selectedProduct}`);
      toast.success("Product deleted");
      fetchProducts();
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
      if (newProduct.images?.length > 0) {
        urls = await uploadService.uploadImages(newProduct.images);
      }
      await api.post(`/admin/users/${userId}/products`, {
        ...newProduct,
        images: urls,
        image: urls[0],
      });
      toast.success("Product created");
      setNewProduct({
        name: "",
        price: 0,
        category: "",
        description: "",
        stock: 0,
        images: [],
      });
      setShowAddForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create product");
    } finally {
      setCreating(false);
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editProduct };
      if (payload.images?.length > 0 && payload.images[0] instanceof File) {
        const urls = await uploadService.uploadImages(payload.images);
        payload.images = urls;
        payload.image = urls[0];
      }
      const res = await api.put(
        `/admin/users/${userId}/products/${editProduct._id}`,
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#FFAA4D] px-5 py-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[#1A1A1A] shrink-0">
          Products{" "}
          <span className="ml-1 text-xs bg-white/60 text-[#1A1A1A] font-semibold px-2 py-0.5 rounded-full">
            {productTotal}
          </span>
        </h3>
        {/* Search — only the products section re-renders, never the whole page */}
        <input
          value={productSearch}
          onChange={handleSearchChange}
          placeholder="Search products…"
          className="bg-white border border-white/60 rounded-lg px-3 py-1.5 text-sm text-[#1A1A1A] placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#2B80FF] w-48"
        />
      </div>

      <div className="p-5 space-y-5">
        {/* Create Product Form — seller only */}
        {userRole === "seller" && (
          <div className="bg-[#EBF2FF] rounded-xl p-4">
            <div
              onClick={() => setShowAddForm((prev) => !prev)}
              className="flex items-center justify-between cursor-pointer select-none rounded-lg border-2 border-dashed border-[#2B80FF]/40 bg-white px-4 py-3 hover:border-[#2B80FF] hover:bg-[#F7FAFF] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B80FF] text-white font-bold">
                  +
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">
                    Add New Product
                  </h4>
                  {!showAddForm && (
                    <p className="text-xs text-[#555555]">
                      Click here to create a product
                    </p>
                  )}
                </div>
              </div>
              <span
                className="text-[#2B80FF] font-bold text-lg transition-transform duration-200"
                style={{
                  transform: showAddForm ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                ▼
              </span>
            </div>
            {showAddForm && (
              <form onSubmit={handleCreate} className="space-y-3 mt-3">
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
                      type="number"
                      min={0}
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct((n) => ({
                          ...n,
                          price: Math.max(0, Number(e.target.value)),
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
                      setNewProduct((n) => ({ ...n, category: e.target.value }))
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
                    Stock
                    <input
                      type="number"
                      min={0}
                      value={newProduct.stock}
                      onChange={(e) =>
                        setNewProduct((n) => ({
                          ...n,
                          stock: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className={inputCls}
                    />
                  </label>
                  <label className="text-sm font-medium text-[#1A1A1A] bg-gray-200 p-0.5 rounded-md">
                    Images
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
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((n) => ({
                      ...n,
                      description: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
                <button
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-[#2B80FF] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create Product"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Product Grid */}
        {productLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="border border-gray-200 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="w-full h-32 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p._id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <img
                  src={thumbUrl(p.image)}
                  alt={p.name}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                />
                <div className="p-3">
                  <div className="text-sm font-semibold text-[#1A1A1A] truncate">
                    {p.name}
                  </div>
                  <div className="text-xs text-[#555555] mt-0.5">
                    ₦{Number(p.price).toLocaleString()}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Link
                      to={`/product/${p._id}`}
                      className="px-2 py-1 rounded-lg bg-[#EBF2FF] text-[#2B80FF] text-xs font-medium hover:opacity-80"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => {
                        setEditProduct({ ...p });
                        setEditOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#FF8C00] text-white text-xs font-medium hover:opacity-80"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(p._id);
                        setConfirmProductOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#FF2E3B] text-white text-xs font-medium hover:opacity-80"
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
        )}

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
            onClick={() => setProductPage((p) => Math.min(productPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#1A1A1A] disabled:opacity-40 hover:bg-[#EBF2FF] transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Confirm delete product */}
      <ConfirmModal
        open={confirmProductOpen}
        title="Delete product"
        description="Delete this product? This cannot be undone."
        onConfirm={removeProduct}
        onClose={() => {
          setConfirmProductOpen(false);
          setSelectedProduct(null);
        }}
      />

      {/* Edit product modal */}
      {editOpen && editProduct && (
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
                  min={0}
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct((s) => ({
                      ...s,
                      price: Math.max(0, Number(e.target.value)),
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
                  min={0}
                  value={editProduct.stock || 0}
                  onChange={(e) =>
                    setEditProduct((s) => ({
                      ...s,
                      stock: Math.max(0, Number(e.target.value)),
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
                rows={3}
                value={editProduct.description || ""}
                onChange={(e) =>
                  setEditProduct((s) => ({ ...s, description: e.target.value }))
                }
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

/* ────────────────────────────────────────────────
   Sub-component: Seller Sales section
   - orders placed by customers for this seller's products
   - paginated independently
   ──────────────────────────────────────────────── */
function SellerSalesSection({ userId }) {
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
    fetchSales();
  }, [fetchSales]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-[#FFAA4D] px-5 py-4 flex items-center justify-between">
        <h3 className="font-semibold text-[#1A1A1A]">
          Sales/Order from Customers{" "}
          <span className="ml-1 text-xs bg-white/60 text-[#1A1A1A] font-semibold px-2 py-0.5 rounded-full">
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
                className="bg-[#EBF2FF] rounded-xl p-4 animate-pulse"
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
          <p className="text-sm text-[#555555] py-4 text-center">
            No sales yet.
          </p>
        ) : (
          <div className="space-y-3">
            {sales.map((o) => (
              <div key={o._id} className="bg-[#EBF2FF] rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-[#555555]">
                    #{o._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-xs text-[#555555]">
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleDateString("en-NG", {
                          dateStyle: "medium",
                        })
                      : ""}
                  </span>
                </div>
                <div className="text-xs text-[#555555] mb-2">
                  Customer:{" "}
                  <span className="font-medium text-[#1A1A1A]">
                    {o.user?.name || "Unknown"} — {o.user?.email || ""}
                  </span>
                </div>
                <div className="text-xs text-[#555555] mb-2 truncate">
                  Items:{" "}
                  {o.orderItems?.map((item) => item.name).join(", ") || "N/A"}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1A1A1A]">
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
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#1A1A1A] disabled:opacity-40 hover:bg-[#EBF2FF] transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-[#555555]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#1A1A1A] disabled:opacity-40 hover:bg-[#EBF2FF] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Main AdminUser page
   ──────────────────────────────────────────────── */
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
      <div className="min-h-screen bg-[#FF8C00] px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-[#FFAA4D]/60 rounded-xl px-5 py-4 animate-pulse">
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
            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize bg-white/50 text-[#1A1A1A]">
              {user?.role}
            </span>
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

        {/* ── Edit User + Customer Orders ── */}
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

          {/* Customer purchase orders */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">
              {isSeller ? "User's Purchases" : "Orders"}{" "}
              <span className="ml-1 text-xs bg-[#EBF2FF] text-[#2B80FF] font-semibold px-2 py-0.5 rounded-full">
                {ordersTotal}
              </span>
            </h3>
            <div className="space-y-2 max-h-52 overflow-auto pr-1">
              {orders.length === 0 && (
                <p className="text-sm text-[#555555]">No orders yet.</p>
              )}
              {orders.map((o) => (
                <div key={o._id} className="bg-[#EBF2FF] rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#555555] truncate">
                      #{o._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs text-[#555555]">
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
            {ordersTotal > 0 && (
              <Link
                to={`/admin/users/${id}/orders`}
                className="mt-3 inline-block w-full text-center px-3 py-2 rounded-lg bg-[#2B80FF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                View All Orders →
              </Link>
            )}
          </div>
        </div>

        {/* ── Seller-only sections ── */}
        {isSeller && (
          <>
            {/* Seller Sales (orders from customers who bought their products) */}
            <SellerSalesSection userId={id} />

            {/* Products */}
            <ProductsSection userId={id} userRole={user?.role} />
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
