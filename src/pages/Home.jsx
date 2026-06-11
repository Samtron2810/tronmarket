import { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { AuthContext } from "../context/AuthContext";
import Skeleton from "../components/Skeleton";

const categories = ["phones", "laptops", "fashion", "home", "electronics"];

const catIcons = {
  phones: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  laptops: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  fashion: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7l10 10M7 17L17 7"
      />
    </svg>
  ),
  home: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
      />
    </svg>
  ),
  electronics: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
};

export default function Home() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const search = query.get("search") || "";
  const category = query.get("category") || "";
  const min = query.get("min") || "";
  const max = query.get("max") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = { page, limit: 6 };
        if (search) params.search = search;
        if (category) params.category = category;
        if (min) params.min = min;
        if (max) params.max = max;

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
    };
    fetchProducts();
  }, [search, category, min, max, page]);

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Hero ── */}
      <div
        className="relative mb-10 rounded-2xl overflow-hidden px-8 py-12 sm:px-12 sm:py-16"
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

        <div className="relative z-10 max-w-2xl">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{
              backgroundColor: "rgba(255,255,255,0.22)",
              color: "#1A1A1A",
            }}
          >
            Featured Platform
          </span>
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
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#1A1A1A" }}
        >
          Explore Products
        </h2>
        {!loading && (
          <span className="text-sm font-medium" style={{ color: "#555555" }}>
            {products.length} item{products.length === 1 ? "" : "s"} &bull;{" "}
            {total} total
          </span>
        )}
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
            <div className="space-y-1.5">
              {/* All */}
              <button
                onClick={() => navigate("/")}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                All
              </button>

              {categories.map((cat) => {
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() =>
                      navigate(`/?category=${encodeURIComponent(cat)}`)
                    }
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-150"
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
            <div className="flex gap-2 mt-8 justify-center flex-wrap">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className="w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95"
                  style={
                    page === i + 1
                      ? { backgroundColor: "#2B80FF", color: "#fff" }
                      : { backgroundColor: "#f3f4f6", color: "#222222" }
                  }
                  onMouseEnter={(e) => {
                    if (page !== i + 1)
                      e.currentTarget.style.backgroundColor = "#EBF2FF";
                  }}
                  onMouseLeave={(e) => {
                    if (page !== i + 1)
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
