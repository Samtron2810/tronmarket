import { useState } from "react";
import { FiArrowLeft, FiUpload, FiPlus } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import api from "../../services/api";
import uploadService from "../../services/uploadService";
import { useNavigate, Link } from "react-router-dom";
import MessageModal from "../../components/MessageModal";
import { toast } from "react-toastify";

const categories = ["phones", "laptops", "fashion", "home", "electronics"];

const inputStyle = {
  backgroundColor: "#EBF2FF",
  color: "#1A1A1A",
  border: "1.5px solid #d0e4ff",
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
  color: "#555555",
};

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function AddProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: "",
    images: [],
    stock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const focusIn = (e) => {
    e.target.style.borderColor = "#2B80FF";
    e.target.style.boxShadow = "0 0 0 3px rgba(43,128,255,0.15)";
  };
  const focusOut = (e) => {
    e.target.style.borderColor = "#d0e4ff";
    e.target.style.boxShadow = "none";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };
      // If files are present, upload them first to get URLs
      if (files.length > 0) {
        const urls = await uploadService.uploadImages(files);
        if (urls.length > 0) {
          payload.images = urls;
          payload.image = urls[0];
        }
      } else if (previews.length > 0) {
        // If user only used image URL inputs or previews from existing URLs
        payload.images = previews;
        if (previews.length > 0) payload.image = previews[0];
      }

      await api.post("/products", payload);
      toast.success("Product created");
      navigate("/seller");
    } catch (err) {
      const m = err.response?.data?.message || "Create failed";
      setMsg(m);
      setMsgOpen(true);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) return;
    // create previews for UI and keep File objects for upload
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
    setFiles((fs) => fs.filter((_, i) => i !== idx));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Page header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl px-6 py-5 mb-8"
        style={{ backgroundColor: "#FFAA4D" }}
      >
        <div>
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-1"
            style={{
              backgroundColor: "rgba(255,255,255,0.25)",
              color: "#1A1A1A",
            }}
          >
            Seller Portal
          </span>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "#1A1A1A" }}
          >
            Add New Product
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#3a2a00" }}>
            Fill in the details below to list a product on TronMarket.
          </p>
        </div>

        <Link
          to="/seller"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 self-start sm:self-auto"
          style={{
            backgroundColor: "rgba(255,255,255,0.30)",
            color: "#1A1A1A",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.50)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.30)")
          }
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* ── Form card ── */}
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <Field label="Product Name">
              <input
                name="name"
                placeholder="e.g. Samsung Galaxy S24"
                value={form.name}
                onChange={handleChange}
                onFocus={focusIn}
                onBlur={focusOut}
                style={inputStyle}
                required
              />
            </Field>

            {/* Price */}
            <Field label="Price (₦)">
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#FF8C00",
                    pointerEvents: "none",
                  }}
                >
                  ₦
                </span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={handleChange}
                  onFocus={focusIn}
                  onBlur={focusOut}
                  style={{ ...inputStyle, paddingLeft: "28px" }}
                  required
                />
              </div>
            </Field>

            {/* Stock */}
            <Field label="Stock / Quantity">
              <input
                name="stock"
                type="number"
                min="0"
                placeholder="0"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value) })
                }
                onFocus={focusIn}
                onBlur={focusOut}
                style={inputStyle}
              />
            </Field>

            {/* Category */}
            <Field label="Category">
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                onFocus={focusIn}
                onBlur={focusOut}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </Field>

            {/* Image URL */}
            <Field label="Image URL">
              <input
                name="image"
                placeholder="https://example.com/image.jpg"
                value={form.image}
                onChange={handleChange}
                onFocus={focusIn}
                onBlur={focusOut}
                style={inputStyle}
              />
              {form.image && (
                <div
                  className="mt-2 rounded-xl overflow-hidden border"
                  style={{ borderColor: "#d0e4ff", height: "140px" }}
                >
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </Field>

            {/* File upload */}
            <Field label="Upload Images (optional)">
              <label
                className="flex flex-col items-center justify-center gap-2 w-full cursor-pointer rounded-xl border-2 border-dashed transition-all duration-150"
                style={{
                  borderColor: "#2B80FF",
                  backgroundColor: "#EBF2FF",
                  padding: "18px 14px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d0e4ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#EBF2FF")
                }
              >
                <FiUpload className="w-6 h-6" style={{ color: "#2B80FF" }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#2B80FF" }}
                >
                  Click to upload images
                </span>
                <span className="text-xs" style={{ color: "#555555" }}>
                  PNG, JPG, WEBP supported
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFiles}
                  className="hidden"
                />
              </label>

              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden border"
                      style={{ height: 80, borderColor: "#d0e4ff" }}
                    >
                      <img
                        src={src}
                        alt={`preview-${i}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(i)}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-150"
                        style={{ backgroundColor: "#FF2E3B", color: "#fff" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea
                name="description"
                placeholder="Describe the product — condition, features, what's included…"
                value={form.description}
                onChange={handleChange}
                onFocus={focusIn}
                onBlur={focusOut}
                style={{ ...inputStyle, height: "112px", resize: "none" }}
              />
            </Field>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 gap-3">
              <Link
                to="/seller"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                style={{ backgroundColor: "#f3f4f6", color: "#222222" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e5e7eb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#2B80FF", color: "#fff" }}
                onMouseEnter={(e) => {
                  if (!loading)
                    e.currentTarget.style.backgroundColor = "#1a6de0";
                }}
                onMouseLeave={(e) => {
                  if (!loading)
                    e.currentTarget.style.backgroundColor = "#2B80FF";
                }}
              >
                {loading ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <FiPlus className="w-4 h-4" />
                    Create Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <MessageModal
        open={msgOpen}
        message={msg}
        onClose={() => setMsgOpen(false)}
      />
    </div>
  );
}
