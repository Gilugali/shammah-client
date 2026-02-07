import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white font-semibold text-sm">S</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Shammah Health Clinic
          </h1>
          <p className="text-xs text-gray-500 font-normal">
            Patient Management System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          Welcome, {user?.name || "User"}
        </span>
        <button
          onClick={() => navigate("/profile")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Profile"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>

        <button
          onClick={handleLogout}
          className="p-2 text-red-600 bg-gray-100 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
          title="Logout"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
