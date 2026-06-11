import React, { useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaShoppingCart,
  FaTag,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { addToCart } from "../services/cartService";
import { toast } from "react-toastify";

export default function ProductPreviewModal({ open, product, onClose }) {
  const fallback = "https://loremflickr.com/g/640/480/product";
  const images =
    product?.images && product.images.length > 0
      ? product.images
      : [product?.image || fallback];
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1);

  if (!open || !product) return null;

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  const handleAdd = async () => {
    try {
      await addToCart({ productId: product._id, quantity: qty });
      toast.success("Added to cart");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  };
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-2">
      <button
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        className="px-3 py-1 rounded border"
      >
        -
      </button>
      <input
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
        className="w-16 text-center rounded border p-1"
      />
      <button
        onClick={() => setQty((q) => q + 1)}
        className="px-3 py-1 rounded border"
      >
        +
      </button>
    </div>

    <div className="flex-1 flex gap-2">
      <button
        onClick={handleAdd}
        disabled={
          !product.stock ||
          product.stock <= 0 ||
          qty < 1 ||
          qty > (product.stock || 0)
        }
        className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
      >
        Add to cart
      </button>
      <button onClick={onClose} className="px-4 py-2 rounded-xl border">
        Close
      </button>
    </div>
  </div>;

  const inStock = product.stock && product.stock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-white shadow-2xl">
        {/* Top accent */}
        <div className="h-1 w-full bg-orange-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
              {product.category || "General"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 active:scale-95"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row">
          {/* Image pane */}
          <div className="relative sm:w-5/12 w-full bg-blue-50 flex items-center justify-center min-h-56">
            <img
              src={images[index]}
              alt={product.name}
              className="max-w-full max-h-64 object-contain p-4"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-md hover:shadow-lg text-gray-700 hover:text-gray-900 transition-all duration-150"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-md hover:shadow-lg text-gray-700 hover:text-gray-900 transition-all duration-150"
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`rounded-full h-1 transition-all duration-200 ${
                        i === index ? "w-3 bg-blue-500" : "w-1 bg-blue-200"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info pane */}
          <div className="sm:w-7/12 w-full flex flex-col p-5 gap-3">
            {/* Name + price */}
            <div>
              <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Brand:{" "}
                  <span className="font-semibold text-gray-600">
                    {product.brand}
                  </span>
                </p>
              )}
            </div>

            <div className="border-t border-b border-gray-100 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                Price
              </span>
              <span className="text-2xl font-black text-orange-500 leading-none">
                ₦{Number(product.price).toLocaleString()}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-4 whitespace-pre-line flex-1">
              {product.description || "No description provided."}
            </p>

            {/* Stock badge */}
            <span
              className={`self-start text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
                inStock
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              }`}
            >
              {inStock ? `In Stock (${product.stock})` : "Out of Stock"}
            </span>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAdd}
                disabled={!inStock}
                className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                <FaShoppingCart className="w-3 h-3" />
                Add to Cart
              </button>

              <Link
                to={`/product/${product._id}`}
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 active:scale-95 border border-orange-200 transition-all duration-150"
              >
                Full Details
              </Link>

              <button
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition-all duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
