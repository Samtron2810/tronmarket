import api from "./api";

// States buyers may currently deliver to (admin-activated only).
export const getActiveDeliveryStates = () => api.get("/delivery-states");

// Admin: all 36 states + FCT with their Active/Inactive toggles.
export const getAllDeliveryStates = () => api.get("/delivery-states/all");
export const setDeliveryStateActive = (name, isActive) =>
  api.put(`/delivery-states/${encodeURIComponent(name)}`, { isActive });
