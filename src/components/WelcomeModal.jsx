import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaTimes } from "react-icons/fa";

export default function WelcomeModal({ open, onClose }) {
  if (!open) return null;

  const handleClose = () => {
    localStorage.setItem("welcomeDismissed", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <FaTimes className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <img
            src={logo}
            alt="TronMarket"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Welcome text */}
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
          Welcome to TronMarket!
        </h2>

        <p className="text-sm text-gray-500 mb-6">Proceed to</p>

        {/* Buttons */}
        <div className="space-y-3">
          <Link
            to="/login"
            onClick={handleClose}
            className="block w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95 shadow-sm"
            style={{ backgroundColor: "#2B80FF" }}
          >
            Login
          </Link>

          <Link
            to="/register"
            onClick={handleClose}
            className="block w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
