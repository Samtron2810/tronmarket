import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import uploadService from "../../../services/uploadService";
import { toast } from "react-toastify";
import ConfirmModal from "../../../components/ConfirmModal";
import { thumbUrl } from "../../../utils/cloudinaryUrl";
import { firstProductImage } from "../../../utils/productImages";
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
    discountPercent: 0,
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
  const [editSaving, setEditSaving] = useState(false);

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
        discountPercent: 0,
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

  const closeEdit = () => {
    if (editSaving) return;
    setEditOpen(false);
    setEditProduct(null);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editProduct || editSaving) return;
    setEditSaving(true);
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
    } finally {
      setEditSaving(false);
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
                  <label className="text-sm font-medium text-[#101828] bg-gray-200 p-0.5 rounded-md">
                    Discount % (0 = no sale)
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={newProduct.discountPercent}
                      onChange={(e) =>
                        setNewProduct((n) => ({
                          ...n,
                          discountPercent: Math.min(90, Math.max(0, Number(e.target.value) || 0)),
                        }))
                      }
                      className={inputCls}
                    />
                  </label>
                  {Number(newProduct.discountPercent) > 0 && Number(newProduct.price) > 0 && (
                    <p className="self-end pb-1 text-xs font-semibold text-red-600 col-span-2">
                      Sale price: ₦{Math.round(Number(newProduct.price) * (100 - Number(newProduct.discountPercent)) / 100).toLocaleString()}
                    </p>
                  )}
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
                  src={thumbUrl(firstProductImage(p))}
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
                    {Number(p.discountPercent) > 0 && (
                      <span className="ml-1 rounded bg-red-600 px-1 py-px text-[9px] font-bold text-white">
                        −{p.discountPercent}%
                      </span>
                    )}
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

      {/* Edit product modal: the header and action bar stay fixed while
          only the fields scroll, so Save/Cancel remain reachable no matter
          how many variants the product has. */}
      {editOpen && editProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-edit-product-title"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeEdit}
          />
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]">
            <form onSubmit={handleEditSave} className="flex min-h-0 flex-1 flex-col">
              {/* Fixed dialog header */}
              <div className="flex flex-none items-center gap-3 border-b border-emerald-100 bg-[#ECFDF5] px-4 py-3 sm:px-6 sm:py-4">
                <img
                  src={thumbUrl(firstProductImage(editProduct))}
                  alt=""
                  className="h-11 w-11 flex-none rounded-xl border border-white object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                    Edit product
                  </p>
                  <h3
                    id="admin-edit-product-title"
                    className="truncate text-base font-bold text-[#101828] sm:text-lg"
                  >
                    {editProduct.name || "Untitled product"}
                  </h3>
                  <p className="truncate text-xs text-[#667085]">
                    {editProduct.category || "No category"} · Update the listing details below
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={editSaving}
                  aria-label="Close edit product"
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-xl leading-none text-gray-500 shadow-sm transition hover:text-gray-900 disabled:cursor-wait disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              {/* Scrollable fields */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F6F7F4] px-4 py-4 sm:px-6 sm:py-5">
                <div className="space-y-4">
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-[#101828]">Product details</h4>
                      <p className="mt-0.5 text-xs text-[#667085]">
                        The name, category, images and description customers see.
                      </p>
                    </div>

                    <label className="block text-xs font-semibold text-[#475467]">
                      Product name
                      <input
                        value={editProduct.name || ""}
                        onChange={(e) =>
                          setEditProduct((s) => ({ ...s, name: e.target.value }))
                        }
                        className={`${inputCls} mt-1`}
                      />
                    </label>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-semibold text-[#475467]">
                        Category
                        <select
                          value={editProduct.category || ""}
                          onChange={(e) =>
                            setEditProduct((s) => ({ ...s, category: e.target.value }))
                          }
                          className={`${inputCls} mt-1`}
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-xs font-semibold text-[#475467]">
                        Replace product images
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
                          className="mt-1 block w-full text-xs text-[#667085] file:mr-2 file:rounded-lg file:border-0 file:bg-[#047857] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                      Leave the image picker untouched to keep the current images. No image is required — the branded placeholder is used when a product has none.
                    </p>

                    <label className="mt-4 block text-xs font-semibold text-[#475467]">
                      Description
                      <textarea
                        rows={4}
                        value={editProduct.description || ""}
                        onChange={(e) =>
                          setEditProduct((s) => ({ ...s, description: e.target.value }))
                        }
                        className={`${inputCls} mt-1 resize-y`}
                      />
                    </label>
                  </section>

                  <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-[#101828]">Pricing & stock</h4>
                      <p className="mt-0.5 text-xs text-[#667085]">
                        Discount applies to the base product and its variants.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block text-xs font-semibold text-[#475467]">
                        Price (₦)
                        <input
                          type="number"
                          min={0}
                          value={editProduct.price ?? 0}
                          onChange={(e) =>
                            setEditProduct((s) => ({
                              ...s,
                              price: Math.max(0, Number(e.target.value)),
                            }))
                          }
                          className={`${inputCls} mt-1`}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-[#475467]">
                        Discount % (sale)
                        <input
                          type="number"
                          min={0}
                          max={90}
                          value={editProduct.discountPercent ?? 0}
                          onChange={(e) =>
                            setEditProduct((s) => ({
                              ...s,
                              discountPercent: Math.min(90, Math.max(0, Number(e.target.value) || 0)),
                            }))
                          }
                          className={`${inputCls} mt-1`}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-[#475467]">
                        Stock
                        <input
                          type="number"
                          min={0}
                          value={editProduct.stock || 0}
                          onChange={(e) =>
                            setEditProduct((s) => ({
                              ...s,
                              stock: Math.max(0, Number(e.target.value)),
                            }))
                          }
                          className={`${inputCls} mt-1`}
                        />
                      </label>
                    </div>

                    {Number(editProduct.discountPercent) > 0 && Number(editProduct.price) > 0 && (
                      <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        Sale price: ₦{Math.round(Number(editProduct.price) * (100 - Number(editProduct.discountPercent)) / 100).toLocaleString()} (applies to variants too)
                      </p>
                    )}
                  </section>

                  <section>
                    <div className="mb-2 px-1">
                      <h4 className="text-sm font-bold text-[#101828]">Variants</h4>
                      <p className="mt-0.5 text-xs text-[#667085]">
                        Variant combinations stay inside the scrolling area; the Save bar below is always reachable.
                      </p>
                    </div>
                    <VariantEditor
                      category={editProduct.category}
                      basePrice={Number(editProduct.price) || 0}
                      value={editProduct}
                      onChange={(next) =>
                        setEditProduct((s) => ({ ...s, ...next }))
                      }
                    />
                  </section>
                </div>
              </div>

              {/* Always-visible action bar */}
              <div className="flex flex-none flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(16,24,40,0.07)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <p className="hidden text-xs text-[#667085] sm:block">
                  Review the changes, then save. This bar stays visible while you scroll.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={editSaving}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-[#101828] transition-colors hover:bg-[#ECFDF5] disabled:cursor-wait disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="rounded-lg bg-[#047857] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
