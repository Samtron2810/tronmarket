import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  FaEye,
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import ProductPreviewModal from "./ProductPreviewModal";
import { CartContext } from "../context/CartContext";
import { thumbUrl } from "../utils/cloudinaryUrl";
import { toast } from "react-toastify";

export default function ProductCard({ product }) {
  const fallbackImage = "https://loremflickr.com/g/320/240/product";

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image || fallbackImage];

  const [index, setIndex] = useState(0);
  const { addToCartLocal } = useContext(CartContext);
  const { setWelcomeModalOpen } = useContext(AuthContext);
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

    // Optimistic: toast immediately, update local cart instantly
    toast.success("Added to cart");
    try {
      await addToCartLocal(product._id, 1, product);
    } catch (err) {
      if (err.response?.status === 401) {
        setWelcomeModalOpen(true);
      }
      // Error toast is handled inside addToCartLocal for non-401 errors
    }
  };

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out w-full max-w-xs mx-auto">
        {/*  Image  */}
        <div className="relative w-full h-24 overflow-hidden bg-blue-50">
          <img
            src={thumbUrl(images[index])}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {product.stock <= 0 && (
            <div className="absolute right-2 top-2 rounded-md bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5">
              Out of stock
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white transition-colors duration-150"
              >
                <FaChevronLeft className="w-2.5 h-2.5 text-gray-800" />
              </button>
              <button
                onClick={next}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white transition-colors duration-150"
              >
                <FaChevronRight className="w-2.5 h-2.5 text-gray-800" />
              </button>

              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full transition-all duration-200 h-1 ${
                      i === index ? "w-3 bg-blue-500" : "w-1 bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/*  Content  */}
        <div className="flex flex-1 flex-col p-2 gap-1">
          {/* Category + Name + Description */}
          <div className="flex-1 min-w-0">
            <h3 className="mt-0.5 text-md font-bold text-gray-900 line-clamp-1 leading-snug">
              {product.name}
            </h3>
            <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">
              {product.category || "General"}
            </span>
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {product.description || "No description available."}
            </p>
          </div>

          {/* Price */}
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
              Price
            </span>
            <span className="text-sm font-extrabold text-orange-500 leading-tight block truncate">
              ₦{Number(product.price).toLocaleString()}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className={`flex items-center justify-center gap-1 flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                product.stock <= 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95"
              }`}
              title={product.stock <= 0 ? "Out of stock" : "Add to cart"}
            >
              <FaShoppingCart className="w-2.5 h-2.5" />
              <span>Cart</span>
            </button>

            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center justify-center gap-1 flex-1 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-150"
            >
              <FaEye className="w-2.5 h-2.5" />
              <span>View</span>
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
