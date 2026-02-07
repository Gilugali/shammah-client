import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasAccess, type UserRole } from "@/lib/types/role";

const Icon = ({
  children,
  className = "w-5 h-5",
}: {
  children: React.ReactNode;
  className?: string;
}) => <span className={className}>{children}</span>;

const DashboardIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  </Icon>
);

const PatientsIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  </Icon>
);

const TransactionsIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  </Icon>
);

const InsurancesIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  </Icon>
);

const ReportsIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  </Icon>
);

const FinancialIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  </Icon>
);

const CashIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  </Icon>
);

const ExpensesIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  </Icon>
);

const UsersIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  </Icon>
);

const DeveloperIcon = () => (
  <Icon>
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  </Icon>
);

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType;
  roles: UserRole[];
}

const allNavigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: DashboardIcon,
    roles: ["receptionist", "owner", "admin"],
  },
  {
    name: "Dashboard",
    path: "/investor-dashboard",
    icon: DashboardIcon,
    roles: ["investor"],
  },
  {
    name: "Patients",
    path: "/patients",
    icon: PatientsIcon,
    roles: ["receptionist", "owner", "admin"],
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: TransactionsIcon,
    roles: ["receptionist", "owner", "admin"],
  },
  {
    name: "Insurances",
    path: "/insurances",
    icon: InsurancesIcon,
    roles: ["receptionist", "owner", "admin"],
  },
  {
    name: "Reports",
    path: "/reports",
    icon: ReportsIcon,
    roles: ["receptionist", "owner", "admin", "investor"],
  },
  {
    name: "Financial Overview",
    path: "/financial-overview",
    icon: FinancialIcon,
    roles: ["admin", "investor", "owner"],
  },
  {
    name: "Cash-In",
    path: "/cash-in",
    icon: CashIcon,
    roles: ["admin", "investor", "owner"],
  },
  { name: "Expenses", path: "/expenses", icon: ExpensesIcon, roles: ["admin"] },
  { name: "Users", path: "/users", icon: UsersIcon, roles: ["admin"] },
];

export const LeftSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = (user?.role || "receptionist") as UserRole;

  const navigationItems = allNavigationItems.filter((item) =>
    hasAccess(userRole, item.roles),
  );

  return (
    <div className="w-64 bg-white min-h-screen border-r border-gray-200 shadow-sm flex flex-col">
      {/* Logo Header */}
      <div className="p-4 border-b border-gray-200">
        <Link
          to={userRole === "investor" ? "/investor-dashboard" : "/dashboard"}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src="/shammah-logo.png"
            alt="Shammah Health Clinic Logo"
            className="w-10 h-10 object-contain flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              Shammah Health
            </h2>
            <p className="text-xs text-gray-500 truncate">Clinic</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-teal-50 text-teal-700 border-l-2 border-teal-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <IconComponent />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Developer Link at Bottom - Show for all roles */}
      <div className="p-4 border-t border-gray-200">
        <Link
          to="/developer"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname === "/developer"
              ? "bg-teal-50 text-teal-700 border-l-2 border-teal-600"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <DeveloperIcon />
          Developer
        </Link>
      </div>
    </div>
  );
};
