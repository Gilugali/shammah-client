import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import AuthLayout from "@/_auth/AuthLayout";
import RootLayout from "@/_root/RootLayout";
import SigninForm from "@/_auth/forms/SigninForm";
import Dashboard from "@/_root/pages/Dashboard";
import Patients from "@/_root/pages/Patients";
import Transactions from "@/_root/pages/Transactions";
import Insurances from "@/_root/pages/Insurances";
import InsurancePayments from "@/_root/pages/InsurancePayments";
import Expenses from "@/_root/pages/Expenses";
import Users from "@/_root/pages/Users";
import InvestorDashboard from "@/_root/pages/InvestorDashboard";
import FinancialOverview from "@/_root/pages/FinancialOverview";
import CashIn from "@/_root/pages/CashIn";
import Reports from "@/_root/pages/Reports";
import Developer from "@/_root/pages/Developer";
import { RoleGuard } from "@/components/RoleGuard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<AuthLayout />}>
            <Route path="/sign-in" element={<SigninForm />} />
          </Route>

          {/* Private routes */}
          <Route element={<RootLayout />}>
            {/* Receptionist, owner, Admin routes */}
            <Route
              path="/dashboard"
              element={
                <RoleGuard allowedRoles={["receptionist", "owner", "admin"]}>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/patients"
              element={
                <RoleGuard allowedRoles={["receptionist", "owner", "admin"]}>
                  <Patients />
                </RoleGuard>
              }
            />
            <Route
              path="/transactions"
              element={
                <RoleGuard allowedRoles={["receptionist", "owner", "admin"]}>
                  <Transactions />
                </RoleGuard>
              }
            />
            <Route
              path="/insurances"
              element={
                <RoleGuard allowedRoles={["receptionist", "owner", "admin"]}>
                  <Insurances />
                </RoleGuard>
              }
            />
            <Route
              path="/insurances/payments"
              element={
                <RoleGuard allowedRoles={["receptionist", "owner", "admin"]}>
                  <InsurancePayments />
                </RoleGuard>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleGuard
                  allowedRoles={["receptionist", "owner", "admin", "investor"]}
                >
                  <Reports />
                </RoleGuard>
              }
            />
            <Route
              path="/financial-overview"
              element={
                <RoleGuard
                  allowedRoles={["admin", "investor", "owner"]}
                >
                  <FinancialOverview />
                </RoleGuard>
              }
            />
            <Route
              path="/cash-in"
              element={
                <RoleGuard
                  allowedRoles={["admin", "investor", "owner"]}
                >
                  <CashIn />
                </RoleGuard>
              }
            />

            {/* Admin only routes */}
            <Route
              path="/expenses"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <Expenses />
                </RoleGuard>
              }
            />
            <Route
              path="/users"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <Users />
                </RoleGuard>
              }
            />

            {/* Investor routes */}
            <Route
              path="/investor-dashboard"
              element={
                <RoleGuard
                  allowedRoles={["investor"]}
                  redirectTo="/investor-dashboard"
                >
                  <InvestorDashboard />
                </RoleGuard>
              }
            />

            {/* Common routes */}
            <Route path="/developer" element={<Developer />} />
            <Route
              path="/appointments"
              element={<div>Appointments (Coming Soon)</div>}
            />
            <Route
              path="/medical-records"
              element={<div>Medical Records (Coming Soon)</div>}
            />
            <Route
              path="/prescriptions"
              element={<div>Prescriptions (Coming Soon)</div>}
            />
            <Route
              path="/lab-results"
              element={<div>Lab Results (Coming Soon)</div>}
            />
            <Route
              path="/inventory"
              element={<div>Inventory (Coming Soon)</div>}
            />
            <Route path="/billing" element={<div>Billing (Coming Soon)</div>} />
            <Route
              path="/messages"
              element={<div>Messages (Coming Soon)</div>}
            />
            <Route
              path="/reminders"
              element={<div>Reminders (Coming Soon)</div>}
            />
            <Route
              path="/settings"
              element={<div>Settings (Coming Soon)</div>}
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
