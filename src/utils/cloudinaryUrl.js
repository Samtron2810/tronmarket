/**
 * Client-side Cloudinary URL helpers.
 *
 * Adds automatic format (WebP/AVIF) and quality optimization to reduce
 * image download size by 40-60% without visible quality loss.
 *
 * Usage:
 *   <img src={thumbUrl(product.image)} alt={product.name} />
 */

/**
 * Takes a Cloudinary URL and inserts `f_auto,q_auto,w_{width}` transformations.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function optimizeImageUrl(url, width = 800) {
  if (!url) return url;
  if (!url.includes("cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  // Replace /upload/ with /upload/f_auto,q_auto,w_{width}/
  const optimized = url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width}/`,
  );

  return optimized;
}

/**
 * Thumbnail — for ProductCard grid/list views.
 */
export function thumbUrl(url) {
  return optimizeImageUrl(url, 300);
}

/**
 * Medium — for ProductPreviewModal (popup preview).
 */
export function mediumUrl(url) {
  return optimizeImageUrl(url, 800);
}

/**
 * Large — for ProductDetails (full detail page).
 */
export function largeUrl(url) {
  return optimizeImageUrl(url, 1200);
}
