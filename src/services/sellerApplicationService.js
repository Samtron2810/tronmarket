import api from "./api";

// Customer: submit a seller application
export const applyForSeller = (data) => api.post("/seller-applications", data);

// Customer: latest application + its review status
export const getMySellerApplication = () =>
  api.get("/seller-applications/mine");

// Admin: review queue
export const getSellerApplications = (params) =>
  api.get("/admin/seller-applications", { params });

// Admin: approve (promotes the user to seller) or reject
export const reviewSellerApplication = (id, data) =>
  api.patch(`/admin/seller-applications/${id}`, data);
