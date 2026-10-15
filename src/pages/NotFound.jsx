import { useState } from "react";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/?search=${encodeURIComponent(q.trim())}` : "/");
  };

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-6xl font-black tracking-tight text-emerald-700">404</p>
      <h1 className="mt-3 text-2xl font-bold text-[#101828]">Page not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#667085]">
        The page you're looking for doesn't exist or may have moved. Try searching the store instead.
      </p>

      <form onSubmit={submit} className="mt-6 flex w-full max-w-md gap-2" role="search">
        <div className="relative flex-1">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-[#101828] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button type="submit" className="primary-btn">Search</button>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-[#101828] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
          <FaArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
        <Link to="/cart" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#101828] transition hover:border-emerald-300">
          My Cart
        </Link>
        <Link to="/my-orders" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#101828] transition hover:border-emerald-300">
          My Orders
        </Link>
      </div>
    </main>
  );
}
