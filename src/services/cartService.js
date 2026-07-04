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

// Validate all cart items against server stock before checkout
export const validateCartStock = () => api.post("/cart/validate");

/*
****************************************************
************COMMENT FOR NOW ************************
// ── NEW: Validate cart before checkout ──
export const validateCartForCheckout = () => api.post("/cart/validate");
// ── NEW: Lock cart items during payment ──
export const lockCartForPayment = () => api.post("/cart/lock");
// ── NEW: Unlock cart (if payment fails) ──
export const unlockCart = () => api.post("/cart/unlock");
*/
