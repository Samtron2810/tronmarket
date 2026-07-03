import api from "./api";

// FIX #4: Accept params so filters (search, category, page, limit) are forwarded
export const fetchProducts = (params) => api.get("/products", { params });
export const fetchProduct = (id) => api.get(`/products/${id}`);
