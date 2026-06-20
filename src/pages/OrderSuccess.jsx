import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiCheckCircle,
  FiPrinter,
  FiDownload,
  FiLoader,
  FiAlertTriangle,
  FiArrowLeft,
} from "react-icons/fi";
import { getOrderById } from "../services/orderService";
import { thumbUrl } from "../utils/cloudinaryUrl";

export default function OrderSuccess() {
  const { state } = useLocation();
  const orderId = state?.orderId;

  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order && !!orderId);
  const [error, setError] = useState(
    !state?.order && !orderId
      ? "No order reference found. If you just placed an order, please check 'My Orders'."
      : null,
  );

  useEffect(() => {
    // If order details are already passed in state, skip fetching
    if (order) return;

    // If orderId is missing, return (error state is already initialized)
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await getOrderById(orderId);
        setOrder(res.data);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(
          err.response?.data?.message || "Failed to load order details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, order]);

  const downloadTxtReceipt = () => {
    if (!order) return;

    const separator = "========================================";
    const dashSeparator = "----------------------------------------";
    const dateFormatted = order.createdAt
      ? new Date(order.createdAt).toLocaleString("en-NG", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : "N/A";

    let receiptText = "";
    receiptText += `${separator}\n`;
    receiptText += `           TRONMARKET RECEIPT\n`;
    receiptText += `${separator}\n`;
    receiptText += `Order ID:   ${order._id || "N/A"}\n`;
    receiptText += `Date:       ${dateFormatted}\n`;
    receiptText += `Status:     ${(order.status || "pending").toUpperCase()}\n`;
    receiptText += `Paid:       ${order.isPaid ? "YES" : "NO"}\n`;
    receiptText += `${separator}\n\n`;

    receiptText += `CUSTOMER INFO:\n`;
    receiptText += `Name:       ${order.shippingAddress?.fullName || order.user?.name || "Customer"}\n`;
    receiptText += `Phone:      ${order.shippingAddress?.phone || "N/A"}\n`;
    receiptText += `Address:    ${order.shippingAddress?.address || "N/A"}\n`;
    receiptText += `City/State: ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""}\n`;
    receiptText += `\n${separator}\n`;
    receiptText += `ITEMS SUMMARY:\n`;
    receiptText += `${dashSeparator}\n`;

    order.orderItems?.forEach((item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      const itemTotal = (price * quantity).toLocaleString();
      receiptText += `${item.name || "Unknown Item"}\n`;
      receiptText += `  Qty: ${quantity} x ₦${price.toLocaleString()} = ₦${itemTotal}\n`;
      receiptText += `${dashSeparator}\n`;
    });

    receiptText += `\nTOTAL PRICE: ₦${Number(order.totalPrice || 0).toLocaleString()}\n`;
    receiptText += `${separator}\n`;
    receiptText += `Thank you for shopping with TronMarket!\n`;
    receiptText += `${separator}\n`;

    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `receipt-${order._id ? order._id.slice(-8).toUpperCase() : "ORDER"}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FF8C00] p-4 text-[#1A1A1A]">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
          <div className="flex justify-center text-[#2B80FF]">
            <FiLoader size={48} className="animate-spin" />
          </div>
          <h2 className="text-xl font-bold">Verifying Order Details...</h2>
          <p className="text-sm text-[#555555]">
            Please wait while we load your receipt.
          </p>
        </div>
      </div>
    );
  }

  // Safety check: if order has loaded but does not contain an _id, treat it as an error state
  const isOrderInvalid = order && !order._id;

  if (error || (!order && !loading) || isOrderInvalid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FF8C00] p-4 text-[#1A1A1A]">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-5 shadow-xl">
          <div className="flex justify-center text-red-500">
            <FiAlertTriangle size={48} />
          </div>
          <h2 className="text-xl font-bold">Something Went Wrong</h2>
          <p className="text-sm text-[#555555] leading-relaxed">
            {error ||
              (isOrderInvalid
                ? "Invalid order record details."
                : "Could not retrieve order details.")}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm shadow-sm transition-colors cursor-pointer"
            >
              <FiArrowLeft size={16} /> Go to Shop
            </Link>
            <Link
              to="/my-orders"
              className="inline-block bg-[#1A1A1A] hover:bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FF8C00] py-10 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="max-w-xl w-full space-y-6">
        {/* Banner Card - Success Message (Hidden when printing) */}
        <div className="no-print bg-white rounded-2xl p-6 text-center space-y-2 border border-gray-200 shadow-md">
          <div className="flex justify-center text-green-500">
            <FiCheckCircle size={44} />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Order Placed! 🎉
          </h1>
          <p className="text-sm text-[#555555]">
            Thank you for shopping with TronMarket. Your payment was verified
            successfully.
          </p>
        </div>

        {/* Printable Receipt Area */}
        <div
          id="receipt-print-area"
          className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6"
        >
          {/* Receipt Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-6 border-b border-gray-100">
            <div>
              <span className="text-2xl font-extrabold tracking-tight">
                <span className="logo-tro">TRON</span>
                <span className="logo-nites">MARKET</span>
              </span>
              <p className="text-xs text-gray-400 mt-1">Official E-Receipt</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
                PAID
              </span>
              <p className="text-xs text-gray-500 mt-2 font-mono">
                Order ID: #
                {order._id ? order._id.slice(-8).toUpperCase() : "N/A"}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm py-1 border-b border-gray-100 pb-6">
            <div className="space-y-1.5">
              <h3 className="font-bold text-gray-400 uppercase tracking-wider text-[11px]">
                Order Information
              </h3>
              <p className="text-[#1A1A1A]">
                <span className="font-semibold text-gray-700">Date:</span>{" "}
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "N/A"}
              </p>
              <p className="text-[#1A1A1A]">
                <span className="font-semibold text-gray-700">Payment:</span>{" "}
                <span className="capitalize">
                  {order.paymentMethod || "Paystack"}
                </span>
              </p>
              <p className="text-[#1A1A1A] break-all font-mono text-xs mt-1">
                <span className="font-semibold text-gray-700 font-sans text-sm">
                  Ref:
                </span>{" "}
                {order.paymentReference || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-gray-400 uppercase tracking-wider text-[11px]">
                Shipping Details
              </h3>
              <p className="font-bold text-[#1A1A1A]">
                {order.shippingAddress?.fullName ||
                  order.user?.name ||
                  "Customer"}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {order.shippingAddress?.address}
              </p>
              <p className="text-gray-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state}
              </p>
              {order.shippingAddress?.phone && (
                <p className="text-gray-500 text-xs mt-1 font-mono">
                  📞 {order.shippingAddress.phone}
                </p>
              )}
            </div>
          </div>

          {/* Items Purchased */}
          <div>
            <h3 className="font-bold text-gray-400 uppercase tracking-wider text-[11px] mb-4">
              Items Purchased
            </h3>
            <div className="divide-y divide-gray-100">
              {order.orderItems?.map((item, idx) => {
                const price = item.price || 0;
                const quantity = item.quantity || 0;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          thumbUrl(item.image) ||
                          "https://via.placeholder.com/150"
                        }
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 bg-gray-50 shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#1A1A1A] truncate max-w-50 sm:max-w-70">
                          {item.name || "Unknown Item"}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {quantity} × ₦{price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-sm font-mono text-gray-800 text-right shrink-0">
                      ₦{(price * quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="border-t border-dashed border-gray-200 pt-5 space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-mono">
                ₦{Number(order.totalPrice || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 items-center">
              <span>Shipping Fee</span>
              <span className="text-emerald-700 font-bold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                FREE
              </span>
            </div>
            <div className="border-t border-gray-100 my-2 pt-4 flex justify-between items-center text-[#1A1A1A]">
              <span className="font-bold text-base">Total Amount Paid</span>
              <span className="text-xl font-black text-gray-900 font-mono">
                ₦{Number(order.totalPrice || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="pt-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium italic">
              Thank you for shopping with TronMarket!
            </p>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="no-print flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPrinter className="text-gray-400" size={16} />
              Print / Save PDF
            </button>
            <button
              onClick={downloadTxtReceipt}
              className="w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiDownload className="text-gray-400" size={16} />
              Download TXT Receipt
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/my-orders"
              className="inline-block bg-[#1A1A1A] hover:bg-black text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-md w-full sm:w-auto"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
