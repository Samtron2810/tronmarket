import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { addToCart } from "../services/cartService";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const { fetchCart } = useContext(CartContext);
  const { setWelcomeModalOpen } = useContext(AuthContext);

  const navigate = useNavigate();

  const fallbackImage = "https://loremflickr.com/g/320/240/product";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        setError("Product details could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await addToCart({ productId: product._id, quantity });
      if (typeof fetchCart === "function") fetchCart();
      toast.success("Added to cart");
    } catch (err) {
      if (err.response?.status === 401) {
        setWelcomeModalOpen(true);
      } else {
        toast.error(err.response?.data?.message || "Error adding to cart");
      }
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse h-4 w-20 bg-gray-200 rounded mb-6" />
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden lg:grid lg:grid-cols-2">
          <div className="h-64 sm:h-80 lg:h-full bg-gray-200 animate-pulse" />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded" />
            <div className="border-t border-b border-gray-100 py-3 space-y-2">
              <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
              <div className="h-7 w-28 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-5/6 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="h-8 w-full bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 text-center">
        <div className="rounded-2xl border border-red-400 bg-red-50 p-8">
          <p className="text-base font-bold text-red-500">
            {error || "Product not found."}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-semibold underline text-blue-600"
          >
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stock && product.stock > 0;
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image || fallbackImage];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6 text-blue-600 hover:opacity-70 transition-opacity"
      >
        <FaArrowLeft className="w-3 h-3" />
        Back to catalog
      </button>

      {/* ── Card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden lg:grid lg:grid-cols-2">
        {/* ── Image pane ── */}
        <div className="relative flex items-center justify-center h-64 sm:h-80 lg:h-full bg-blue-50">
          <img
            src={images[imgIndex]}
            alt={product.name}
            className="w-full h-full object-contain p-6"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setImgIndex((i) => (i - 1 + images.length) % images.length)
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md hover:shadow-lg text-gray-700 hover:text-gray-900 transition-all duration-150"
              >
                <FaChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md hover:shadow-lg text-gray-700 hover:text-gray-900 transition-all duration-150"
              >
                <FaChevronRight className="w-3 h-3" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full h-1 transition-all duration-200 ${
                      i === imgIndex ? "w-3 bg-blue-500" : "w-1 bg-blue-200"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Info pane ── */}
        <div className="flex flex-col justify-between p-5 sm:p-6">
          <div className="space-y-4">
            {/* Category */}
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
              {product.category || "General"}
            </span>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug text-gray-900">
              {product.name}
            </h1>

            {/* Brand */}
            {product.brand && (
              <p className="text-xs text-gray-400">
                Brand:{" "}
                <span className="font-semibold text-gray-700">
                  {product.brand}
                </span>
              </p>
            )}

            {/* Price */}
            <div className="border-t border-b border-gray-100 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Price
              </span>
              <span className="text-2xl font-black text-orange-500">
                ₦{Number(product.price).toLocaleString()}
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Description
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 whitespace-pre-line">
                {product.description || "No product description provided."}
              </p>
            </div>
          </div>

          {/* ── Purchase box ── */}
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            {/* Qty + stock */}
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Qty
                </span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-blue-100 bg-blue-50 text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </label>

              <span
                className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
                  inStock
                    ? "bg-green-50 text-green-600 border-green-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}
              >
                {inStock ? `In Stock (${product.stock})` : "Out of Stock"}
              </span>
            </div>

            {/* Add to Cart */}
            <button
              disabled={!inStock}
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              <FaShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
