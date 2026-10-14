import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import uploadService from "../../../services/uploadService";
import { toast } from "react-toastify";
import ConfirmModal from "../../../components/ConfirmModal";
import { thumbUrl } from "../../../utils/cloudinaryUrl";
import VariantEditor from "../../../components/VariantEditor";
import { categories, inputCls } from "./adminUserShared";

// Products owned by the user being managed: debounced search, create /
// edit (with variant editor) and delete, paginated independently of the
// rest of the AdminUser page.
export default function AdminUserProducts({ userId, userRole }) {
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
    hasVariants: false,
    options: [],
    variants: [],
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (newProduct.hasVariants && newProduct.variants.length === 0) {
      toast.error("Generate at least one variant, or turn variants off.");
      return;
    }
    try {
      setCreating(true);
      let urls = [];
      if (newProduct.images?.length > 0) {
        urls = await uploadService.uploadImages(newProduct.images);
      }
      await api.post(`/admin/users/${userId}/products`, {
        ...newProduct,
        options: newProduct.hasVariants ? newProduct.options : [],
        variants: newProduct.hasVariants
          ? newProduct.variants.map((v) => ({
              ...v,
              price: Number(v.price) || 0,
              stock: Number(v.stock) || 0,
            }))
          : [],
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
        hasVariants: false,
        options: [],
        variants: [],
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
      <div className="bg-[#ECFDF5] px-5 py-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[#101828] shrink-0">
          Products{" "}
          <span className="ml-1 text-xs bg-white/60 text-[#101828] font-semibold px-2 py-0.5 rounded-full">
            {productTotal}
          </span>
        </h3>
        {/* Search — only the products section re-renders, never the whole page */}
        <input
          value={productSearch}
          onChange={handleSearchChange}
          placeholder="Search products…"
          className="bg-white border border-white/60 rounded-lg px-3 py-1.5 text-sm text-[#101828] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#047857] w-48"
        />
      </div>

      <div className="p-5 space-y-5">
        {/* Create Product Form — seller only */}
        {userRole === "seller" && (
          <div className="bg-[#ECFDF5] rounded-xl p-4">
            <div
              onClick={() => setShowAddForm((prev) => !prev)}
              className="flex items-center justify-between cursor-pointer select-none rounded-lg border-2 border-dashed border-[#047857]/40 bg-white px-4 py-3 hover:border-[#047857] hover:bg-[#F6F7F4] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#047857] text-white font-bold">
                  +
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#101828]">
                    Add New Product
                  </h4>
                  {!showAddForm && (
                    <p className="text-xs text-[#667085]">
                      Click here to create a product
                    </p>
                  )}
                </div>
              </div>
              <span
                className="text-[#047857] font-bold text-lg transition-transform duration-200"
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
                  <label className="text-sm font-medium text-[#101828] bg-gray-200 p-0.5 rounded-md">
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
                  <label className="text-sm font-medium text-[#101828] bg-gray-200 p-0.5 rounded-md">
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
                  <label className="text-sm font-medium text-[#101828] bg-gray-200 p-0.5 rounded-md">
                    Images
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={(e) =>
                        setNewProduct((n) => ({
                          ...n,
                          images: Array.from(e.target.files),
                        }))
                      }
                      className="text-sm text-[#667085] file:mr-2 file:px-3 file:py-2.5 file:rounded-lg file:border-0 file:bg-[#047857] file:text-white file:text-xs file:font-medium file:cursor-pointer"
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
                <VariantEditor
                  category={newProduct.category}
                  basePrice={Number(newProduct.price) || 0}
                  value={newProduct}
                  onChange={(next) =>
                    setNewProduct((n) => ({ ...n, ...next }))
                  }
                />
                <button
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-[#047857] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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
                  <div className="text-sm font-semibold text-[#101828] truncate">
                    {p.name}
                  </div>
                  <div className="text-xs text-[#667085] mt-0.5">
                    {p.hasVariants ? "From " : ""}₦
                    {Number(p.price).toLocaleString()}
                    {p.hasVariants
                      ? ` · ${p.variantCount ?? p.variants?.length ?? 0} variants · ${p.stock ?? 0} in stock`
                      : ` · ${p.stock ?? 0} in stock`}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Link
                      to={`/product/${p._id}`}
                      className="px-2 py-1 rounded-lg bg-[#ECFDF5] text-[#047857] text-xs font-medium hover:opacity-80"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => {
                        setEditProduct({ ...p });
                        setEditOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#101828] text-white text-xs font-medium hover:opacity-80"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(p._id);
                        setConfirmProductOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#DC2626] text-white text-xs font-medium hover:opacity-80"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="col-span-3 text-sm text-[#667085] py-4">
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
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#101828] disabled:opacity-40 hover:bg-[#ECFDF5] transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-[#667085]">
            {productPage} / {productPages}
          </span>
          <button
            disabled={productPage >= productPages}
            onClick={() => setProductPage((p) => Math.min(productPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-[#101828] disabled:opacity-40 hover:bg-[#ECFDF5] transition-colors"
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
            <div className="bg-[#ECFDF5] px-5 py-4">
              <h3 className="font-bold text-[#101828]">Edit Product</h3>
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
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(e) =>
                    setEditProduct((s) => ({
                      ...s,
                      images: Array.from(e.target.files),
                    }))
                  }
                  className="text-sm text-[#667085] file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#047857] file:text-white file:text-xs file:font-medium file:cursor-pointer"
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
              <VariantEditor
                category={editProduct.category}
                basePrice={Number(editProduct.price) || 0}
                value={editProduct}
                onChange={(next) =>
                  setEditProduct((s) => ({ ...s, ...next }))
                }
              />
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-[#101828] hover:bg-[#ECFDF5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#047857] text-white text-sm font-medium hover:opacity-90 transition-opacity"
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
