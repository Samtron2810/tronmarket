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

// ── Account management ────────────────────────────────────────────────────
export const getProfile = () => api.get("/auth/profile");
export const verifyPassword = (data) => api.post("/auth/verify-password", data);
export const updateProfile = (data) => api.put("/auth/profile", data);
export const addAddress = (data) => api.post("/auth/addresses", data);
export const updateAddress = (id, data) => api.put(`/auth/addresses/${id}`, data);
export const deleteAddress = (id) => api.delete(`/auth/addresses/${id}`);
export const requestEmailChange = (data) => api.post("/auth/email-change/request", data);
export const verifyEmailChange = (data) => api.post("/auth/email-change/verify", data);
export const deleteMyAccount = (data) => api.delete("/auth/me", { data });
export const twoFactorSetup = () => api.post("/auth/2fa/setup", {});
export const twoFactorVerify = (data) => api.post("/auth/2fa/verify", data);
export const twoFactorDisable = (data) => api.post("/auth/2fa/disable", data);
export const twoFactorLogin = (data) => api.post("/auth/2fa/login", data);
export const googleLogin = (data) => api.post("/auth/google", data);
