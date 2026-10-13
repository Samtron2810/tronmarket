import api from "./api";

// Get cart
export const getCart = () => api.get("/cart");

// Add to cart
export const addToCart = (data) => api.post("/cart", data);

// Update quantity (variantId identifies the line for variant products)
export const updateCartItem = (productId, data, variantId) =>
  api.put(
    variantId ? `/cart/${productId}/${variantId}` : `/cart/${productId}`,
    data,
  );

// Remove item
export const removeCartItem = (productId, variantId) =>
  api.delete(
    variantId ? `/cart/${productId}/${variantId}` : `/cart/${productId}`,
  );

// Clear cart
export const clearCart = () => api.delete("/cart");

// Validate all cart items against server stock before checkout
export const validateCartStock = () => api.post("/cart/validate");
