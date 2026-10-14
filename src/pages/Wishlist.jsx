import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { getWishlist } from "../services/storefrontService";
import { setPageTitle } from "../utils/pageTitle";

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle("Wishlist");
    getWishlist()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container p-6">
      <h1 className="text-2xl font-bold mb-2">Your wishlist</h1>
      <p className="text-sm text-secondary mb-6">Products you saved for later.</p>
      {loading ? (
        <p className="text-secondary">Loading…</p>
      ) : products.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-secondary mb-4">Nothing saved yet. Tap the heart on any product to keep it here.</p>
          <Link to="/" className="primary-btn inline-block">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
