import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FaStore, FaArrowLeft } from "react-icons/fa";
import { thumbUrl } from "../utils/cloudinaryUrl";
import { toast } from "react-toastify";

export default function Cart() {
  const { cart, updateQtyLocal, removeItemLocal } = useContext(CartContext);

  if (!cart) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Header skeleton */}
        <div className="animate-pulse rounded-2xl px-6 py-5 mb-8 bg-[#FFAA4D]/60">
          <div className="h-5 w-24 bg-white/40 rounded-full mb-2" />
          <div className="h-7 w-32 bg-white/40 rounded-lg" />
        </div>
        {/* Items skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse flex items-center gap-4 rounded-2xl border border-gray-200 px-5 py-4 bg-white"
            >
              <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Clamp to available stock BEFORE updating state or hitting the network.
  // This is what actually fixes the "reverts by only 1" bug: an over-stock
  // value is never sent in the first place, so there's nothing to race or revert.
  const updateQty = (item, rawValue) => {
    const productId = item.product?._id || item.product;
    const stock = item.product?.stock || 0;

    let next = parseInt(rawValue, 10);
    if (!Number.isFinite(next) || next < 1) next = 1;

    if (next > stock) {
      toast.error(`Only ${stock} left in stock`);
      next = stock;
    }

    updateQtyLocal(productId, next);
  };

  const removeItem = (productId) => {
    removeItemLocal(productId);
  };

  const total = cart.items.reduce((acc, item) => {
    // exclude out-of-stock items from total
    if (!item.product || !item.product.stock || item.product.stock <= 0)
      return acc;
    return acc + (item.product.price || 0) * item.quantity;
  }, 0);

  // FIX #5: only in-stock items are available for checkout — used in summary
  const availableItems = cart.items.filter(
    (item) => item.product?.stock && item.product.stock > 0,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] hover:opacity-80 transition-opacity mb-4 group"
      >
        <FaArrowLeft className="transform group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between rounded-2xl px-6 py-5 mb-8"
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
            Shopping
          </span>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "#1A1A1A" }}
          >
            Your Cart
          </h1>
          {cart.items.length > 0 && (
            <p className="text-sm mt-0.5" style={{ color: "#3a2a00" }}>
              {cart.items.length} item{cart.items.length === 1 ? "" : "s"} in
              your cart
            </p>
          )}
        </div>

        {/* customer orders */}
        <Link
          to="/my-orders"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-blue-600 text-sm font-medium transition-all duration-150"
          style={{ color: "#222222" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.5)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <FaStore className="w-3.5 h-3.5" />
          <span>View my Orders</span>
        </Link>
      </div>

      {/* ── Empty state ── */}
      {cart.items.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
        >
          <svg
            className="w-12 h-12 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "#FFAA4D" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 7h13"
            />
          </svg>
          <p
            className="font-semibold text-base mb-1"
            style={{ color: "#1A1A1A" }}
          >
            Your cart is empty
          </p>
          <p className="text-sm mb-5" style={{ color: "#555555" }}>
            Browse our marketplace and add something you love.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "#2B80FF", color: "#fff" }}
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
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Cart items ── */}
          <div className="flex-1 space-y-3">
            {cart.items.map((item) => (
              <div
                // FIX #6: safe key — product may be a plain string ID (not populated)
                key={item.product?._id || item.product}
                className="flex items-center gap-4 rounded-2xl border px-5 py-4 transition-shadow hover:shadow-sm"
                style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
              >
                {/* Product image */}
                <div
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                  style={{ backgroundColor: "#EBF2FF" }}
                >
                  {item.product?.image ? (
                    <img
                      src={thumbUrl(item.product.image)}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: "#2B80FF", opacity: 0.4 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: "#1A1A1A" }}
                  >
                    {item.product?.name}
                  </p>
                  {item.product?.stock && item.product.stock > 0 ? (
                    <>
                      <p
                        className="text-sm font-bold mt-0.5"
                        style={{ color: "#FF8C00" }}
                      >
                        ₦{item.product.price.toLocaleString()}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#555555" }}
                      >
                        Subtotal: ₦
                        {(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p
                      className="text-xs mt-0.5 font-semibold"
                      style={{ color: "#d97706" }}
                    >
                      Out of stock
                    </p>
                  )}
                </div>

                {/* Qty + remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    onChange={(e) => updateQty(item, e.target.value)}
                    disabled={!item.product?.stock || item.product.stock <= 0}
                    style={{
                      width: "64px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1.5px solid #d0e4ff",
                      backgroundColor: "#EBF2FF",
                      color: "#1A1A1A",
                      fontSize: "14px",
                      fontWeight: "600",
                      outline: "none",
                      textAlign: "center",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2B80FF";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(43,128,255,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d0e4ff";
                      e.target.style.boxShadow = "none";
                    }}
                  />

                  <button
                    onClick={() =>
                      removeItem(item.product?._id || item.product)
                    }
                    title="Remove item"
                    className="p-2 rounded-xl transition-all duration-150 active:scale-95"
                    style={{ backgroundColor: "#fff0f0", color: "#FF2E3B" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#ffd6d8")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#fff0f0")
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order summary ── */}
          <div className="lg:w-72 shrink-0">
            <div
              className="rounded-2xl border p-6 sticky top-24"
              style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
            >
              <h2
                className="font-bold text-base mb-4"
                style={{ color: "#1A1A1A" }}
              >
                Order Summary
              </h2>

              {/* FIX #5: only show in-stock items in summary so prices match total */}
              <div className="space-y-2 mb-4">
                {availableItems.map((item) => (
                  <div
                    key={item.product?._id || item.product}
                    className="flex justify-between text-sm"
                  >
                    <span
                      className="truncate max-w-35"
                      style={{ color: "#555555" }}
                    >
                      {item.product.name} ×{item.quantity}
                    </span>
                    <span
                      className="font-medium shrink-0"
                      style={{ color: "#1A1A1A" }}
                    >
                      ₦{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                {availableItems.length === 0 && (
                  <p className="text-xs" style={{ color: "#555555" }}>
                    No available items
                  </p>
                )}
              </div>

              <div
                className="flex justify-between items-center pt-4 border-t"
                style={{ borderColor: "#e5e7eb" }}
              >
                <span
                  className="font-bold text-sm"
                  style={{ color: "#1A1A1A" }}
                >
                  Total
                </span>
                <span
                  className="text-lg font-extrabold"
                  style={{ color: "#FF8C00" }}
                >
                  ₦{total.toLocaleString()}
                </span>
              </div>

              <Link
                to="/checkout"
                className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                style={{ backgroundColor: "#2B80FF", color: "#fff" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1a6de0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#2B80FF")
                }
              >
                Proceed to Checkout
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <Link
                to="/"
                className="mt-2 flex items-center justify-center gap-1 w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{ backgroundColor: "#f3f4f6", color: "#222222" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e5e7eb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
