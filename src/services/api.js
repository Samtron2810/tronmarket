import axios from "axios";
import { getToken, setToken, setUser, logout } from "../utils/auth";

export const SESSION_EXPIRED_EVENT = "tronmarket:session-expired";
export const TOKEN_REFRESHED_EVENT = "tronmarket:token-refreshed";

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
  "/auth/refresh",
  "/auth/logout",
];

// Single-flight refresh: a burst of 401s (a page firing several requests
// with an expired access token) shares one /auth/refresh call, and each
// request then retries once with the new token.
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post(
        "/auth/refresh",
        {},
        { headers: { "X-Refresh-Request": "1" }, _skipRefresh: true },
      )
      .then((res) => {
        const token = res.data?.token || res.data?.accessToken;
        if (!token) throw new Error("Refresh response carried no token");
        setToken(token);
        let user = null;
        if (res.data?._id) {
          user = {
            _id: res.data._id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
            isVerified: res.data.isVerified,
          };
          setUser(user);
        }
        window.dispatchEvent(
          new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: { token, user } }),
        );
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function expireSession() {
  logout();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;
    const url = original?.url || "";
    const isCredentialFlow = CREDENTIAL_FLOW.some((path) => url.includes(path));

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original._skipRefresh &&
      !isCredentialFlow
    ) {
      original._retry = true;
      try {
        await refreshAccessToken();
        const token = getToken();
        if (token) {
          original.headers = {
            ...(original.headers || {}),
            Authorization: `Bearer ${token}`,
          };
        }
        return api(original);
      } catch {
        // Refresh session is gone too — the login is really over.
        if (getToken()) expireSession();
      }
    } else if (status === 401 && !isCredentialFlow && getToken()) {
      // A retried/skipped request still failed with a stored token: the
      // session is dead rather than merely expired.
      expireSession();
    }

    return Promise.reject(error);
  },
);

export default api;
