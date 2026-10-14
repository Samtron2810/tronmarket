const KEY = "tronmarket:recentlyViewed";
const MAX = 12;

export function rememberViewed(product) {
  try {
    if (!product?._id) return;
    const snapshot = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      images: product.images,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      countInStock: product.countInStock,
      hasVariants: product.hasVariants,
    };
    const existing = getRecentlyViewed().filter((p) => p._id !== product._id);
    localStorage.setItem(KEY, JSON.stringify([snapshot, ...existing].slice(0, MAX)));
  } catch {
    // private browsing etc.
  }
}

export function getRecentlyViewed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
