import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  FiSmartphone,
  FiMonitor,
  FiShoppingBag,
  FiShoppingCart,
  FiHome,
  FiZap,
} from "react-icons/fi";
import { FaTimes, FaBars } from "react-icons/fa";
import ProductCard from "../components/ProductCard";
import { AuthContext } from "../context/AuthContext";
import Skeleton from "../components/Skeleton";

const categories = ["phones", "laptops", "fashion", "home", "electronics"];

const catIcons = {
  phones: <FiSmartphone className="w-4 h-4" />,
  laptops: <FiMonitor className="w-4 h-4" />,
  fashion: <FiShoppingBag className="w-4 h-4" />,
  home: <FiHome className="w-4 h-4" />,
  electronics: <FiZap className="w-4 h-4" />,
};

export default function Home() {
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [bannerVisible, setBannerVisible] = useState(true);

  // Filter state — managed locally, not via URL params (avoids full re-renders)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const debounceRef = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 500);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 6 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      const res = await api.get("/products", { params });
      setProducts(res.data.products || []);
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Could not retrieve products at this time.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-4 lg:px-4">
      {/* ── Hero ── */}
      <div
        className="relative mb-2 rounded-2xl overflow-hidden px-8 py-1 sm:px-12 sm:py-1"
        style={{ backgroundColor: "#FF8C00" }}
      >
        {/* Subtle decorative circle */}
        <div
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20"
          style={{ backgroundColor: "#FFAA4D" }}
        />
        <div
          className="absolute -bottom-10 right-20 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />

        <div
          className={`relative z-10 max-w-2xl ${bannerVisible ? "" : "hidden"}`}
        >
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{
              backgroundColor: "rgba(255,255,255,0.22)",
              color: "#1A1A1A",
            }}
          >
            Featured Platform
          </span>
          <button
            onClick={() => setBannerVisible(false)}
            aria-label="Close element"
            className=" text-red-600 rounded-full cursor-pointer absolute top-0 right-0 hover:scale-120 transition-all duration-150"
          >
            <FaTimes size={15} />
          </button>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{ color: "#1A1A1A" }}
          >
            Welcome to <span style={{ color: "#0066FF" }}>TronMarket</span>
          </h1>
          <p
            className="mt-4 text-base sm:text-lg leading-relaxed"
            style={{ color: "#3a2a00" }}
          >
            Explore a diverse catalog of high-quality goods curated from
            verified sellers. Enjoy secure authentication and quick shipping.
          </p>

          {/* if user is a seller or admin, show dashboard link */}
          {user?.role === "seller" && (
            <div className="mt-6">
              <Link
                to="/seller"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#1A1A1A", color: "#fff" }}
              >
                Go to Seller Dashboard
              </Link>
            </div>
          )}
          {user?.role === "admin" && (
            <div className="mt-6">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#1A1A1A", color: "#fff" }}
              >
                Go to Admin Dashboard
              </Link>
            </div>
          )}
          {/* if user is a customer, show cart link */}
          {user?.role === "customer" && (
            <div className="mt-6">
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#1A1A1A", color: "#fff" }}
              >
                <FiShoppingCart className="w-4 h-4" />
                <span>View my Cart</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#1A1A1A" }}
        >
          Explore Products
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          {!loading && (
            <span className="text-sm font-medium" style={{ color: "#555555" }}>
              {total} product{total === 1 ? "" : "s"}
            </span>
          )}
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search products…"
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#2B80FF] w-52"
          />
        </div>
      </div>

      {/* ── Layout: sidebar + grid ── */}
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Sidebar */}
        <aside className="w-full sm:w-48 shrink-0">
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#555555" }}
            >
              Categories
            </p>
            <div className="flex flex-wrap gap-1.5 sm:flex-col sm:gap-0 sm:space-y-1.5">
              {/* All */}
              <button
                onClick={() => handleCategoryChange("")}
                className="sm:w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={
                  !category
                    ? { backgroundColor: "#FF8C00", color: "#fff" }
                    : { backgroundColor: "#f3f4f6", color: "#222222" }
                }
                onMouseEnter={(e) => {
                  if (category)
                    e.currentTarget.style.backgroundColor = "#EBF2FF";
                }}
                onMouseLeave={(e) => {
                  if (category)
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
              >
                <FaBars className="w-4 h-4" />
                All
              </button>

              {categories.map((cat) => {
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className="sm:w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-150"
                    style={
                      isActive
                        ? { backgroundColor: "#FF8C00", color: "#fff" }
                        : { backgroundColor: "#f3f4f6", color: "#222222" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.backgroundColor = "#EBF2FF";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                  >
                    {catIcons[cat]}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Products area */}
        <div className="flex-1 min-w-0">
          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              className="rounded-xl border p-6 text-center text-sm font-medium"
              style={{
                backgroundColor: "#fff0f0",
                borderColor: "#FF2E3B",
                color: "#FF2E3B",
              }}
            >
              {error}
            </div>
          )}

          {/* Grid */}
          {!loading && !error && (
            <>
              {products.length === 0 ? (
                <div
                  className="rounded-xl border p-12 text-center"
                  style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
                >
                  <p className="text-base" style={{ color: "#555555" }}>
                    No products available at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {!loading && !error && pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-[#1A1A1A] disabled:opacity-40 hover:bg-[#EBF2FF] transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm font-medium text-[#555555]">
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-[#1A1A1A] disabled:opacity-40 hover:bg-[#EBF2FF] transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
