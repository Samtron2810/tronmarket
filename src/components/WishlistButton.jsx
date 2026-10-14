import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { WishlistContext } from "../context/WishlistContext";

export default function WishlistButton({ productId, className = "" }) {
  const { user } = useContext(AuthContext);
  const { isSaved, toggle } = useContext(WishlistContext);
  const navigate = useNavigate();
  const saved = isSaved(productId);

  const handleClick = async (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    try {
      const nowSaved = await toggle(productId);
      toast.success(nowSaved ? "Saved to your wishlist" : "Removed from your wishlist");
    } catch {
      toast.error("Could not update your wishlist");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      title={saved ? "Saved" : "Save for later"}
      className={`p-1.5 rounded-full bg-white/90 shadow-sm transition hover:scale-110 ${saved ? "text-red-500" : "text-gray-500"} ${className}`}
    >
      {saved ? <FaHeart className="w-3.5 h-3.5" /> : <FaRegHeart className="w-3.5 h-3.5" />}
    </button>
  );
}
