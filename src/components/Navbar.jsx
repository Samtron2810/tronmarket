import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaStore,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserShield,
} from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

/* ─── Theme A: Clean Commerce ───────────────────────────────────────
  Header / footer   : #101828  (Ink)
  Primary CTA       : #047857  (Emerald 700)
  Logo "Market"     : #34D399  (Emerald 400)
  Search input      : #FFFFFF on ink, emerald focus ring
  Nav links         : #EAECF0 on ink
  Badge / accent    : #F59E0B  (Amber 500, ink text)
  Destructive       : #DC2626
───────────────────────────────────────────────────────────────────────── */

export default function Navbar() {
  const { cart } = useContext(CartContext);
  const { token, handleLogout, user } = useContext(AuthContext);

  const navigate = useNavigate();

  const count = cart?.items?.length || 0;

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/?search=${encodeURIComponent(search.trim())}`);
    setOpen(false);
  };

  const onLogout = () => {
    handleLogout();
    navigate("/", { replace: true });
    setOpen(false);
  };

  return (
    <header
      ref={ref}
      style={{
        backgroundColor: "#101828",
        boxShadow: scrolled
          ? "0 4px 20px rgba(16,24,40,0.35), 0 1px 4px rgba(0,0,0,0.20)"
          : "0 2px 8px rgba(16,24,40,0.25)",
      }}
      className="sticky top-0 z-50 w-full transition-all duration-300"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "h-14" : "h-16"}`}
        >
          {/* ── Logo ── */}
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center shrink-0 group mr-4"
          >
            <img
              src={logo}
              alt="TronMarket"
              className="h-7 sm:h-8 w-auto mr-2 object-contain"
            />
            <span
              style={{ color: "#FFFFFF" }}
              className="text-lg sm:text-xl font-extrabold tracking-tight transition-opacity group-hover:opacity-80"
            >
              Tron
            </span>
            <span
              style={{ color: "#34D399" }}
              className="text-lg sm:text-xl font-extrabold tracking-tight transition-opacity group-hover:opacity-80"
            >
              Market
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-1.5">
              <div className="relative">
                <span
                  className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none"
                  style={{ color: "#047857" }}
                >
                  <FaSearch className="w-3.5 h-3.5" />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  style={{ backgroundColor: "#FFFFFF", color: "#101828" }}
                  className="w-44 lg:w-60 pl-8 pr-10 py-2 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                  onFocus={(e) =>
                    (e.target.style.boxShadow = "0 0 0 2px #34D399")
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      navigate("/");
                      setOpen(false);
                    }}
                    className="absolute right-9 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-600 hover:bg-white/30"
                    aria-label="Clear search"
                  >
                    <FaTimes className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                style={{ backgroundColor: "#047857" }}
                className="px-3.5 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all duration-150 shadow-sm"
              >
                Search
              </button>
            </form>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{ color: "#EAECF0" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.25)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <FaShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {count > 0 && (
                <span
                  style={{ backgroundColor: "#F59E0B", color: "#101828" }}
                  className="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold rounded-full px-1 shadow"
                >
                  {count}
                </span>
              )}
            </Link>

            {token ? (
              <>
                <Link
                  to="/wishlist"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{ color: "#EAECF0" }}
                >
                  <FaHeart className="w-4 h-4" />
                  Wishlist
                </Link>
                {/* Profile */}
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{ color: "#EAECF0" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.25)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <FaUser className="w-4 h-4" />
                  Profile
                </Link>

                {/* Seller */}
                {user?.role === "seller" && (
                  <Link
                    to="/seller"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 shadow-sm"
                    style={{ backgroundColor: "#047857", color: "#ffffff" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#065F46")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#047857")
                    }
                  >
                    <FaStore className="w-3.5 h-3.5" />
                    Seller
                  </Link>
                )}
                {user?.role === "seller" && (
                  <Link
                    to="/seller/orders"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-white/40 rounded-lg text-sm font-medium transition-all duration-150"
                    style={{ color: "#EAECF0" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.5)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    Orders
                  </Link>
                )}

                {/* Admin */}
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 shadow-sm"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#ffffff" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.22)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)")
                    }
                  >
                    <FaUserShield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 shadow-sm"
                  style={{ backgroundColor: "#DC2626", color: "#ffffff" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#B91C1C")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#DC2626")
                  }
                >
                  <FaSignOutAlt className="w-3.5 h-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 shadow-sm"
                style={{ backgroundColor: "#047857", color: "#ffffff" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#065F46")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#047857")
                }
              >
                Login
              </Link>
            )}
          </nav>

          {/* ── Mobile: cart icon + hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: "#EAECF0" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.25)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <FaShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span
                  style={{ backgroundColor: "#F59E0B", color: "#101828" }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full"
                >
                  {count}
                </span>
              )}
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              style={{
                backgroundColor: "rgba(255,255,255,0.30)",
                color: "#FFFFFF",
              }}
              className="p-2 rounded-lg active:scale-95 transition-all duration-150"
            >
              {open ? (
                <FaTimes className="w-5 h-5" />
              ) : (
                <FaBars className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-130 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ backgroundColor: "#101828" }}
      >
        <div className="px-4 pb-5 pt-3 space-y-2.5">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <span
                className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none"
                style={{ color: "#047857" }}
              >
                <FaSearch className="w-3.5 h-3.5" />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                style={{ backgroundColor: "#FFFFFF", color: "#101828" }}
                className="w-full pl-8 pr-10 py-2.5 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    navigate("/");
                    setOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-600 hover:bg-white/30"
                  aria-label="Clear search"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              style={{ backgroundColor: "#047857" }}
              className="px-4 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition"
            >
              Go
            </button>
          </form>

          {token && (
            <Link
              to="/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
              style={{ backgroundColor: "rgba(255,255,255,0.22)", color: "#FFFFFF" }}
            >
              <FaHeart className="w-4 h-4" />
              Wishlist
            </Link>
          )}

          {token && (
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
              style={{
                backgroundColor: "rgba(255,255,255,0.22)",
                color: "#FFFFFF",
              }}
            >
              <FaUser className="w-4 h-4" />
              Profile
            </Link>
          )}

          {token && user?.role === "seller" && (
            <Link
              to="/seller"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition active:scale-95"
              style={{ backgroundColor: "#047857", color: "#ffffff" }}
            >
              <FaStore className="w-4 h-4" />
              Seller Dashboard
            </Link>
          )}

          {token && user?.role === "seller" && (
            <Link
              to="/seller/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
              style={{
                backgroundColor: "rgba(255,255,255,0.22)",
                color: "#FFFFFF",
              }}
            >
              Orders
            </Link>
          )}

          {token && user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition active:scale-95"
              style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#ffffff" }}
            >
              <FaUserShield className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}

          {token ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition active:scale-95"
              style={{ backgroundColor: "#DC2626", color: "#ffffff" }}
            >
              <FaSignOutAlt className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition active:scale-95"
              style={{ backgroundColor: "#047857", color: "#ffffff" }}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
