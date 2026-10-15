import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setPageTitle } from "../utils/pageTitle";

export default function Contact() {
  useEffect(() => { setPageTitle("Contact"); }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#101828]">Contact us</h1>
      <p className="mt-4 leading-relaxed text-[#667085]">
        Questions about an order, a payment, or selling on TronMarket? Reach out and the
        team will get back to you.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold text-[#101828]">Email</h2>
          <p className="mt-1 text-sm text-[#667085]">For order and account support:</p>
          <a href="mailto:freegram730@gmail.com" className="mt-2 inline-block font-semibold text-emerald-700 hover:underline">
            freegram730@gmail.com
          </a>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold text-[#101828]">Order help</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#667085]">
            Most order questions — tracking, cancellation, returns — can be handled instantly from your account.
          </p>
          <Link to="/my-orders" className="mt-2 inline-block font-semibold text-emerald-700 hover:underline">
            Go to My Orders →
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-[#101828]">Selling on TronMarket</h2>
        <p className="mt-1 text-sm text-[#667085]">
          New seller? Apply in a few minutes — applications are reviewed by our team.
        </p>
        <Link to="/apply-seller" className="mt-2 inline-block font-semibold text-emerald-700 hover:underline">
          Apply as a seller →
        </Link>
      </div>
    </div>
  );
}
