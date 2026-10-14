import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./Index.css";
import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";
import AuthProvider from "./context/AuthContext";
import CartProvider from "./context/CartContext";
import WishlistProvider from "./context/WishlistContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Optional privacy-friendly analytics: injected only when configured.
if (import.meta.env.VITE_ANALYTICS_DOMAIN) {
  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = import.meta.env.VITE_ANALYTICS_DOMAIN;
  script.src = import.meta.env.VITE_ANALYTICS_SRC || "https://plausible.io/js/script.js";
  document.head.appendChild(script);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <App />
            <ToastContainer position="top-right" />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
