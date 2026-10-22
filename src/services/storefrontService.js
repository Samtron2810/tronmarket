import api from "./api";

// Reviews
export const getProductReviews = (productId) => api.get(`/products/${productId}/reviews`);
export const getMyProductReview = (productId) => api.get(`/products/${productId}/reviews/mine`);
export const saveProductReview = (productId, data) => api.post(`/products/${productId}/reviews`, data);
export const deleteProductReview = (productId, reviewId) => api.delete(`/products/${productId}/reviews/${reviewId}`);
export const getRelatedProducts = (productId) => api.get(`/products/${productId}/related`);

// Wishlist
export const getWishlist = () => api.get("/wishlist");
export const toggleWishlistItem = (productId) => api.post(`/wishlist/${productId}/toggle`, {});

// Catalog meta
export const getCategories = () => api.get("/categories");
export const getStorefrontMeta = () => api.get("/products/meta");

// Coupons
export const validateCoupon = (data) => api.post("/coupons/validate", data);

// Returns
export const createReturnRequest = (orderId, data) => api.post(`/orders/${orderId}/return`, data);
export const getOrderReturn = (orderId) => api.get(`/orders/${orderId}/return`);
export const getMyReturns = () => api.get("/orders/returns/mine");

// Seller insights
export const getSellerLowStock = (threshold = 5) => api.get("/products/seller/low-stock", { params: { threshold } });
export const getMyPayouts = () => api.get("/payouts/mine");
export const getMySellerBankDetails = () => api.get("/payouts/bank-details");
export const saveSellerBankDetails = (data) => api.put("/payouts/bank-details", data);

// "Not received" reports
export const openDispute = (data) => api.post("/disputes", data);
export const getMyDisputes = () => api.get("/disputes/mine");
export const getAdminDisputes = (status) => api.get("/disputes/admin", { params: status ? { status } : {} });
export const resolveDispute = (id, data) => api.patch(`/disputes/admin/${id}`, data);
export const setSellerBankVerified = (sellerId, verified) => api.patch(`/payouts/${sellerId}/bank-verified`, { verified });

// Admin ops
export const getAdminAnalytics = (days = 30) => api.get("/admin/analytics", { params: { days } });
export const getModerationQueue = (status) => api.get("/admin/moderation", { params: status ? { status } : {} });
export const moderateProduct = (id, data) => api.patch(`/admin/moderation/${id}`, data);
export const getAdminCoupons = () => api.get("/admin/coupons");
export const createAdminCoupon = (data) => api.post("/admin/coupons", data);
export const updateAdminCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);
export const deleteAdminCoupon = (id) => api.delete(`/admin/coupons/${id}`);
export const getAdminReturns = (status) => api.get("/admin/returns", { params: status ? { status } : {} });
export const reviewAdminReturn = (id, data) => api.patch(`/admin/returns/${id}`, data);
export const getAdminRefunds = () => api.get("/admin/refunds");
export const getAdminPayouts = () => api.get("/payouts");
export const markSellerPaid = (sellerId, data) => api.post(`/payouts/${sellerId}/mark-paid`, data);
export const bulkProducts = (data) => api.post("/admin/products/bulk", data);
export const setSellerVerified = (userId, sellerVerified) => api.patch(`/admin/users/${userId}/seller-verified`, { sellerVerified });
export const adminCreateCategory = (data) => api.post("/admin/categories", data);
export const adminUpdateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const adminDeleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// CSV export download (admin)
export async function downloadAdminCsv(kind) {
  const res = await api.get(`/admin/exports/${kind}.csv`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${kind}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Order messages: one thread per (order, seller). Buyers pass the seller they
// are talking to; sellers and admins are resolved on the server.
export const getOrderThread = (orderId, sellerId) =>
  api.get(`/messages/${orderId}`, { params: sellerId ? { sellerId } : {} });
export const sendOrderMessage = (orderId, data) => api.post(`/messages/${orderId}`, data);

// A seller cancels their own package when they cannot fulfil it (out of stock).
export const cancelMyPackage = (orderId, reason) =>
  api.post(`/orders/${orderId}/packages/cancel`, { reason });
