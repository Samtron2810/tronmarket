import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./Index.css";
import "react-toastify/dist/ReactToastify.css";

// FIX #9: removed unused BrowserRouter import (App.jsx already wraps in one)
import { ToastContainer } from "react-toastify";
import AuthProvider from "./context/AuthContext";
import CartProvider from "./context/CartContext";
import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <App />
          <ToastContainer position="top-right" />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
