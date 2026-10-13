import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderInvoice } from "../services/orderService";
import { AuthContext } from "../context/AuthContext";

const naira = (value) =>
  `NGN ${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Invoice() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getOrderInvoice(id);
        if (!cancelled) setPayload(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "This invoice could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16">Loading invoice…</div>;
  }

  if (error || !payload?.order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-white p-8">
          <h1 className="text-xl font-bold text-[#101828]">Invoice unavailable</h1>
          <p className="mt-2 text-sm text-[#667085]">{error}</p>
          <Link to="/my-orders" className="mt-5 inline-block font-semibold text-[#047857]">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const order = payload.order;
  const invoice = order.invoice || {};
  const isSellerStatement = payload.invoiceType === "seller";
  const showCommissionBreakdown = isSellerStatement || user?.role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          body { background: #fff !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to={isSellerStatement ? "/seller/orders" : "/my-orders"} className="font-semibold text-[#047857]">
          ← Back to orders
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-[#047857] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#065F46]"
        >
          Print / Save as PDF
        </button>
      </div>

      <article className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 print:border-0 print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-6">
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-[#101828]">TronMarket</p>
            <p className="mt-1 text-sm text-[#667085]">
              {isSellerStatement ? "Seller payout statement" : "Tax invoice / order receipt"}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-bold text-[#101828]">#{order._id}</p>
            <p className="mt-1 text-[#667085]">
              {order.createdAt ? new Date(order.createdAt).toLocaleString("en-NG") : ""}
            </p>
            <p className="mt-1 capitalize text-[#101828]">Status: {order.status}</p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085]">Customer</h2>
            <p className="mt-2 font-semibold text-[#101828]">{order.user?.name || "Customer"}</p>
            <p className="text-sm text-[#667085]">{order.user?.email || ""}</p>
            {!isSellerStatement && order.shippingAddress && (
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                <br />
                {order.shippingAddress.phone}
              </p>
            )}
          </section>
          <section className="sm:text-right">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085]">Payment</h2>
            <p className="mt-2 text-sm text-[#101828]">{order.isPaid ? "Paid" : "Not paid yet"}</p>
            {order.paidAt && (
              <p className="text-sm text-[#667085]">{new Date(order.paidAt).toLocaleString("en-NG")}</p>
            )}
            {order.paymentReference && (
              <p className="break-all font-mono text-xs text-[#667085]">Ref: {order.paymentReference}</p>
            )}
          </section>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-y border-gray-200 text-left text-xs uppercase tracking-wide text-[#667085]">
                <th className="py-3 pr-4">Item</th>
                <th className="py-3 pr-4 text-center">Qty</th>
                <th className="py-3 pr-4 text-right">Unit price</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(order.orderItems || []).map((item, index) => (
                <tr key={`${item.product || item.name}-${index}`}>
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-[#101828]">{item.name}</span>
                    {item.variantLabel && <span className="block text-xs text-[#667085]">{item.variantLabel}</span>}
                    {item.sku && <span className="block text-xs text-[#667085]">SKU: {item.sku}</span>}
                  </td>
                  <td className="py-3 pr-4 text-center">{item.quantity}</td>
                  <td className="py-3 pr-4 text-right">{naira(item.price)}</td>
                  <td className="py-3 text-right font-semibold">{naira(Number(item.price || 0) * Number(item.quantity || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-6 max-w-sm space-y-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between"><span className="text-[#667085]">Items subtotal</span><span>{naira(invoice.itemsSubtotal)}</span></div>
          {!isSellerStatement && (
            <div className="flex justify-between">
              <span className="text-[#667085]">Delivery{invoice.shippingZone ? ` (${invoice.shippingZone})` : ""}</span>
              <span>{Number(invoice.shippingPrice || 0) === 0 ? "FREE" : naira(invoice.shippingPrice)}</span>
            </div>
          )}
          {showCommissionBreakdown && isSellerStatement && (
            <>
              <div className="flex justify-between"><span className="text-[#667085]">Platform commission ({(Number(invoice.commissionRate || 0) * 100).toFixed(2)}%)</span><span>-{naira(invoice.commissionAmount)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold"><span>Seller payout</span><span>{naira(invoice.payoutAmount)}</span></div>
              <p className="text-right text-xs capitalize text-[#667085]">Payout status: {invoice.payoutStatus || "not-eligible"}</p>
            </>
          )}
          {showCommissionBreakdown && !isSellerStatement && user?.role === "admin" && (
            <>
              <div className="flex justify-between"><span className="text-[#667085]">Platform commission</span><span>{naira(invoice.commissionTotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#667085]">Seller payouts</span><span>{naira(invoice.sellerPayoutTotal)}</span></div>
            </>
          )}
          {!isSellerStatement && (
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold"><span>Total</span><span>{naira(invoice.totalPrice)}</span></div>
          )}
        </div>

        <p className="mt-10 border-t border-gray-100 pt-4 text-xs leading-5 text-[#667085]">
          This document was generated from TronMarket order records. Delivery charges are calculated from the delivery state/zone; seller payouts are the item subtotal less the platform commission shown above.
        </p>
      </article>
    </div>
  );
}
