import api from "./api";

export const login = (credentials) => api.post("/auth/login", credentials);
export const register = (data) => api.post("/auth/register", data);
export const verifyOtp = (data) => api.post("/auth/verify-otp", data);
export const resendOtp = (data) => api.post("/auth/resend-otp", data);
