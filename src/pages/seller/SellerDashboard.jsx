import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiPackage,
  FiShoppingBag,
  FiImage,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import ConfirmModal from "../../components/ConfirmModal";
import MessageModal from "../../components/MessageModal";
import { toast } from "react-toastify";

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/seller/my-products");
      setProducts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const promptDelete = (id) => {
    setTargetId(id);
    setShowConfirm(true);
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      fetchMyProducts();
      toast.success("Product deleted");
    } catch (err) {
      console.error("Failed to delete product", err);
      const msg = err.response?.data?.message || "Delete failed";
      setMessageText(msg);
      setMessageOpen(true);
      toast.error(msg);
    }
  };

  const handleConfirmDelete = async () => {
    setShowConfirm(false);
    if (!targetId) return;
    await deleteProduct(targetId);
    setTargetId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* return home button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#1A1A1A", color: "#fff" }}
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* ── Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl px-6 py-3 mb-8"
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
            Your Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#3a2a00" }}>
            {products.length} product{products.length === 1 ? "" : "s"} listed
          </p>
        </div>
        <div className="grid gap-2">
          <Link
            to="/seller/add"
            className="inline-flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 shadow-sm self-start sm:self-auto"
            style={{ backgroundColor: "#2B80FF", color: "#fff" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1a6de0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#2B80FF")
            }
          >
            <FiPlus className="w-4 h-4" />
            Add New Product
          </Link>
          {/* view your orders */}
          <Link
            to="/seller/orders"
            className="inline-flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 shadow-sm self-start sm:self-auto border-2 border-white text-blue-600 hover:bg-blue-50 hover:border-blue-600"
          >
            <FiShoppingBag className="w-4 h-4" />
            View Your Orders
          </Link>
        </div>
      </div>

      {/* ── Loading skeletons ── */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl"
              style={{ backgroundColor: "#f3f4f6", height: "220px" }}
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && products.length === 0 && (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
        >
          <FiPackage
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: "#FFAA4D" }}
          />
          <p className="font-semibold text-base" style={{ color: "#1A1A1A" }}>
            No products yet
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: "#555555" }}>
            Start by adding your first product to the marketplace.
          </p>
          <Link
            to="/seller/add"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95"
            style={{ backgroundColor: "#2B80FF", color: "#fff" }}
          >
            <FiPlus className="w-4 h-4" />
            Add your first product
          </Link>
        </div>
      )}

      {/* ── Product grid ── */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <div
              key={p._id}
              className="rounded-xl border overflow-hidden flex flex-col transition-all duration-200"
              style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(43,128,255,0.12), 0 2px 6px rgba(0,0,0,0.06)";
                e.currentTarget.style.borderColor = "#d0e4ff";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Product image */}
              <div
                className="relative h-32 w-full overflow-hidden"
                style={{ backgroundColor: "#EBF2FF" }}
              >
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: "#2B80FF", opacity: 0.35 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info + actions */}
              <div className="flex flex-col flex-1 px-3 py-2 gap-2">
                <div className="flex-1">
                  <h3
                    className="font-semibold text-sm leading-snug line-clamp-2"
                    style={{ color: "#1A1A1A" }}
                  >
                    {p.name}
                  </h3>
                  <p
                    className="text-sm font-bold mt-1"
                    style={{ color: "#FF8C00" }}
                  >
                    ₦{Number(p.price).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/seller/edit/${p._id}`}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95"
                    style={{ backgroundColor: "#EBF2FF", color: "#2B80FF" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#d0e4ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#EBF2FF")
                    }
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z"
                      />
                    </svg>
                    Edit
                  </Link>

                  <button
                    onClick={() => promptDelete(p._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95"
                    style={{ backgroundColor: "#fff0f0", color: "#FF2E3B" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#ffd6d8")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#fff0f0")
                    }
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <ConfirmModal
        open={showConfirm}
        title="Delete product"
        description="Are you sure you want to permanently delete this product? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setShowConfirm(false)}
        confirmLabel="Delete"
      />

      <MessageModal
        open={messageOpen}
        message={messageText}
        onClose={() => setMessageOpen(false)}
      />
    </div>
  );
}
