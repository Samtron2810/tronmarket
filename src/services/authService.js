import api from "./api";

export const login = (credentials) => api.post("/auth/login", credentials);
export const register = (data) => api.post("/auth/register", data);
export const verifyOtp = (data) => api.post("/auth/verify-otp", data);
export const resendOtp = (data) => api.post("/auth/resend-otp", data);
export const forgotPassword = (data) =>
  api.post("/auth/forgot-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
export const changePassword = (data) =>
  api.post("/auth/change-password", data);
export const getMe = () => api.get("/auth/me");
// Normally the API interceptor refreshes silently on 401; this is exposed
// for explicit session checks. The header marks it as an app-initiated
// refresh (CSRF defence on the cookie-based endpoint).
export const refreshSession = () =>
  api.post("/auth/refresh", {}, { headers: { "X-Refresh-Request": "1" } });

export const logout = () => api.post("/auth/logout");
