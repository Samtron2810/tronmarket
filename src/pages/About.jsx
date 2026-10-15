import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setPageTitle } from "../utils/pageTitle";

export default function About() {
  useEffect(() => { setPageTitle("About"); }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#101828]">About TronMarket</h1>
      <p className="mt-4 leading-relaxed text-[#667085]">
        TronMarket is a Nigerian marketplace connecting buyers with verified independent
        sellers. Every seller is reviewed before their first listing goes live, payments
        are processed securely through Paystack, and orders can be tracked — and cancelled
        free of charge before shipping — from your account.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { title: "Verified sellers", body: "Seller applications and product listings pass moderation before they reach the store." },
          { title: "Secure payments", body: "Card payments are handled by Paystack. Sellers are paid out only after delivery." },
          { title: "Nationwide delivery", body: "Delivery is priced transparently by state at checkout, with free shipping on qualifying orders." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-bold text-[#101828]">{c.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#667085]">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-[#101828] px-6 py-6 text-white">
        <h2 className="text-lg font-bold">Sell on TronMarket</h2>
        <p className="mt-1 text-sm text-[#D0D5DD]">
          Open a seller account, list your products, and get paid after each delivery.
        </p>
        <Link to="/apply-seller" className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500">
          Apply as a seller
        </Link>
      </div>
    </div>
  );
}
