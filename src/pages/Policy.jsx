import { Link, useParams } from "react-router-dom";

// Policy text describes the windows the platform actually enforces. The day
// counts are the platform defaults (see the order policy on the server); if
// the operator changes them, these pages must change with them.
const SUPPORT_EMAIL = "freegram730@gmail.com";
const UPDATED = "22 October 2026";

const SECTIONS = {
  terms: {
    title: "Terms of service",
    intro: "These terms govern your use of TronMarket, a marketplace connecting buyers with independent sellers in Nigeria.",
    body: [
      {
        heading: "1. The marketplace",
        text: "TronMarket lets independent sellers list goods and lets buyers pay for them through Paystack. Each seller is responsible for their own products, prices, stock and fulfilment. TronMarket collects payment on behalf of sellers and pays them out under the payout policy.",
      },
      {
        heading: "2. Accounts",
        text: "You must give accurate details and keep your login secure. You are responsible for activity on your account. Sellers must complete verification and provide bank details that match the account holder before any payout is made.",
      },
      {
        heading: "3. Orders and payment",
        text: "An order is confirmed when payment is verified. Prices are shown in Naira and include the amounts listed at checkout. A single checkout can contain items from several sellers; each seller ships and is paid for their own items.",
      },
      {
        heading: "4. Cancellations and refunds",
        text: "Before an item ships you can cancel it. If a seller cannot fulfil an item (for example, because it is out of stock) they can cancel their part of the order, and you will be refunded for those items. Refunds go back to the original payment method through Paystack; how quickly they appear depends on your bank. See the return policy for returns after delivery.",
      },
      {
        heading: "5. Conduct",
        text: "Do not list prohibited or counterfeit goods, do not attempt to pay outside the platform to avoid fees, and do not abuse the report or return processes. We may remove listings and suspend accounts that break these rules.",
      },
      {
        heading: "6. Liability",
        text: "TronMarket is not the seller of the goods, but we will help resolve problems through the report and return process. To the extent permitted by law, our liability is limited to the amount you paid for the affected order.",
      },
      {
        heading: "7. Governing law and contact",
        text: `These terms are governed by the laws of the Federal Republic of Nigeria. Questions about these terms: ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  returns: {
    title: "Buyer protection and returns",
    intro: "What TronMarket covers when an order goes wrong, and how to ask for a return or refund.",
    body: [
      {
        heading: "What you are protected by",
        text: "Your payment is verified with Paystack before an order is confirmed. If a seller has not shipped within 7 days of payment, the order is cancelled and refunded in full, shipping included. If a seller cannot supply an item, they can cancel it, and you are refunded for that item. If a payment does not match your order, it is refunded.",
      },
      {
        heading: "Returns: 7 days from delivery",
        text: "You can request a return within 7 days of delivery. Choose the items you want to return (you can return some items from an order, not only the whole order) and give a reason. A return is reviewed by TronMarket before any refund is made.",
      },
      {
        heading: "What gets refunded",
        text: "A return refunds the price of the returned items, after any discount the order received. Delivery is not refunded on a return.",
      },
      {
        heading: "Package not received: 7 days from delivery",
        text: "If a package has not arrived, report it while it is with the courier or within 7 days of the seller marking it delivered. A report pauses the seller's payout for that package while we look into it. If the report is upheld, the price of that package's items is refunded to you. If it is not upheld, the seller is paid as normal.",
      },
      {
        heading: "How refunds are paid",
        text: "Approved refunds go back to your original payment method through Paystack. We cannot control how fast your bank posts a refund; partial refunds are shown on your order.",
      },
      {
        heading: "Questions",
        text: `Email ${SUPPORT_EMAIL} with your order number.`,
      },
    ],
  },
  payouts: {
    title: "Payout and release policy",
    intro: "When sellers are paid, what holds a payout, and how refunds affect it. For sellers.",
    body: [
      {
        heading: "What a seller is paid",
        text: "For each package, a seller is paid the item value minus the platform commission shown on their dashboard. Delivery charges are not part of the seller payout. Commission and payout are calculated on what is still the seller's after any refund.",
      },
      {
        heading: "When money is released: 7 days after delivery",
        text: "A package becomes payable 7 days after it is marked delivered, once the report window has closed. Undelivered orders are not paid out.",
      },
      {
        heading: "What holds a payout",
        text: "A payout for a package is held while any of these is open: a buyer report about that package, a return that includes that package, or a refund that is still processing. A held package is paid only after it is cleared, and an upheld report or a processed refund is never paid.",
      },
      {
        heading: "Refunds after a payout",
        text: "If a refund is needed for a package that has already been paid out, TronMarket handles it manually.",
      },
      {
        heading: "Bank details",
        text: "Payouts go to a bank account in the seller's name. Changing bank details removes verification, and payouts resume only after TronMarket verifies the new account.",
      },
      {
        heading: "Questions",
        text: `Email ${SUPPORT_EMAIL} or use the seller dashboard.`,
      },
    ],
  },
};

export default function Policy() {
  const { section } = useParams();
  const page = SECTIONS[section];

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#101828]">Policy not found</h1>
        <Link to="/" className="mt-4 inline-block text-emerald-700 font-semibold">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        {Object.entries(SECTIONS).map(([id, item]) => (
          <Link
            key={id}
            to={`/policies/${id}`}
            className={`rounded-full px-3 py-1.5 font-semibold ${
              id === section ? "bg-[#101828] text-white" : "border border-gray-200 bg-white text-[#344054]"
            }`}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <h1 className="text-3xl font-extrabold tracking-tight text-[#101828]">{page.title}</h1>
      <p className="mt-2 text-sm text-[#667085]">{page.intro}</p>
      <p className="mt-1 text-xs text-[#98A2B3]">Last updated {UPDATED}.</p>

      <div className="mt-8 space-y-6">
        {page.body.map((block) => (
          <section key={block.heading}>
            <h2 className="text-base font-bold text-[#101828]">{block.heading}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#344054]">{block.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
