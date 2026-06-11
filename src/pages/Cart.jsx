import { useContext } from "react";
import { updateCartItem, removeCartItem } from "../services/cartService";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";

export default function Cart() {
  const { cart, fetchCart } = useContext(CartContext);

  if (!cart) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3" style={{ color: "#555555" }}>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
          <span className="text-sm font-medium">Loading your cart…</span>
        </div>
      </div>
    );
  }

  const updateQty = async (productId, quantity) => {
    try {
      await updateCartItem(productId, { quantity: Number(quantity) });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (productId) => {
    try {
      await removeCartItem(productId);
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const total = cart.items.reduce((acc, item) => {
    // exclude out-of-stock items from total
    if (!item.product || !item.product.stock || item.product.stock <= 0)
      return acc;
    return acc + (item.product.price || 0) * item.quantity;
  }, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
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

        <svg
          className="w-8 h-8 opacity-40"
          fill="none"
          stroke="#1A1A1A"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 7h13"
          />
        </svg>
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
                key={item.product._id}
                className="flex items-center gap-4 rounded-2xl border px-5 py-4 transition-shadow hover:shadow-sm"
                style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
              >
                {/* Product image */}
                <div
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                  style={{ backgroundColor: "#EBF2FF" }}
                >
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
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
                    {item.product.name}
                  </p>
                  {item.product.stock && item.product.stock > 0 ? (
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
                    onChange={(e) =>
                      updateQty(item.product._id, e.target.value)
                    }
                    disabled={!item.product.stock || item.product.stock <= 0}
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
                    onClick={() => removeItem(item.product._id)}
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

              <div className="space-y-2 mb-4">
                {cart.items.map((item) => (
                  <div
                    key={item.product._id}
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
