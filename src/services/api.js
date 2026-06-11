import axios from "axios";
import { getToken } from "../utils/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Attach bearer token if available
api.interceptors.request.use((config) => {
  try {
    const token = getToken();
    if (token)
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
  } catch (err) {}
  return config;
});

export default api;
