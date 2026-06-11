import api from "./api";

// Create order
export const createOrder = (data) => api.post("/orders", data);

// Get logged-in user orders
export const getMyOrders = () => api.get("/orders/my-orders");

// Get single order
export const getOrderById = (id) => api.get(`/orders/${id}`);
