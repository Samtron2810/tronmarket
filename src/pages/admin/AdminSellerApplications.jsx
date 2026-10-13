import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSellerApplications,
  reviewSellerApplication,
} from "../../services/sellerApplicationService";

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminSellerApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState({});
  const [reviewingId, setReviewingId] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSellerApplications({
        page,
        limit: 20,
        ...(status !== "all" ? { status } : {}),
      });
      setApplications(res.data.applications || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load seller applications");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApplications();
  }, [fetchApplications]);

  const review = async (application, decision) => {
    try {
      setReviewingId(application._id);
      const res = await reviewSellerApplication(application._id, {
        status: decision,
        reviewNote: notes[application._id] || "",
      });
      toast.success(
        res.data.message ||
          (decision === "approved"
            ? "Application approved"
            : "Application rejected"),
      );
      await fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not review this application",
      );
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            to="/admin"
            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[#101828] px-4 py-2 text-sm font-semibold text-white"
          >
            ← Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-[#101828]">
            Seller Applications
          </h1>
          <p className="mt-1 text-sm text-[#667085]">
            Approve a customer to become a seller, or reject the application
            with a note explaining what to improve.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["pending", "approved", "rejected", "all"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                status === value
                  ? "bg-[#101828] text-white"
                  : "bg-white text-[#101828] border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {value}
            </button>
          ))}
          <span className="ml-auto text-sm text-[#667085]">
            {total} {total === 1 ? "application" : "applications"}
          </span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-[#667085]">
            Loading applications…
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="font-bold text-[#101828]">No applications found</h2>
            <p className="mt-1 text-sm text-[#667085]">
              There are no {status === "all" ? "" : status} seller
              applications to show.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <article
                key={application._id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#101828]">
                      {application.storeName}
                    </h2>
                    <p className="mt-0.5 text-sm text-[#667085]">
                      {application.user?.name || "Applicant"} •{" "}
                      {application.user?.email || ""}
                    </p>
                    <p className="text-xs text-[#667085]">
                      Applied{" "}
                      {new Date(application.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[application.status]}`}
                  >
                    {application.status}
                  </span>
                </div>

                <dl className="grid gap-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
                  <dt className="font-semibold text-[#101828]">Phone</dt>
                  <dd className="text-[#667085]">{application.contactPhone}</dd>
                  <dt className="font-semibold text-[#101828]">Business</dt>
                  <dd className="whitespace-pre-wrap text-[#667085]">
                    {application.businessDescription}
                  </dd>
                  {application.reviewNote && (
                    <>
                      <dt className="font-semibold text-[#101828]">
                        Review note
                      </dt>
                      <dd className="text-[#667085]">
                        {application.reviewNote}
                      </dd>
                    </>
                  )}
                </dl>

                {application.status === "pending" && (
                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 lg:flex-row">
                    <input
                      value={notes[application._id] || ""}
                      onChange={(event) =>
                        setNotes((prev) => ({
                          ...prev,
                          [application._id]: event.target.value,
                        }))
                      }
                      className="input-field flex-1"
                      placeholder="Optional note for the applicant"
                      maxLength={1000}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={reviewingId === application._id}
                        onClick={() => review(application, "rejected")}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId === application._id}
                        onClick={() => review(application, "approved")}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {reviewingId === application._id
                          ? "Saving..."
                          : "Approve as seller"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-[#667085]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
