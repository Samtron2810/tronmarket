import api from "./api";

export const fetchProducts = () => api.get("/products");
export const fetchProduct = (id) => api.get(`/products/${id}`);
