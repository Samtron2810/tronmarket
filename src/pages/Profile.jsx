import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { FaHome, FaStore } from "react-icons/fa";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user)
    return (
      <div className="page-container p-6">
        <p className="text-secondary">No profile available.</p>
      </div>
    );

  return (
    <div className="page-container p-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] hover:opacity-80 transition-opacity mb-4 group"
      >
        <FaHome className="transform group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <div className="max-w-xl card p-6 text-center mx-auto">
        <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
        <div className="space-y-2 mb-6">
          <div>
            <div className="text-sm text-secondary">Name</div>
            <div className="font-medium">{user.name}</div>
          </div>
          {/* centerized line */}
          <hr className="border border-blue-200 my-4 w-1/2 mx-auto" />
          <div>
            <div className="text-sm text-secondary">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <hr className="border border-blue-200 my-4 w-1/2 mx-auto" />
          <div>
            <div className="text-sm text-secondary">Role</div>
            <div className="font-medium">{user.role || "customer"}</div>
          </div>
        </div>
        <hr className="border border-blue-200 my-4 w-1/2 mx-auto" />
        {/* apply for a seller role if the user is a customer */}
        {user.role === "customer" && (
          <div className="mb-6">
            <Link
              to="/apply-seller"
              className="pointer-events-none px-6 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              <span>Apply for Seller Role</span>{" "}
              <FaStore className="inline-block ml-2" />
            </Link>
          </div>
        )}
        <hr className="border border-blue-200 my-4 w-1/2 mx-auto" />
        <div className="flex justify-center">
          <button
            onClick={async () => {
              await handleLogout();
              navigate("/", { replace: true });
            }}
            className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold cursor-pointer hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
