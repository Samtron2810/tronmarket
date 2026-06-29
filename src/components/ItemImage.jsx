/**
 * ItemImage — a small order/cart item image with a graceful fallback.
 *
 * FIX #12: Replaces external https://via.placeholder.com/150 with a local
 * FaImage icon so we don't depend on a third-party service.
 *
 * Usage:
 *   <ItemImage src={thumbUrl(item.image)} alt={item.name} />
 */
import { FaImage } from "react-icons/fa";

export default function ItemImage({ src, alt, className = "" }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`object-cover ${className}`}
        loading="lazy"
        // If Cloudinary / remote URL fails, fall through to the icon
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.nextSibling?.style &&
            (e.currentTarget.nextSibling.style.display = "flex");
        }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-[#EBF2FF] ${className}`}
    >
      <FaImage className="w-5 h-5 text-[#2B80FF] opacity-50" />
    </div>
  );
}
