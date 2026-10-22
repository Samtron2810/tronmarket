import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All products", to: "/" },
      { label: "My cart", to: "/cart" },
      { label: "My wishlist", to: "/wishlist" },
      { label: "Track my orders", to: "/my-orders" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "About us", to: "/about" },
      { label: "Contact us", to: "/contact" },
      { label: "My orders & returns", to: "/my-orders" },
      { label: "My account", to: "/profile" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Apply as a seller", to: "/apply-seller" },
      { label: "Seller dashboard", to: "/seller" },
      { label: "Seller orders", to: "/seller/orders" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-12 bg-[#101828]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-lg font-extrabold tracking-tight text-white">
              TRON<span className="text-emerald-400">MARKET</span>
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#98A2B3]">
              Quality goods from verified Nigerian sellers — secure Paystack
              payments, delivery to major cities, and easy cancel before shipping.
            </p>
            <a href="mailto:freegram730@gmail.com" className="mt-3 inline-block text-sm font-semibold text-emerald-400 hover:underline">
              freegram730@gmail.com
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#98A2B3]">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-[#EAECF0] transition-colors hover:text-emerald-400">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-[#98A2B3]">
            © {new Date().getFullYear()} TronMarket. All rights reserved.
          </p>
          <p className="text-xs text-[#98A2B3]">Secure payments by Paystack</p>
        </div>
      </div>
    </footer>
  );
}
