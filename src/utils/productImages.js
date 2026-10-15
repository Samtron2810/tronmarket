import noImageLogo from "../assets/no-image-logo.png";

export const NO_IMAGE_LOGO = noImageLogo;

/**
 * Returns the usable image URLs for a product. Empty strings, nulls and
 * duplicate values are removed. Products with no usable image always get
 * the branded placeholder as their single display image.
 */
export function productImageList(product) {
  const candidates = [
    ...(Array.isArray(product?.images) ? product.images : []),
    product?.image,
  ];
  const usable = [
    ...new Set(
      candidates
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  ];
  return usable.length ? usable : [NO_IMAGE_LOGO];
}

export function firstProductImage(product) {
  return productImageList(product)[0];
}
