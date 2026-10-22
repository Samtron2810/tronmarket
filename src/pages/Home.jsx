import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FiSmartphone,
  FiMonitor,
  FiShoppingBag,
  FiHome,
  FiZap,
  FiTag,
  FiSearch,
  FiSliders,
} from "react-icons/fi";
import { FaTimes, FaBars } from "react-icons/fa";
import ProductCard from "../components/ProductCard";
import { fetchProducts as fetchProductsApi } from "../services/productService";
import { getCategories, getStorefrontMeta } from "../services/storefrontService";
import { getRecentlyViewed, clearRecentlyViewed } from "../utils/recentlyViewed";
import { setPageTitle } from "../utils/pageTitle";
import Skeleton from "../components/Skeleton";

const catIcons = {
  phones: <FiSmartphone className="w-4 h-4" />,
  laptops: <FiMonitor className="w-4 h-4" />,
  fashion: <FiShoppingBag className="w-4 h-4" />,
  home: <FiHome className="w-4 h-4" />,
  electronics: <FiZap className="w-4 h-4" />,
};
const iconFor = (name) => catIcons[String(name || "").toLowerCase()] || <FiTag className="w-4 h-4" />;

// Categories come from two places: the admin-managed Category collection and
// the category values actually used by live products. The managed spelling
// wins when both exist; product-only categories ensure the list is never
// empty just because the managed collection has not been populated yet.
function mergeCategoryNames(priorityNames = [], otherNames = []) {
  const byLowerCase = new Map();
  [...priorityNames, ...otherNames].forEach((name) => {
    const label = String(name || "").trim();
    const key = label.toLowerCase();
    if (label && !byLowerCase.has(key)) byLowerCase.set(key, label);
  });
  return [...byLowerCase.values()].sort((a, b) => a.localeCompare(b));
}

const PAGE_SIZE = 12;

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [liveStock, setLiveStock] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [heroQuery, setHeroQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [brand, setBrand] = useState("");
  const [brands, setBrands] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("recommended");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sellerId, setSellerId] = useState("");
  const [sellerName, setSellerName] = useState("");

  const [featured, setFeatured] = useState([]);
  const [sponsored, setSponsored] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestRated, setBestRated] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showAllRecent, setShowAllRecent] = useState(false);

  useEffect(() => { setPageTitle("Shop"); }, []);

  useEffect(() => {
    getCategories()
      .then((res) => {
        const names = (res.data || []).map((c) => c.name).filter(Boolean);
        if (names.length) setCategories((prev) => mergeCategoryNames(names, prev));
      })
      .catch(() => {});
    getStorefrontMeta()
      .then((res) => {
        if (res.data?.brands?.length) setBrands(res.data.brands);
        if (res.data?.categories?.length) {
          setCategories((prev) => mergeCategoryNames(prev, res.data.categories));
        }
      })
      .catch(() => {});
    fetchProductsApi({ featured: 1, limit: 8 })
      .then((res) => setFeatured(res.data.products || []))
      .catch(() => {});
    fetchProductsApi({ sponsored: 1, limit: 8 })
      .then((res) => setSponsored(res.data.products || []))
      .catch(() => {});
    fetchProductsApi({ sort: "popular", limit: 8 })
      .then((res) => setBestSellers(res.data.products || []))
      .catch(() => {});
    fetchProductsApi({ sort: "newest", limit: 8 })
      .then((res) => setNewArrivals(res.data.products || []))
      .catch(() => {});
    fetchProductsApi({ sort: "rating", limit: 8 })
      .then((res) => setBestRated(res.data.products || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  // URL is the single source of truth for search / featured / seller views
  // (navbar search, hero search, product-page seller links all land here).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get("search") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDebouncedSearch(urlSearch);
    setHeroQuery(urlSearch);
    setFeaturedOnly(params.get("featured") === "1");
    setCategory(params.get("category") || "");
    setSellerId(params.get("seller") || "");
    setSellerName(params.get("sellerName") || "");
    setPage(1);
  }, [location.search]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isSidebarOpen]);

  const scrollToShop = useCallback(() => {
    requestAnimationFrame(() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const submitHeroSearch = (e) => {
    e.preventDefault();
    const q = heroQuery.trim();
    navigate(q ? `/?search=${encodeURIComponent(q)}` : "/");
    scrollToShop();
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
    setIsSidebarOpen(false);
  };

  const fetchProducts = useCallback(async () => {
    try {
      if (page === 1) setLoading(true); else setLoadingMore(true);
      setError(null);
      const params = { page, limit: PAGE_SIZE, sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      if (brand) params.brand = brand;
      if (minPrice !== "") params.min = minPrice;
      if (maxPrice !== "") params.max = maxPrice;
      if (featuredOnly) params.featured = 1;
      if (sellerId) params.seller = sellerId;
      const res = await api.get("/products", { params });
      const incoming = res.data.products || [];
      setProducts((prev) => (page === 1 ? incoming : [...prev, ...incoming.filter((p) => !prev.some((x) => x._id === p._id))]));
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Could not retrieve products at this time.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, category, brand, minPrice, maxPrice, sort, page, featuredOnly, sellerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  // Final fallback: if the metadata endpoint is unavailable, learn category
  // names from products already rendered on the page.
  useEffect(() => {
    if (!products.length) return;
    const names = [...new Set(products.map((p) => p.category).filter(Boolean))];
    if (names.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories((prev) => mergeCategoryNames(prev, names));
    }
  }, [products]);

  useEffect(() => {
    const fetchLiveStock = async () => {
      if (!products.length) { setLiveStock({}); return; }
      try {
        const res = await api.post("/products/stock-check", { productIds: products.slice(-50).map((p) => p._id) });
        setLiveStock((prev) => ({ ...prev, ...(res.data.stocks || {}) }));
      } catch {
        // cached stock on the cards is the fallback
      }
    };
    fetchLiveStock();
  }, [products]);

  const clearFilters = () => {
    setBrand(""); setMinPrice(""); setMaxPrice(""); setSort("recommended"); setPage(1);
  };

  const shopTitle = sellerId
    ? `Products by ${sellerName || "seller"}`
    : featuredOnly
      ? "Featured products"
      : debouncedSearch
        ? `Results for “${debouncedSearch}”`
        : "Explore Products";

  const renderCategoryList = () => (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => handleCategoryChange("")}
        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!category ? "bg-emerald-700 text-white" : "bg-gray-100 text-ink hover:bg-emerald-50"}`}
      >
        <FaBars className="w-4 h-4" /> All
      </button>
      {categories.map((cat) => {
        const isActive = category === cat;
        return (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${isActive ? "bg-emerald-700 text-white" : "bg-gray-100 text-ink hover:bg-emerald-50"}`}
          >
            {iconFor(cat)} {cat}
          </button>
        );
      })}
    </div>
  );

  const renderFilters = (idPrefix) => (
    <div>
      <label htmlFor={`${idPrefix}-brand`} className="block text-xs font-semibold mb-1 text-muted">Brand</label>
      <select
        id={`${idPrefix}-brand`}
        value={brand}
        onChange={(e) => { setBrand(e.target.value); setPage(1); }}
        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm mb-3 bg-white"
      >
        <option value="">All brands</option>
        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <label className="block text-xs font-semibold mb-1 text-muted">Price range (₦)</label>
      <div className="flex items-center gap-2">
        <input type="number" min="0" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} placeholder="Min" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" aria-label="Minimum price" />
        <span className="text-gray-400">–</span>
        <input type="number" min="0" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Max" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" aria-label="Maximum price" />
      </div>
      {(brand || minPrice || maxPrice || sort !== "recommended") && (
        <button onClick={clearFilters} className="mt-3 text-xs font-bold text-emerald-700 hover:underline">Clear filters</button>
      )}
    </div>
  );

  const sortSelect = (id) => (
    <select
      id={id}
      value={sort}
      onChange={(e) => { setSort(e.target.value); setPage(1); }}
      className="bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm text-ink"
      aria-label="Sort products"
    >
      <option value="recommended">Recommended</option>
      <option value="popular">Most popular</option>
      <option value="newest">Newest first</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
      <option value="name">Name A–Z</option>
      <option value="rating">Highest rated</option>
    </select>
  );

  const rail = (title, items, seeAll) => items.length > 0 && (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
        {seeAll}
      </div>
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-8">
        {items.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} mini />)}
      </div>
    </section>
  );

  const seeAllBtn = (onClick) => (
    <button onClick={onClick} className="shrink-0 text-sm font-semibold text-emerald-700 hover:underline">See all →</button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-4 lg:px-4">
      {/* ── Hero ── */}
      <section className="mb-4 overflow-hidden rounded-2xl bg-emerald-900 text-white shadow-sm">
        <div className="px-5 py-6 sm:px-8 sm:py-7">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Quality products, delivered across Nigeria.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-100 sm:text-base">
              Shop trusted sellers with secure checkout and clear delivery updates.
            </p>
            <form onSubmit={submitHeroSearch} className="mt-5 flex max-w-xl overflow-hidden rounded-full bg-white p-1 shadow-lg">
              <input
                name="q"
                type="search"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Search products, brands and categories"
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button type="submit" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800">
                <FiSearch aria-hidden="true" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Category tiles ── */}
      {categories.length > 0 && (
        <section className="mb-6" aria-label="Shop by category">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { handleCategoryChange(cat); scrollToShop(); }}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${category === cat ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-200 bg-white text-ink hover:border-emerald-300"}`}
              >
                {iconFor(cat)} {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {!debouncedSearch && !category && !sellerId && (
        <>
          {rail("Sponsored", sponsored, null)}
          {rail("Featured products", featured, seeAllBtn(() => { navigate("/?featured=1"); scrollToShop(); }))}
          {rail("Best sellers", bestSellers, seeAllBtn(() => { setSort("popular"); setPage(1); scrollToShop(); }))}

          {/* Promo banner */}
          <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-700 px-5 py-4 text-white">
            <div>
              <p className="font-bold">Have a coupon code?</p>
              <p className="text-sm text-emerald-100">Apply it in your cart or at checkout and watch the price drop.</p>
            </div>
            <Link to="/cart" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 active:scale-95">
              Go to cart
            </Link>
          </section>
        </>
      )}

      {recentlyViewed.length > 0 && !debouncedSearch && !category && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">Recently viewed</h2>
            <div className="flex shrink-0 items-center gap-4">
              {recentlyViewed.length > 8 && (
                <button onClick={() => setShowAllRecent((v) => !v)} className="text-sm font-semibold text-emerald-700 hover:underline">
                  {showAllRecent ? "Show less" : "See all →"}
                </button>
              )}
              <button
                onClick={() => { clearRecentlyViewed(); setRecentlyViewed([]); }}
                className="text-sm font-semibold text-gray-400 hover:text-red-600"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-8">
            {(showAllRecent ? recentlyViewed : recentlyViewed.slice(0, 8)).map((p) => <ProductCard key={p._id} product={p} mini />)}
          </div>
        </section>
      )}

      {!debouncedSearch && !category && !sellerId && (
        <>
          {rail("New arrivals", newArrivals, seeAllBtn(scrollToShop))}
          {rail("Best rated", bestRated, seeAllBtn(() => { setSort("rating"); setPage(1); scrollToShop(); }))}
        </>
      )}

      {/* ── Shop ── */}
      <div id="shop" className="scroll-mt-20">
        <div className="sticky top-14 z-30 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border-b bg-bg/90 py-2 backdrop-blur-md sm:border-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm sm:hidden ${category ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-200 bg-white text-ink"}`}
              aria-label="Open categories and filters"
            >
              <FaBars className="h-4 w-4" />
              <span>{category || "Categories"}</span>
            </button>
            <h2 className="text-2xl font-bold tracking-tight text-ink">{shopTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!loading && <span className="hidden text-sm font-medium text-muted sm:inline">{total} product{total === 1 ? "" : "s"}</span>}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-ink sm:hidden"
              aria-label="Open filters"
            >
              <FiSliders className="h-4 w-4" /> Filters
            </button>
            <span className="hidden sm:block">{sortSelect("sort-desktop")}</span>
          </div>
        </div>

        {(sellerId || featuredOnly) && (
          <div className="mb-4">
            <Link to="/" className="text-sm font-semibold text-emerald-700 hover:underline">← View all products</Link>
          </div>
        )}

        <div className="flex flex-col gap-5 sm:flex-row">
          <aside className="sticky top-28 z-20 hidden w-48 shrink-0 self-start sm:block">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Categories</p>
              {renderCategoryList()}
            </div>
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Filters</p>
              {renderFilters("side")}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {loading && (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} variant="card" />)}
              </div>
            )}

            {error && !loading && (
              <div className="rounded-xl border border-red-600 bg-red-50 p-6 text-center text-sm font-medium text-red-600">{error}</div>
            )}

            {!loading && !error && (
              products.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <p className="text-base text-muted">No products match your filters right now.</p>
                  {(brand || minPrice || maxPrice || category || debouncedSearch) && (
                    <button onClick={() => { clearFilters(); handleCategoryChange(""); }} className="mt-3 text-sm font-bold text-emerald-700 hover:underline">Clear all filters</button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={{ ...p, stock: liveStock[p._id] !== undefined ? liveStock[p._id] : p.stock }}
                    />
                  ))}
                </div>
              )
            )}

            {!loading && !error && page < pages && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:border-emerald-400 disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : `Load more (${products.length} of ${total})`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile drawer: categories + filters ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" style={{ top: "56px" }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col gap-5 overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Categories & filters</p>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 transition-colors hover:text-red-500" aria-label="Close categories and filters">
                <FaTimes size={16} />
              </button>
            </div>
            {renderCategoryList()}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Sort</p>
              {sortSelect("sort-mobile")}
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Filters</p>
              {renderFilters("drawer")}
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="primary-btn mt-auto w-full">Show results</button>
          </div>
        </div>
      )}
    </div>
  );
}
