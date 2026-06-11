import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import uploadService from "../../services/uploadService";
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

export default function EditProduct() {
  const { id } = useParams();
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
  const [fetching, setFetching] = useState(true);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setFetching(true);
        const res = await api.get(`/products/${id}`);
        setForm({
          name: res.data.name || "",
          price: res.data.price || "",
          category: res.data.category || "",
          description: res.data.description || "",
          image: res.data.image || "",
          images: res.data.images || [],
          stock: res.data.stock || 0,
        });
        setPreviews(
          res.data.images || (res.data.image ? [res.data.image] : []),
        );
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setFetching(false);
      }
    };
    fetchProduct();
  }, [id]);

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
      const payload = { ...form };
      // if new files selected, upload them first
      if (files.length > 0) {
        const urls = await uploadService.uploadImages(files);
        if (urls.length > 0) {
          payload.images = urls;
          payload.image = urls[0];
        }
      } else if (previews.length > 0) {
        payload.images = previews;
        if (previews.length > 0) payload.image = previews[0];
      }

      await api.put(`/products/${id}`, payload);
      toast.success("Product updated");
      navigate("/seller");
    } catch (err) {
      console.error("Update failed", err);
      setMsg(err.response?.data?.message || "Update failed");
      setMsgOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) return;
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
            Edit Product
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#3a2a00" }}>
            Update the details below and save your changes.
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
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* ── Form card ── */}
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
        >
          {fetching ? (
            <div className="space-y-5 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div
                    className="h-3 w-24 rounded mb-2"
                    style={{ backgroundColor: "#e5e7eb" }}
                  />
                  <div
                    className="h-10 w-full rounded-xl"
                    style={{ backgroundColor: "#EBF2FF" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <Field label="Product Name">
                <input
                  name="name"
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
                    value={form.price}
                    onChange={handleChange}
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={{ ...inputStyle, paddingLeft: "28px" }}
                    required
                  />
                </div>
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

              {/* Description */}
              <Field label="Description">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  onFocus={focusIn}
                  onBlur={focusOut}
                  style={{ ...inputStyle, height: "112px", resize: "none" }}
                />
              </Field>

              {/* Stock */}
              <Field label="Stock / Quantity">
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: Number(e.target.value) })
                  }
                  onFocus={focusIn}
                  onBlur={focusOut}
                  style={inputStyle}
                />
              </Field>

              {/* Image URL */}
              <Field label="Image URL">
                <input
                  name="image"
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "#2B80FF" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
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
                          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                          style={{ backgroundColor: "#FF2E3B", color: "#fff" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                        />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
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
