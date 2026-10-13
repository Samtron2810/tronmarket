import axios from "axios";
import { getToken, logout } from "../utils/auth";

export const SESSION_EXPIRED_EVENT = "tronmarket:session-expired";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Attach bearer token if available
api.interceptors.request.use((config) => {
  try {
    const token = getToken();
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  } catch {
    // storage unavailable — send the request without an auth header
  }
  return config;
});

const CREDENTIAL_FLOW = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/resend-otp",
  "/auth/forgot-password",
  "/auth/reset-password",
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isCredentialFlow = CREDENTIAL_FLOW.some((path) => url.includes(path));

    // A 401 from an authenticated request means the stored session is no
    // longer accepted. Clear it centrally so no page keeps rendering as if
    // the user were logged in with a dead token.
    if (status === 401 && !isCredentialFlow && getToken()) {
      logout();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

export default api;
