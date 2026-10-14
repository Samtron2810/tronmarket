import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "./ProductCard";
import {
  getProductReviews,
  getMyProductReview,
  saveProductReview,
  deleteProductReview,
  getRelatedProducts,
} from "../services/storefrontService";

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={star <= value ? "text-amber-500" : "text-gray-300"}
        >
          <FaStar />
        </button>
      ))}
    </div>
  );
}

export default function ProductExtras({ productId }) {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [related, setRelated] = useState([]);
  const [form, setForm] = useState({ rating: 5, title: "", body: "" });
  const [myReviewId, setMyReviewId] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadReviews = async () => {
    try {
      const res = await getProductReviews(productId);
      setReviews(res.data.reviews || []);
      setSummary(res.data.summary || { average: 0, count: 0 });
    } catch {
      // reviews are additive; stay silent
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReviews();
    getRelatedProducts(productId).then((res) => setRelated(res.data || [])).catch(() => {});
    if (user) {
      getMyProductReview(productId)
        .then((res) => {
          if (res.data) {
            setForm({ rating: res.data.rating, title: res.data.title || "", body: res.data.body || "" });
            setMyReviewId(res.data._id);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await saveProductReview(productId, form);
      setMyReviewId(res.data._id);
      toast.success("Thanks — your review was saved.");
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your review");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!myReviewId) return;
    try {
      await deleteProductReview(productId, myReviewId);
      setMyReviewId(null);
      setForm({ rating: 5, title: "", body: "" });
      toast.success("Review removed.");
      loadReviews();
    } catch {
      toast.error("Could not remove your review");
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-gray-900">Reviews & ratings</h2>
          <div className="flex items-center gap-2 text-sm">
            <Stars value={Math.round(summary.average)} />
            <span className="font-bold">{summary.average || "—"}</span>
            <span className="text-gray-500">({summary.count} review{summary.count === 1 ? "" : "s"})</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product.</p>}
          {reviews.map((review) => (
            <article key={review._id} className="border-b border-gray-100 pb-3 last:border-0">
              <div className="flex items-center gap-2">
                <Stars value={review.rating} />
                <span className="text-sm font-bold text-gray-900">{review.title || "Review"}</span>
                {review.verifiedPurchase && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Verified purchase</span>
                )}
              </div>
              {review.body && <p className="mt-1 text-sm text-gray-600">{review.body}</p>}
              <p className="mt-1 text-xs text-gray-400">
                {review.user?.name || "Customer"} · {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>

        {user ? (
          <form onSubmit={submit} className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-bold mb-2">{myReviewId ? "Your review" : "Write a review"}</p>
            <Stars value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
            <input
              className="input-field w-full mt-3"
              placeholder="Headline (optional)"
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="input-field w-full mt-2"
              rows={3}
              maxLength={2000}
              placeholder="What did you think of this product?"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={busy} className="primary-btn disabled:opacity-50">
                {busy ? "Saving..." : myReviewId ? "Update review" : "Post review"}
              </button>
              {myReviewId && (
                <button type="button" onClick={remove} className="secondary-btn">Delete</button>
              )}
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            <Link to="/login" className="font-semibold text-emerald-700 underline">Sign in</Link> to write a review.
          </p>
        )}
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Related products</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {related.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
