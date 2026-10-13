import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStore } from "react-icons/fa";
import { FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import {
  applyForSeller,
  getMySellerApplication,
} from "../services/sellerApplicationService";
import MessageModal from "../components/MessageModal";

const statusStyles = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
};

export default function ApplySeller() {
  const { user, refreshUser } = useContext(AuthContext);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    storeName: "",
    businessDescription: "",
    contactPhone: "",
  });
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [res] = await Promise.all([
          getMySellerApplication(),
          refreshUser(),
        ]);
        if (!cancelled) setApplication(res.data.application || null);
      } catch {
        if (!cancelled) setApplication(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // refreshUser is stable enough for this one-time load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const res = await applyForSeller(form);
      setApplication(res.data.application || null);
      setMsg(
        res.data.message ||
          "Application submitted. Our team will review it shortly.",
      );
      setMsgOpen(true);
    } catch (error) {
      const data = error.response?.data;
      if (data?.application) setApplication(data.application);
      setMsg(
        data?.errors?.[0]?.message ||
          data?.message ||
          "Could not submit your application. Please try again.",
      );
      setMsgOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container p-6">
        <div className="mx-auto max-w-2xl card p-8 text-center text-secondary">
          Loading your seller application…
        </div>
      </div>
    );
  }

  if (user?.role === "seller" || application?.status === "approved") {
    return (
      <div className="page-container p-6">
        <div className="mx-auto max-w-2xl card p-8 text-center">
          <FiCheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
          <h1 className="mb-2 text-2xl font-bold">You are a seller</h1>
          <p className="mb-6 text-sm text-secondary">
            Your seller application has been approved. You can now list
            products and manage orders from your seller dashboard.
          </p>
          <Link
            to="/seller"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            <FaStore /> Go to Seller Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="page-container p-6">
        <div className="mx-auto max-w-2xl card p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">Seller applications</h1>
          <p className="mb-6 text-sm text-secondary">
            Admin accounts review seller applications instead of submitting
            them.
          </p>
          <Link
            to="/admin/seller-applications"
            className="inline-flex rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            Open review queue
          </Link>
        </div>
      </div>
    );
  }

  const canApply = !application || application.status === "rejected";

  return (
    <div className="page-container p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <FaStore className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
          <h1 className="text-2xl font-bold">Apply for Seller Role</h1>
          <p className="mt-1 text-sm text-secondary">
            Tell us about your store. An admin will review your application,
            and approval upgrades this account to a seller account.
          </p>
        </div>

        {application && (
          <div
            className={`mb-6 rounded-xl border px-5 py-4 ${statusStyles[application.status]}`}
          >
            <div className="flex items-start gap-3">
              {application.status === "pending" ? (
                <FiClock className="mt-0.5 h-5 w-5 shrink-0" />
              ) : application.status === "rejected" ? (
                <FiXCircle className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="font-bold capitalize">
                  Application {application.status}
                </p>
                <p className="mt-1 text-sm">
                  Store: <strong>{application.storeName}</strong>
                  {application.reviewedAt
                    ? ` • Reviewed ${new Date(application.reviewedAt).toLocaleDateString()}`
                    : " • Submitted " +
                      new Date(application.createdAt).toLocaleDateString()}
                </p>
                {application.status === "pending" && (
                  <p className="mt-1 text-sm">
                    This page will update once an admin has reviewed it.
                  </p>
                )}
                {application.status === "rejected" && (
                  <p className="mt-1 text-sm">
                    {application.reviewNote
                      ? `Reviewer note: ${application.reviewNote}`
                      : "You can update your details and apply again below."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {canApply ? (
          <form onSubmit={handleSubmit} className="card space-y-4 p-6">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Store name
              </span>
              <input
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="e.g. Ada Fashion Store"
                maxLength={100}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                What will you sell?
              </span>
              <textarea
                name="businessDescription"
                value={form.businessDescription}
                onChange={handleChange}
                className="input-field min-h-32 w-full"
                placeholder="Describe your business, the products you plan to list, and where you ship from (at least 20 characters)."
                maxLength={2000}
                required
              />
              <span className="mt-1 block text-right text-xs text-secondary">
                {form.businessDescription.length}/2000
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Contact phone
              </span>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="e.g. 0803 000 0000"
                autoComplete="tel"
                maxLength={30}
                required
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="primary-btn w-full disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : application?.status === "rejected"
                  ? "Submit a new application"
                  : "Submit application"}
            </button>
          </form>
        ) : (
          <div className="card p-6 text-center text-sm text-secondary">
            Your application is already with our team. Please check back here
            for the decision.
          </div>
        )}
      </div>

      <MessageModal
        open={msgOpen}
        message={msg}
        onClose={() => setMsgOpen(false)}
      />
    </div>
  );
}
