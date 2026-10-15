import { useEffect, useState } from "react";
import { FiArrowLeft, FiUpload, FiPlus, FiCheck } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import api from "../../services/api";
import uploadService from "../../services/uploadService";
import { useNavigate, Link } from "react-router-dom";
import VariantEditor from "../../components/VariantEditor";
import { getCategories } from "../../services/storefrontService";
import { toast } from "react-toastify";

const FALLBACK_CATEGORIES = ["phones", "laptops", "fashion", "home", "electronics"];

const inputStyle = {
  backgroundColor: "#ECFDF5",
  color: "#101828",
  border: "1.5px solid #A7F3D0",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: "6px",
  color: "#667085",
};

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const focusIn = (e) => {
  e.target.style.borderColor = "#047857";
  e.target.style.boxShadow = "0 0 0 3px rgba(4,120,87,0.15)";
};
const focusOut = (e) => {
  e.target.style.borderColor = "#A7F3D0";
  e.target.style.boxShadow = "none";
};

const EMPTY_FORM = {
  name: "",
  price: "",
  category: "",
  brand: "",
  description: "",
  image: "",
  images: [],
  stock: 0,
  hasVariants: false,
  options: [],
  variants: [],
  isDraft: false,
  discountPercent: 0,
};

/**
 * Shared create/edit product form (the two seller pages used to be ~90%
 * duplicated). Two-column on desktop: details on the left, images +
 * sticky save bar on the right.
 */
export default function ProductForm({ mode = "create", productId = null }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);
  const [existingCount, setExistingCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [moderation, setModeration] = useState(null);

  useEffect(() => {
    getCategories()
      .then((res) => {
        const names = (res.data || []).map((c) => c.name).filter(Boolean);
        if (names.length) setCategories([...new Set(names)]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !productId) return;
    const fetchProduct = async () => {
      try {
        setFetching(true);
        const res = await api.get(`/products/${productId}`);
        setForm({
          name: res.data.name || "",
          price: res.data.price || "",
          category: res.data.category || "",
          brand: res.data.brand || "",
          description: res.data.description || "",
          image: res.data.image || "",
          images: res.data.images || [],
          stock: res.data.stock || 0,
          hasVariants: res.data.hasVariants || false,
          isDraft: res.data.isDraft || false,
          discountPercent: res.data.discountPercent || 0,
          options: res.data.options || [],
          variants: res.data.variants || [],
        });
        setModeration(
          res.data.moderationStatus
            ? { status: res.data.moderationStatus, note: res.data.moderationNote || "" }
            : null,
        );
        const existing = res.data.images || (res.data.image ? [res.data.image] : []);
        setPreviews(existing);
        setExistingCount(existing.length);
      } catch (err) {
        console.error("Failed to load product", err);
        toast.error("Could not load this product");
      } finally {
        setFetching(false);
      }
    };
    fetchProduct();
  }, [isEdit, productId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const readers = incoming.map(
      (file) =>
        new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((images) => {
      setPreviews((p) => [...p, ...images]);
      setFiles((f) => [...f, ...incoming]);
    });
  };

  const removePreview = (idx) => {
    setPreviews((p) => p.filter((_, i) => i !== idx));
    const fileIdx = idx - existingCount;
    if (fileIdx >= 0) setFiles((fs) => fs.filter((_, i) => i !== fileIdx));
    else setExistingCount((c) => Math.max(0, c - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.hasVariants && form.variants.length === 0) {
      toast.error("Generate at least one variant, or turn variants off.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...form,
        price: Number(form.price),
        discountPercent: Math.min(90, Math.max(0, Number(form.discountPercent) || 0)),
        stock: Number(form.stock),
        options: form.hasVariants ? form.options : [],
        variants: form.hasVariants
          ? form.variants.map((v) => ({ ...v, price: Number(v.price) || 0, stock: Number(v.stock) || 0 }))
          : [],
      };
      if (files.length > 0) {
        const urls = await uploadService.uploadImages(files);
        if (urls.length > 0) {
          // keep pre-existing images the seller didn't remove
          payload.images = [...previews.slice(0, existingCount), ...urls];
          payload.image = payload.images[0];
        }
      } else if (previews.length > 0) {
        payload.images = previews;
        payload.image = previews[0];
      } else if (!isEdit) {
        payload.images = [];
        payload.image = form.image || "";
      }

      if (isEdit) {
        await api.put(`/products/${productId}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }
      navigate("/seller");
    } catch (err) {
      console.error(isEdit ? "Update failed" : "Create failed", err);
      toast.error(err.response?.data?.message || (isEdit ? "Update failed" : "Create failed"));
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [...new Set([...categories, ...(form.category ? [form.category] : [])])];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Page header ── */}
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl bg-[#101828] px-6 py-5 sm:flex-row sm:items-center">
        <div>
          <span className="mb-1 inline-block rounded-full bg-white/25 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
            Seller Portal
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="mt-0.5 text-sm text-[#D0D5DD]">
            {isEdit
              ? "Update the details below and save your changes."
              : "Fill in the details below to list a product on TronMarket."}
          </p>
        </div>
        <Link
          to="/seller"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/50 active:scale-95 sm:self-auto"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      {isEdit && moderation?.status === "rejected" && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          This listing was rejected{moderation.note ? `: ${moderation.note}` : ""}. Fix the issue and save to send it back for review.
        </div>
      )}
      {isEdit && moderation?.status === "pending" && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
          This listing is waiting for moderation and is not visible in the store yet.
        </div>
      )}

      {fetching ? (
        <div className="max-w-2xl mx-auto space-y-5 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-xl bg-emerald-50" />
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
            {/* ── Details column ── */}
            <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <Field label="Product Name">
                <input name="name" placeholder="e.g. Samsung Galaxy S24" value={form.name} onChange={handleChange} onFocus={focusIn} onBlur={focusOut} style={inputStyle} required />
              </Field>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Price (₦)">
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", fontWeight: "600", color: "#B45309", pointerEvents: "none" }}>₦</span>
                    <input name="price" type="number" min="0" placeholder="0.00" value={form.price} onChange={handleChange} onFocus={focusIn} onBlur={focusOut} style={{ ...inputStyle, paddingLeft: "28px" }} required />
                  </div>
                </Field>

                <Field label="Discount % (sale)">
                  <input
                    name="discountPercent"
                    type="number" min="0" max="90" placeholder="0"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Math.min(90, Math.max(0, Number(e.target.value) || 0)) })}
                    onFocus={focusIn} onBlur={focusOut} style={inputStyle}
                  />
                </Field>

                <Field label="Stock / Quantity">
                  <input name="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} onFocus={focusIn} onBlur={focusOut} style={inputStyle} />
                </Field>
              </div>
              {Number(form.discountPercent) > 0 && Number(form.price) > 0 && (
                <p className="-mt-2 text-xs font-semibold text-red-600">
                  Sale price: ₦{Math.round((Number(form.price) * (100 - Number(form.discountPercent))) / 100).toLocaleString()}{" "}
                  <span className="text-gray-400">(was ₦{Number(form.price).toLocaleString()})</span>
                  <span className="block font-normal text-gray-500">Applies to the price and every variant. Customers are charged the sale price.</span>
                </p>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Category">
                  <select name="category" value={form.category} onChange={handleChange} onFocus={focusIn} onBlur={focusOut} style={{ ...inputStyle, cursor: "pointer" }} required>
                    <option value="" disabled>Select a category…</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Brand (optional)">
                  <input name="brand" placeholder="e.g. Samsung" value={form.brand} onChange={handleChange} onFocus={focusIn} onBlur={focusOut} style={inputStyle} />
                </Field>
              </div>

              <Field label="Description">
                <textarea name="description" placeholder="Describe the product — condition, features, what's included…" value={form.description} onChange={handleChange} onFocus={focusIn} onBlur={focusOut} style={{ ...inputStyle, height: "112px", resize: "none" }} />
              </Field>

              <VariantEditor
                category={form.category}
                basePrice={Number(form.price) || 0}
                value={form}
                onChange={(next) => setForm((f) => ({ ...f, ...next }))}
              />
              {form.hasVariants && (
                <p className="text-xs text-[#667085]">
                  The Stock field above is ignored for variant products — stock is tracked per variant. The Price above is the starting price used to prefill new variants.
                </p>
              )}

              <label className="flex items-center gap-2 text-sm font-medium text-[#101828]">
                <input type="checkbox" checked={Boolean(form.isDraft)} onChange={(e) => setForm({ ...form, isDraft: e.target.checked })} />
                Save as draft (publish later from your dashboard)
              </label>
              <p className="text-xs text-[#667085]">New listings go through a quick moderation review before they appear in the store.</p>
            </div>

            {/* ── Images + sticky save column ── */}
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <Field label="Image URL">
                  <input name="image" placeholder="https://example.com/image.jpg" value={form.image} onChange={handleChange} onFocus={focusIn} onBlur={focusOut} style={inputStyle} />
                  {form.image && (
                    <div className="mt-2 h-[140px] overflow-hidden rounded-xl border border-emerald-200">
                      <img src={form.image} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                    </div>
                  )}
                </Field>

                <div className="mt-5">
                  <label style={labelStyle}>Upload Images (optional)</label>
                  <label
                    className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-5 transition ${dragOver ? "border-emerald-600 bg-emerald-100" : "border-emerald-600 bg-emerald-50"}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  >
                    <FiUpload className="h-6 w-6 text-emerald-700" />
                    <span className="text-sm font-semibold text-emerald-700">Click or drag & drop images</span>
                    <span className="text-xs text-[#667085]">PNG, JPG, WEBP or GIF, up to 5 images at 5 MB each</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
                  </label>

                  {previews.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {previews.map((src, i) => (
                        <div key={i} className="relative h-20 overflow-hidden rounded-xl border border-emerald-200">
                          <img src={src} alt={`preview-${i}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePreview(i)}
                            aria-label={`Remove image ${i + 1}`}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky save bar */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <><FaSpinner className="h-4 w-4 animate-spin" /> {isEdit ? "Saving…" : "Creating…"}</>
                  ) : isEdit ? (
                    <><FiCheck className="h-4 w-4" /> Save Changes</>
                  ) : (
                    <><FiPlus className="h-4 w-4" /> Create Product</>
                  )}
                </button>
                <Link to="/seller" className="mt-2 block rounded-xl bg-gray-100 px-5 py-2.5 text-center text-sm font-semibold text-[#101828] transition hover:bg-gray-200">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
