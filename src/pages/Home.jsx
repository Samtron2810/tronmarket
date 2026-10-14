import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { fetchProducts as fetchProductsApi } from "../services/productService";
import { getCategories } from "../services/storefrontService";
import { getRecentlyViewed } from "../utils/recentlyViewed";
import { setPageTitle } from "../utils/pageTitle";
import { AuthContext } from "../context/AuthContext";
import Skeleton from "../components/Skeleton";

const fallbackCategories = ["phones", "laptops", "fashion", "home", "electronics"];

const catIcons = {
  phones: <FiSmartphone className="w-4 h-4" />,
  laptops: <FiMonitor className="w-4 h-4" />,
  fashion: <FiShoppingBag className="w-4 h-4" />,
  home: <FiHome className="w-4 h-4" />,
  electronics: <FiZap className="w-4 h-4" />,
};

export default function Home() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [liveStock, setLiveStock] = useState({}); // { productId: stock }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [bannerVisible, setBannerVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState(fallbackCategories);
  const [brand, setBrand] = useState("");
  const [brands, setBrands] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [featured, setFeatured] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => { setPageTitle("Shop"); }, []);

  useEffect(() => {
    getCategories()
      .then((res) => {
        const names = (res.data || []).map((c) => c.name).filter(Boolean);
        if (names.length) setCategories([...new Set([...names, ...fallbackCategories])]);
      })
      .catch(() => {});
    fetchProductsApi({ featured: 1, limit: 8 })
      .then((res) => setFeatured(res.data.products || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get("search") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(urlSearch);
    setDebouncedSearch(urlSearch);
    setPage(1);
  }, [location.search]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

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
    setIsSidebarOpen(false);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 6, sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      if (brand) params.brand = brand;
      if (minPrice !== "") params.min = minPrice;
      if (maxPrice !== "") params.max = maxPrice;
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
  }, [debouncedSearch, category, brand, minPrice, maxPrice, sort, page]);

  // Brand options follow the catalogue being browsed.
  useEffect(() => {
    const names = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (names.length) setBrands((prev) => [...new Set([...prev, ...names])].sort());
  }, [products]);

  const clearFilters = () => {
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  };

  // ── Fetch real-time stock for displayed products ──
  useEffect(() => {
    const fetchLiveStock = async () => {
      if (!products || products.length === 0) {
        setLiveStock({});
        return;
      }

      try {
        const productIds = products.map((p) => p._id);
        const res = await api.post("/products/stock-check", { productIds });
        setLiveStock(res.data.stocks || {});
      } catch (err) {
        console.error("Failed to fetch live stock:", err);
        // Silently fail — product cards will show cached stock as fallback
        setLiveStock({});
      }
    };

    fetchLiveStock();
  }, [products]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  // Shared category list JSX used in both sidebar and drawer
  const renderCategoryList = () => (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => handleCategoryChange("")}
        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
        style={
          !category
            ? { backgroundColor: "#047857", color: "#fff" }
            : { backgroundColor: "#f3f4f6", color: "#101828" }
        }
        onMouseEnter={(e) => {
          if (category) e.currentTarget.style.backgroundColor = "#ECFDF5";
        }}
        onMouseLeave={(e) => {
          if (category) e.currentTarget.style.backgroundColor = "#f3f4f6";
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
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-150"
            style={
              isActive
                ? { backgroundColor: "#047857", color: "#fff" }
                : { backgroundColor: "#f3f4f6", color: "#101828" }
            }
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = "#ECFDF5";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = "#f3f4f6";
            }}
          >
            {catIcons[cat]}
            {cat}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-4 lg:px-4">
      {/* ── Mobile Drawer Overlay ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ top: "56px" }} // sits below navbar
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer panel sliding from left */}
          <div
            className="absolute left-0 top-0 h-full w-64 shadow-2xl p-5 flex flex-col gap-4 overflow-y-auto"
            style={{ backgroundColor: "#fff" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#667085" }}
              >
                Categories
              </p>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Close categories"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {renderCategoryList()}
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div
        className="relative mb-2 rounded-2xl overflow-hidden px-8 py-1 sm:px-12 sm:py-1"
        style={{ backgroundColor: "#101828" }}
      >
        <div
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20"
          style={{ backgroundColor: "#047857" }}
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
              color: "#FFFFFF",
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
            style={{ color: "#FFFFFF" }}
          >
            Welcome to <span style={{ color: "#34D399" }}>TronMarket</span>
          </h1>
          <p
            className="mt-4 text-base sm:text-lg leading-relaxed"
            style={{ color: "#D0D5DD" }}
          >
            Explore a diverse catalog of high-quality goods curated from
            verified sellers. Enjoy secure authentication and quick shipping.
          </p>

          {user?.role === "seller" && (
            <div className="mt-6">
              <Link
                to="/seller"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#047857", color: "#fff" }}
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
                style={{ backgroundColor: "#047857", color: "#fff" }}
              >
                Go to Admin Dashboard
              </Link>
            </div>
          )}
          {user?.role === "customer" && (
            <div className="mt-6">
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#101828", color: "#fff" }}
              >
                <FiShoppingCart className="w-4 h-4" />
                <span>View my Cart</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Section header (sticky) ── */}
      <div className="sticky top-14 z-30 bg-white/0 backdrop-blur-md py-1 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center justify-between gap-1 flex-wrap border-b sm:border-none shadow-sm sm:shadow-none transition-all md:px-4 lg:px-8 rounded-lg">
        <div className="flex items-center gap-3">
          {/* Mobile categories toggle — only visible on small screens */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold shadow-sm transition-all duration-150"
            style={{
              backgroundColor: category ? "#047857" : "#fff",
              borderColor: category ? "#047857" : "#e5e7eb",
              color: category ? "#fff" : "#101828",
            }}
            aria-label="Open categories"
          >
            <FaBars className="w-4 h-4" />
            <span>
              {category
                ? category.charAt(0).toUpperCase() + category.slice(1)
                : "Categories"}
            </span>
          </button>

          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#101828" }}
          >
            Explore Products
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!loading && (
            <span
              className="text-sm font-medium hidden"
              style={{ color: "#667085" }}
            >
              {total} product{total === 1 ? "" : "s"}
            </span>
          )}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-white border border-gray-400 rounded-lg px-2 py-2 text-sm text-[#101828]"
            aria-label="Sort products"
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
            <option value="rating">Highest rated</option>
          </select>
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search products…"
            className="bg-white border border-gray-400 rounded-lg px-3 py-2 text-sm text-[#101828] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#047857] w-80 sm:w-50 lg:w-90 transition-all duration-150"
          />
        </div>
      </div>

      {featured.length > 0 && !debouncedSearch && !category && (
        <section className="mb-6">
          <h2 className="text-xl font-bold tracking-tight mb-3" style={{ color: "#101828" }}>Featured products</h2>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-8">
            {featured.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} mini />)}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold tracking-tight mb-3" style={{ color: "#101828" }}>Recently viewed</h2>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-8">
            {recentlyViewed.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} mini />)}
          </div>
        </section>
      )}

      {/* ── Layout: sidebar + grid ── */}
      <div className="flex flex-col sm:flex-row gap-5">
        {/* ── Desktop Sidebar (hidden on mobile) ── */}
        <aside className="hidden sm:block w-48 shrink-0 self-start sticky top-28 z-20">
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#667085" }}
            >
              Categories
            </p>
            {renderCategoryList()}
          </div>

          <div className="rounded-xl p-4 border mt-4" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#667085" }}>Filters</p>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#667085" }}>Brand</label>
            <select
              value={brand}
              onChange={(e) => { setBrand(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm mb-3"
            >
              <option value="">All brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#667085" }}>Price range (₦)</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} placeholder="Min" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
              <span className="text-gray-400">–</span>
              <input type="number" min="0" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Max" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
            </div>
            {(brand || minPrice || maxPrice || sort !== "newest") && (
              <button onClick={clearFilters} className="mt-3 text-xs font-bold text-emerald-700 hover:underline">Clear filters</button>
            )}
          </div>
        </aside>

        {/* ── Products area ── */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          )}

          {error && !loading && (
            <div
              className="rounded-xl border p-6 text-center text-sm font-medium"
              style={{
                backgroundColor: "#FEF2F2",
                borderColor: "#DC2626",
                color: "#DC2626",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {products.length === 0 ? (
                <div
                  className="rounded-xl border p-12 text-center"
                  style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
                >
                  <p className="text-base" style={{ color: "#667085" }}>
                    No products available at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={{
                        ...p,
                        // Use live stock if available, fallback to cached stock
                        stock:
                          liveStock[p._id] !== undefined
                            ? liveStock[p._id]
                            : p.stock,
                      }}
                    />
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
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-[#101828] disabled:opacity-40 hover:bg-[#ECFDF5] transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm font-medium text-[#667085]">
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-[#101828] disabled:opacity-40 hover:bg-[#ECFDF5] transition-colors"
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
