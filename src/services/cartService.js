import api from "./api";

// Get cart
export const getCart = () => api.get("/cart");

// Add to cart
export const addToCart = (data) => api.post("/cart", data);

// Update quantity
export const updateCartItem = (productId, data) =>
  api.put(`/cart/${productId}`, data);

// Remove item
export const removeCartItem = (productId) => api.delete(`/cart/${productId}`);

// Clear cart
export const clearCart = () => api.delete("/cart");
