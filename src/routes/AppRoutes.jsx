import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Cart from "../pages/Cart";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOtp from "../pages/VerifyOtp";
import ForgotPassword from "../pages/ForgotPassword";
import ApplySeller from "../pages/ApplySeller";
import ProductDetails from "../pages/ProductDetails";
import NotFound from "../pages/NotFound";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Policy from "../pages/Policy";
import GuestRoute from "../components/GuestRoute";
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
import AdminUsers from "../pages/admin/AdminUsers";
import AdminUser from "../pages/admin/AdminUser";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminSellerApplications from "../pages/admin/AdminSellerApplications";
import AdminAuditLogs from "../pages/admin/AdminAuditLogs";
import AdminAnalytics from "../pages/admin/AdminAnalytics";
import AdminModeration from "../pages/admin/AdminModeration";
import AdminCoupons from "../pages/admin/AdminCoupons";
import AdminReturns from "../pages/admin/AdminReturns";
import AdminPayouts from "../pages/admin/AdminPayouts";
import AdminDisputes from "../pages/admin/AdminDisputes";
import AdminReviews from "../pages/admin/AdminReviews";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminOrderLookup from "../pages/admin/AdminOrderLookup";
import AdminDeliveryStates from "../pages/admin/AdminDeliveryStates";
import Wishlist from "../pages/Wishlist";
import Invoice from "../pages/Invoice";
import AdminRoute from "../components/AdminRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cart" element={<Cart />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/apply-seller"
        element={
          <ProtectedRoute>
            <ApplySeller />
          </ProtectedRoute>
        }
      />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <Wishlist />
          </ProtectedRoute>
        }
      />
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
        path="/orders/:id/invoice"
        element={
          <ProtectedRoute>
            <Invoice />
          </ProtectedRoute>
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
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/seller-applications"
        element={
          <AdminRoute>
            <AdminSellerApplications />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <AdminRoute>
            <AdminAnalytics />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/moderation"
        element={
          <AdminRoute>
            <AdminModeration />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <AdminRoute>
            <AdminCoupons />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/returns"
        element={
          <AdminRoute>
            <AdminReturns />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payouts"
        element={
          <AdminRoute>
            <AdminPayouts />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <AdminRoute>
            <AdminReviews />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/disputes"
        element={
          <AdminRoute>
            <AdminDisputes />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminRoute>
            <AdminCategories />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/order-lookup"
        element={
          <AdminRoute>
            <AdminOrderLookup />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/delivery-states"
        element={
          <AdminRoute>
            <AdminDeliveryStates />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <AdminRoute>
            <AdminAuditLogs />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <AdminRoute>
            <AdminUser />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users/:id/orders"
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        }
      />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/policies/:section" element={<Policy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
