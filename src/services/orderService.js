import api from "./api";

// Create order
export const createOrder = (data) => api.post("/orders", data);

// Get logged-in user orders (paginated)
export const getMyOrders = (params) => api.get("/orders/my-orders", { params });

// Get single order
export const getOrderById = (id) => api.get(`/orders/${id}`);

// Customer: cancel their own order
export const cancelMyOrder = (orderId) => api.put(`/orders/${orderId}/cancel`);

// Customer: confirm they received the order (optionally only one
// seller's package within a multi-seller order)
export const confirmDelivery = (orderId, sellerId = null) =>
  api.put(`/orders/${orderId}/deliver`, sellerId ? { sellerId } : {});

// Seller: update order status (e.g. paid → shipped)
export const updateOrderStatus = (orderId, status, note) =>
  api.put(`/orders/${orderId}/status`, { status, note });

// Seller: claim delivery when buyer doesn't confirm
export const sellerDeliveryClaim = (orderId) =>
  api.put(`/orders/${orderId}/seller-delivery-claim`, {});

// Admin: manually complete an order
export const completeOrder = (orderId) =>
  api.put(`/orders/${orderId}/complete`, {});

// Seller: get orders containing their products (paginated; each order
// is filtered server-side to only that seller's items/subtotal)
export const getSellerOrders = (params) =>
  api.get("/orders/seller/orders", { params });
