import { useState, useContext } from "react";
import noImageLogo from "../assets/no-image-logo.png";
import {
  FaEye,
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
} from "react-icons/fa";
import ProductPreviewModal from "./ProductPreviewModal";
import { CartContext } from "../context/CartContext";
import { thumbUrl } from "../utils/cloudinaryUrl";
import { toast } from "react-toastify";
import { displayPrice, variantHint } from "../utils/variants";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product, compact = false, mini = false }) {
  // mini: half-size tile for secondary rails (featured / recently viewed /
  // related). Implies compact; the main store grid uses neither flag.
  const dense = compact || mini;
  const fallbackImage = noImageLogo;

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image || fallbackImage];

  const [index, setIndex] = useState(0);
  const { addToCartLocal, isAddingToCart } = useContext(CartContext);
  const [previewOpen, setPreviewOpen] = useState(false);

  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };
  const prev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (product.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }
    // Variant products must be configured first — send the buyer to the
    // selector instead of silently adding an arbitrary combination.
    if (product.hasVariants) {
      setPreviewOpen(true);
      return;
    }

    try {
      // Wait for real API response — toast is handled inside addToCartLocal
      await addToCartLocal(product._id, 1, null, { product, variant: null });
    } catch {
      // Toast is already shown by addToCartLocal
    }
  };

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out w-full mx-auto">
        {/*  Image  */}
        <div className={`relative w-full overflow-hidden bg-emerald-50 ${dense ? "aspect-square" : "aspect-4/3"}`}>
          <img
            src={thumbUrl(images[index])}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute left-2 top-2 z-10">
            <WishlistButton productId={product._id} />
          </div>

          {product.stock <= 0 && (
            <div className="absolute right-2 top-2 rounded-md bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5">
              Out of stock
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              >
                <FaChevronLeft className="w-2.5 h-2.5 text-gray-800" />
              </button>
              <button
                onClick={next}
                aria-label="Next image"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              >
                <FaChevronRight className="w-2.5 h-2.5 text-gray-800" />
              </button>

              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full transition-all duration-200 h-1 ${
                      i === index ? "w-3 bg-emerald-600" : "w-1 bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/*  Content  */}
        <div className={`flex flex-1 flex-col ${mini ? "p-1 gap-0" : dense ? "p-1.5 gap-0.5" : "p-2 lg:p-1.5 gap-1 lg:gap-0.5"}`}>
          {/* Category + Name + Description */}
          <div className="flex-1 min-w-0">
            <h3 className={`mt-0.5 font-bold text-gray-900 line-clamp-1 leading-snug ${mini ? "text-[10px]" : dense ? "text-xs" : "text-md lg:text-sm"}`}>
              {product.name}
            </h3>
            {!mini && (
              <span className="text-emerald-700 text-xs lg:text-[11px] font-bold uppercase tracking-wider">
                {product.category || "General"}
              </span>
            )}
            {!mini && product.seller?.sellerVerified && (
              <span className="ml-1 inline-block rounded-full bg-emerald-600 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white align-middle">
                Verified seller
              </span>
            )}
            {!dense && (
              <p className="mt-0.5 text-xs lg:text-[11px] text-gray-500 line-clamp-2 leading-relaxed truncate">
                {product.description || "No description available."}
              </p>
            )}
            {!dense && product.hasVariants && variantHint(product) && (
              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                {variantHint(product)}
              </span>
            )}
          </div>

          {!mini && Number(product.numReviews) > 0 && (
            <div className="flex items-center gap-1" aria-label={`Rated ${Number(product.rating || 0).toFixed(1)} of 5 from ${product.numReviews} reviews`}>
              <FaStar className="h-3 w-3 text-amber-500" />
              <span className="text-[11px] font-bold text-gray-800">{Number(product.rating || 0).toFixed(1)}</span>
              <span className="text-[11px] text-gray-400">({product.numReviews} review{Number(product.numReviews) === 1 ? "" : "s"})</span>
            </div>
          )}

          {/* Price */}
          <div className="min-w-0">
            {!dense && (
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                Price
              </span>
            )}
            <span className={`font-extrabold text-amber-700 leading-tight block truncate ${mini ? "text-[10px]" : dense ? "text-xs" : "text-sm lg:text-xs"}`}>
              {displayPrice(product).label}
            </span>
            {displayPrice(product).compareLabel && (
              <span className="block text-[11px] font-medium leading-tight text-gray-400">
                {!mini && <s>{displayPrice(product).compareLabel}</s>}{!mini && " "}
                <span className="rounded bg-red-600 px-1 py-px text-[9px] font-bold text-white no-underline">
                  −{displayPrice(product).discountPercent}%
                </span>
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 lg:gap-1">
            <button
              onClick={handleAdd}
              disabled={product.stock <= 0 || isAddingToCart}
              className={`flex items-center justify-center gap-1 flex-1 ${mini ? "py-1" : "py-1.5 lg:py-1.5"} rounded-lg text-xs lg:text-[11px] font-semibold transition-all duration-150 ${
                product.stock <= 0 || isAddingToCart
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
              }`}
              aria-label={product.hasVariants ? "Select options" : "Add to cart"}
              title={
                product.stock <= 0
                  ? "Out of stock"
                  : product.hasVariants
                    ? "Select options"
                    : "Add to cart"
              }
            >
              <FaShoppingCart className="w-2.5 h-2.5" />
              {!mini && <span>{product.hasVariants ? "Options" : "Cart"}</span>}
            </button>

            <button
              onClick={() => setPreviewOpen(true)}
              aria-label="Quick view"
              className={`flex items-center justify-center gap-1 flex-1 ${mini ? "py-1" : "py-1.5 lg:py-1.5"} rounded-lg text-xs lg:text-[11px] font-semibold bg-emerald-700 text-white hover:bg-emerald-800 active:scale-95 transition-all duration-150`}
            >
              <FaEye className="w-2.5 h-2.5" />
              {!mini && <span>View</span>}
            </button>
          </div>
        </div>
      </div>

      {previewOpen && (
        <ProductPreviewModal
          open={previewOpen}
          product={product}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
