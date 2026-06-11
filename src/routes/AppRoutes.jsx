import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Cart from "../pages/Cart";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProductDetails from "../pages/ProductDetails";
import NotFound from "../pages/NotFound";
import Checkout from "../pages/Checkout";
import OrderSuccess from "../pages/OrderSuccess";
import ProtectedRoute from "../components/ProtectedRoute";
import Profile from "../pages/Profile";
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerRoute from "../components/SellerRoute";
import AddProduct from "../pages/seller/AddProduct";
import EditProduct from "../pages/seller/EditProduct";
import MyOrders from "../pages/MyOrders";
import SellerOrders from "../pages/seller/SellerOrders";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminRoute from "../components/AdminRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller"
        element={
          <SellerRoute>
            <SellerDashboard />
          </SellerRoute>
        }
      />

      <Route
        path="/seller/add"
        element={
          <SellerRoute>
            <AddProduct />
          </SellerRoute>
        }
      />

      <Route
        path="/seller/edit/:id"
        element={
          <SellerRoute>
            <EditProduct />
          </SellerRoute>
        }
      />

      <Route
        path="/my-orders"
        element={
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/orders"
        element={
          <SellerRoute>
            <SellerOrders />
          </SellerRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
