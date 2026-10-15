import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiPackage,
  FiShoppingBag,
} from "react-icons/fi";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "react-toastify";
import { getSellerLowStock, getMyPayouts } from "../../services/storefrontService";
import { thumbUrl } from "../../utils/cloudinaryUrl";
import { firstProductImage } from "../../utils/productImages";

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetId, setTargetId] = useState(null);

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

  const [lowStock, setLowStock] = useState([]);
  const [payouts, setPayouts] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyProducts();
    getSellerLowStock(5).then((res) => setLowStock(res.data.products || [])).catch(() => {});
    getMyPayouts().then((res) => setPayouts(res.data)).catch(() => {});
  }, []);

  const patchProduct = async (id, patch, message) => {
    try {
      const res = await api.put(`/products/${id}`, patch);
      setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, ...res.data } : p)));
      toast.success(message);
      fetchMyProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the product");
    }
  };

  const promptDelete = (id) => {
    setTargetId(id);
    setShowConfirm(true);
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      // Optimistically remove the product from UI immediately
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted");
      // Background refresh to sync with server
      fetchMyProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
      toast.error(err.response?.data?.message || "Delete failed");
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
          style={{ backgroundColor: "#101828", color: "#fff" }}
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* ── Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl px-6 py-3 mb-8"
        style={{ backgroundColor: "#101828" }}
      >
        <div>
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-1"
            style={{
              backgroundColor: "rgba(255,255,255,0.25)",
              color: "#FFFFFF",
            }}
          >
            Seller Portal
          </span>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "#FFFFFF" }}
          >
            Your Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#D0D5DD" }}>
            {products.length} product{products.length === 1 ? "" : "s"} listed
          </p>
        </div>
        <div className="grid gap-2">
          <Link
            to="/seller/add"
            className="inline-flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 shadow-sm self-start sm:self-auto"
            style={{ backgroundColor: "#047857", color: "#fff" }}
          >
            <FiPlus className="w-4 h-4" />
            Add New Product
          </Link>
          {/* view your orders */}
          <Link
            to="/seller/orders"
            className="inline-flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 shadow-sm self-start sm:self-auto border-2 border-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-700"
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
            style={{ color: "#101828" }}
          />
          <p className="font-semibold text-base" style={{ color: "#101828" }}>
            No products yet
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: "#667085" }}>
            Start by adding your first product to the marketplace.
          </p>
          <Link
            to="/seller/add"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95"
            style={{ backgroundColor: "#047857", color: "#fff" }}
          >
            <FiPlus className="w-4 h-4" />
            Add your first product
          </Link>
        </div>
      )}

      {(lowStock.length > 0 || payouts) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-800 mb-2">Low-stock alerts ({lowStock.length})</h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-amber-700">Nothing is running low right now.</p>
            ) : (
              <ul className="space-y-1 text-sm text-amber-900">
                {lowStock.slice(0, 6).map((p) => (
                  <li key={p._id} className="flex justify-between gap-2">
                    <Link to={`/seller/edit/${p._id}`} className="font-semibold hover:underline">{p.name}</Link>
                    <span>{p.countInStock ?? p.stock ?? 0} left</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="font-bold text-emerald-800 mb-2">Payouts</h2>
            {payouts ? (
              <div className="text-sm text-emerald-900 space-y-1">
                <p>Earned from delivered orders: <strong>₦{Number(payouts.balance?.earned || 0).toLocaleString()}</strong></p>
                <p>Paid out: <strong>₦{Number(payouts.balance?.paidOut || 0).toLocaleString()}</strong></p>
                <p>Outstanding: <strong>₦{Number(payouts.balance?.outstanding || 0).toLocaleString()}</strong></p>
                {(payouts.history || []).slice(0, 3).map((h) => (
                  <p key={h._id} className="text-xs">₦{Number(h.amount).toLocaleString()} · {new Date(h.paidAt || h.createdAt).toLocaleDateString()} · {h.method}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-700">Payout history will appear here once orders are delivered.</p>
            )}
          </section>
        </div>
      )}

      {/* ── Product grid ── */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <div
              key={p._id}
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_8px_24px_rgba(4,120,87,0.12),0_2px_6px_rgba(0,0,0,0.06)]"
            >
              {/* Product image */}
              <div
                className="relative h-32 w-full overflow-hidden"
                style={{ backgroundColor: "#ECFDF5" }}
              >
                <img
                  src={thumbUrl(firstProductImage(p))}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info + actions */}
              <div className="flex flex-col flex-1 px-3 py-2 gap-2">
                <div className="flex-1">
                  <h3
                    className="font-semibold text-sm leading-snug line-clamp-2"
                    style={{ color: "#101828" }}
                  >
                    {p.name}
                  </h3>
                  <p
                    className="text-sm font-bold mt-1"
                    style={{ color: "#B45309" }}
                  >
                    {p.hasVariants ? "From " : ""}₦
                    {Number(p.price).toLocaleString()}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#667085" }}>
                    {p.hasVariants
                      ? `${p.variantCount ?? 0} variants · ${p.stock ?? 0} total in stock`
                      : `${p.stock ?? 0} in stock`}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.isDraft && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">Draft</span>}
                    {p.moderationStatus === "pending" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">In moderation</span>}
                    {p.moderationStatus === "rejected" && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700" title={p.moderationNote || ""}>
                        Rejected{p.moderationNote ? `: ${p.moderationNote}` : ""}
                      </span>
                    )}
                    {p.isActive === false && !p.isDraft && p.moderationStatus === "approved" && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">Paused</span>
                    )}
                    {(p.stock ?? p.countInStock ?? 99) <= 5 && p.isActive !== false && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">Low stock</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {p.isDraft ? (
                    <button
                      onClick={() => patchProduct(p._id, { isDraft: false, isActive: true }, "Listing submitted for moderation")}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white"
                    >
                      Publish
                    </button>
                  ) : p.isActive === false ? (
                    <button
                      onClick={() => patchProduct(p._id, { isActive: true }, "Listing resumed")}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white"
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => patchProduct(p._id, { isActive: false }, "Listing paused")}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700"
                    >
                      Pause
                    </button>
                  )}
                  {!p.isDraft && (
                    <button
                      onClick={() => patchProduct(p._id, { isDraft: true, isActive: false }, "Moved to drafts")}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700"
                    >
                      Draft
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/seller/edit/${p._id}`}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95"
                    style={{ backgroundColor: "#ECFDF5", color: "#047857" }}
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
                    style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
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

    </div>
  );
}
