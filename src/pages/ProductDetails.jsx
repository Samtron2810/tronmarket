import { useEffect, useState, useContext } from "react";
import { NO_IMAGE_LOGO, productImageList } from "../utils/productImages";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { CartContext } from "../context/CartContext";
import {
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaStar,
  FaShareAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { largeUrl } from "../utils/cloudinaryUrl";
import VariantSelector from "../components/VariantSelector";
import ProductExtras from "../components/ProductExtras";
import WishlistButton from "../components/WishlistButton";
import { rememberViewed } from "../utils/recentlyViewed";
import { setPageTitle } from "../utils/pageTitle";
import {
  displayPrice,
  discounted,
  hasDiscount,
  findVariant,
  isSelectionComplete,
  variantLabel,
} from "../utils/variants";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [selection, setSelection] = useState({});
  const { addToCartLocal, isAddingToCart } = useContext(CartContext);

  const navigate = useNavigate();

  const fallbackImage = NO_IMAGE_LOGO;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
        rememberViewed(res.data);
        setPageTitle(res.data.name);
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        setError("Product details could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // reset quantity when product changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuantity(1);
  }, [id]);

  const handleAddToCart = async () => {
    try {
      // Wait for real API response — toast is handled inside addToCartLocal
      await addToCartLocal(product._id, quantity, selectedVariant?._id ?? null, {
        product,
        variant: selectedVariant,
        variantLabel: selectedVariant ? variantLabel(selectedVariant) : "",
      });
    } catch {
      // Toast is already shown by addToCartLocal
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `Check out ${product.name} on TronMarket`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Product link copied");
      }
    } catch {
      // user dismissed the share sheet
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-24 sm:px-6 lg:px-8 sm:pb-8">
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
            className="mt-4 inline-block text-sm font-semibold underline text-emerald-700"
          >
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const selectedVariant = findVariant(product, selection);
  const selectionDone = isSelectionComplete(product, selection);
  const effectiveStock = product.hasVariants
    ? (selectedVariant?.stock ?? 0)
    : product.stock;
  const inStock = product.hasVariants
    ? selectionDone && effectiveStock > 0
    : product.stock && product.stock > 0;
  const images = productImageList(product);
  const displayImage = selectedVariant?.image || images[imgIndex] || fallbackImage;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        <Link to="/" className="font-semibold text-emerald-700 hover:underline">Home</Link>
        <span aria-hidden="true">/</span>
        {product.category ? (
          <Link to={`/?category=${encodeURIComponent(product.category)}`} className="capitalize hover:underline">{product.category}</Link>
        ) : (
          <span>General</span>
        )}
        <span aria-hidden="true">/</span>
        <span className="max-w-56 truncate font-medium text-gray-800">{product.name}</span>
      </nav>

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6 text-emerald-700 hover:opacity-70 transition-opacity"
      >
        <FaArrowLeft className="w-3 h-3" />
        Back to catalog
      </button>

      {/* ── Card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden lg:grid lg:grid-cols-2">
        {/* ── Image pane ── */}
        <div className="relative flex items-center justify-center h-64 sm:h-80 lg:h-full bg-emerald-50">
          <img
            src={largeUrl(displayImage)}
            alt={product.name}
            className="w-full h-full object-contain p-6"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackImage;
            }}
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
                      i === imgIndex ? "w-3 bg-emerald-600" : "w-1 bg-emerald-200"
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {product.category || "General"}
              </span>
              {product.seller?.sellerVerified && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                  Verified seller
                </span>
              )}
              <WishlistButton productId={product._id} className="border border-gray-200" />
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share this product"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                <FaShareAlt className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug text-gray-900">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-1.5" aria-label={Number(product.numReviews) > 0 ? `Rated ${Number(product.rating || 0).toFixed(1)} of 5` : "No reviews yet"}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar key={star} className={`h-4 w-4 ${star <= Math.round(Number(product.rating || 0)) ? "text-amber-500" : "text-gray-300"}`} />
              ))}
              <span className="text-xs font-semibold text-gray-600">
                {Number(product.numReviews) > 0
                  ? `${Number(product.rating || 0).toFixed(1)} · ${product.numReviews} review${Number(product.numReviews) === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </span>
            </div>

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
              <span className="text-2xl font-black text-amber-700">
                {selectedVariant
                  ? `₦${discounted(selectedVariant.price, product).toLocaleString()}`
                  : displayPrice(product).label}
              </span>
              {hasDiscount(product) && (
                <span className="ml-2 text-base font-medium text-gray-400">
                  <s>
                    {selectedVariant
                      ? `₦${Number(selectedVariant.price).toLocaleString()}`
                      : displayPrice(product).compareLabel}
                  </s>{" "}
                  <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    −{product.discountPercent}% OFF
                  </span>
                </span>
              )}
              {selectedVariant && (
                <span className="ml-2 text-sm font-semibold text-gray-500">
                  {variantLabel(selectedVariant)}
                  {selectedVariant.sku ? ` · SKU ${selectedVariant.sku}` : ""}
                </span>
              )}
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
            {/* Seller card */}
            {product.seller && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-800">Sold by {product.seller.name || "TronMarket seller"}</span>
                  {product.seller.sellerVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      <FaCheckCircle className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                {product.seller._id && (
                  <Link
                    to={`/?seller=${product.seller._id}&sellerName=${encodeURIComponent(product.seller.name || "seller")}`}
                    className="text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    More from this seller →
                  </Link>
                )}
              </div>
            )}

            {/* Delivery & returns info */}
            <details className="group rounded-xl border border-gray-200 bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-gray-800">Delivery, cancellation & returns</summary>
              <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-gray-500">
                <p>Delivery fees are calculated from your delivery state at checkout, and qualifying orders ship free.</p>
                <p>You can cancel free of charge any time before your order ships.</p>
                <p>Changed your mind after delivery? Open a return request from <Link to="/my-orders" className="font-semibold text-emerald-700 hover:underline">My Orders</Link> and our team will review it.</p>
              </div>
            </details>
          </div>

          {product.hasVariants && (
            <div className="mt-5">
              <VariantSelector
                product={product}
                selection={selection}
                onChange={(next) => {
                  setSelection(next);
                  setQuantity(1);
                }}
              />
              {!selectionDone && (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  Select{" "}
                  {(product.options || [])
                    .filter((o) => !selection[o.name])
                    .map((o) => o.name)
                    .join(" and ")}{" "}
                  to add this item to cart
                </p>
              )}
            </div>
          )}

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
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (!Number.isFinite(val) || val < 1) val = 1;
                    if (val > effectiveStock) val = effectiveStock;
                    setQuantity(val);
                  }}
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50 text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </label>

              <span
                className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
                  inStock
                    ? "bg-green-50 text-green-600 border-green-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}
              >
                {product.hasVariants && !selectionDone
                  ? "Select options"
                  : inStock
                    ? `In Stock (${effectiveStock})`
                    : "Out of Stock"}
              </span>
            </div>

            {/* Add to Cart */}
            <button
              disabled={!inStock || isAddingToCart}
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-emerald-700 text-white hover:bg-emerald-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              <FaShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <ProductExtras productId={product._id} />

      {/* Sticky buy bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-gray-500">{product.name}</p>
          <p className="text-base font-extrabold text-amber-700">
            {selectedVariant ? `₦${discounted(selectedVariant.price, product).toLocaleString()}` : displayPrice(product).label}
          </p>
        </div>
        <button
          disabled={!inStock || isAddingToCart}
          onClick={handleAddToCart}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaShoppingCart className="h-4 w-4" /> Add to Cart
        </button>
      </div>
    </div>
  );
}
