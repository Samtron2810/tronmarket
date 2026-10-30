import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AdminShell } from "./AdminOpsShared";
import ConfirmModal from "../../components/ConfirmModal";
import { getAdminReviews, setAdminReviewHidden, deleteAdminReview } from "../../services/storefrontService";

const TABS = [
  { id: "all", label: "All" },
  { id: "visible", label: "Visible" },
  { id: "hidden", label: "Hidden" },
];

function Stars({ value }) {
  return (
    <span aria-label={`${value} of 5 stars`} className="font-bold text-amber-500">
      {"★".repeat(value)}
      <span className="text-gray-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function AdminReviews() {
  const [tab, setTab] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  // Results are tagged with the tab they belong to, so a stale response never shows.
  const [result, setResult] = useState({ tab: null, items: [] });
  const [reasons, setReasons] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const loading = result.tab !== tab;
  const reviews = result.items;

  useEffect(() => {
    let cancelled = false;
    getAdminReviews(tab)
      .then((res) => {
        if (!cancelled) setResult({ tab, items: res.data?.reviews || [] });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ tab, items: [] });
          toast.error("Could not load reviews");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, refreshKey]);

  const toggleHidden = async (review) => {
    const hidden = !review.isHidden;
    const reason = (reasons[review._id] || "").trim();
    if (hidden && reason.length < 3) {
      toast.error("Add a reason (at least 3 characters) before hiding a review");
      return;
    }
    setBusyId(review._id);
    try {
      await setAdminReviewHidden(review._id, { hidden, reason });
      toast.success(hidden ? "Review hidden from the storefront" : "Review is visible again");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the review");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const review = toDelete;
    setToDelete(null);
    if (!review) return;
    setBusyId(review._id);
    try {
      await deleteAdminReview(review._id);
      toast.success("Review deleted");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the review");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell title="Product reviews" subtitle="Hide reviews that break the rules, show them again, or delete them. Hidden reviews are removed from the rating.">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === t.id ? "bg-emerald-600 text-white" : "border border-gray-300 bg-white text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && reviews.length === 0 && <p className="text-sm text-gray-500">No reviews here.</p>}

      <div className="space-y-3">
        {!loading &&
          reviews.map((review) => (
            <article key={review._id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={review.rating} />
                <span className="text-sm font-bold text-gray-900">{review.title || "Untitled review"}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${
                    review.isHidden
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {review.isHidden ? "Hidden" : "Visible"}
                </span>
                {review.verifiedPurchase && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold uppercase text-gray-600">Verified purchase</span>
                )}
              </div>

              {review.body && <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{review.body}</p>}

              <p className="mt-2 text-xs text-gray-500">
                On <span className="font-semibold text-gray-700">{review.product?.name || "Deleted product"}</span> by{" "}
                <span className="font-semibold text-gray-700">{review.user?.name || "Deleted user"}</span>
                {review.user?.email ? ` (${review.user.email})` : ""} · {new Date(review.createdAt).toLocaleDateString()}
              </p>
              {review.isHidden && review.moderationReason && (
                <p className="mt-1 text-xs text-rose-700">Hidden because: {review.moderationReason}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {review.isHidden ? (
                  <button
                    type="button"
                    disabled={busyId === review._id}
                    onClick={() => toggleHidden(review)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-emerald-400 disabled:opacity-50"
                  >
                    Show again
                  </button>
                ) : (
                  <>
                    <input
                      className="input-field min-w-[220px] flex-1"
                      placeholder="Reason, shown in the admin log (required)"
                      maxLength={300}
                      value={reasons[review._id] || ""}
                      onChange={(e) => setReasons({ ...reasons, [review._id]: e.target.value })}
                    />
                    <button
                      type="button"
                      disabled={busyId === review._id}
                      onClick={() => toggleHidden(review)}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50"
                    >
                      Hide review
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={busyId === review._id}
                  onClick={() => setToDelete(review)}
                  className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
      </div>

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete this review?"
        description="The review is removed permanently and the product rating is recalculated. This cannot be undone."
        confirmLabel="Delete review"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </AdminShell>
  );
}
