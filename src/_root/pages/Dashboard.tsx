import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { patientApi } from "@/lib/api/patient";
import { transactionApi } from "@/lib/api/transaction";
import { insuranceApi } from "@/lib/api/insurance";
import { expenseApi } from "@/lib/api/expense";
import { pdfApi } from "@/lib/api/pdf";
import { dashboardApi } from "@/lib/api/dashboard";
import { formatRWF } from "@/lib/utils/currency";
import { toast } from "sonner";
import PatientModal from "@/components/PatientModal";
import TransactionModal from "@/components/TransactionModal";
import { Pagination } from "@/components/shared/Pagination";
import { canEdit } from "@/lib/types/role";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CHART_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#eab308",
  "#22c55e",
  "#8b5cf6",
  "#ec4899",
];

const Dashboard = () => {
  const { user } = useAuth();
  const userCanEdit = canEdit(user?.role);
  const now = new Date();
  const [totalPatients, setTotalPatients] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState<any>(null);
  const [todayTransactionsList, setTodayTransactionsList] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<{
    paidToday: number;
    insuranceExpectedAmount: number;
    transactionCount: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [chartYear, setChartYear] = useState(now.getFullYear());
  const [annualChartData, setAnnualChartData] = useState<any[]>([]);
  const [annualChartMeta, setAnnualChartMeta] = useState<{
    insuranceKeys: string[];
    insuranceIdToName: Record<string, string>;
  }>({ insuranceKeys: [], insuranceIdToName: {} });
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const [transactionsResponse, dashboardResponse] = await Promise.all([
          transactionApi.getToday(),
          dashboardApi.getCards(),
        ]);
        setTotalPatients(dashboardResponse.data.patients);
        setTodayTransactions(transactionsResponse.data);
        setTodayTransactionsList(transactionsResponse.data?.transactions || []);
        if (dashboardResponse.success && dashboardResponse.data) {
          // Parse string values to numbers
          const paidToday =
            typeof dashboardResponse.data.paidToday === "string"
              ? parseFloat(dashboardResponse.data.paidToday)
              : dashboardResponse.data.paidToday || 0;
          const insuranceExpectedAmount =
            typeof dashboardResponse.data.insuranceExpectedAmount === "string"
              ? parseFloat(dashboardResponse.data.insuranceExpectedAmount)
              : dashboardResponse.data.insuranceExpectedAmount || 0;

          setDashboardData({
            paidToday: isNaN(paidToday) ? 0 : paidToday,
            insuranceExpectedAmount: isNaN(insuranceExpectedAmount)
              ? 0
              : insuranceExpectedAmount,
            transactionCount: dashboardResponse.data.patients || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const fetchMonthlyExpenses = async () => {
    try {
      setIsLoadingExpenses(true);
      const response = await expenseApi.getAll();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Filter expenses for current month
      const currentMonthExpenses = response.expenses.filter((expense) => {
        const expenseDate = new Date(expense.expenseDate);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      });

      // Calculate total
      const total = currentMonthExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0,
      );

      setMonthlyExpenses(total);
    } catch (error) {
      console.error("Failed to fetch monthly expenses:", error);
      setMonthlyExpenses(0);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchMonthlyExpenses();
  }, []);

  const handleModalSuccess = async () => {
    try {
      const [transactionsResponse, patientsResponse, dashboardResponse] =
        await Promise.all([
          transactionApi.getToday(),
          patientApi.getAll(1, 1),
          dashboardApi.getCards(),
        ]);
      setTodayTransactions(transactionsResponse.data);
      setTodayTransactionsList(transactionsResponse.data?.transactions || []);
      setTotalPatients(patientsResponse.meta.total);
      if (dashboardResponse.success && dashboardResponse.data) {
        // Parse string values to numbers
        const paidToday =
          typeof dashboardResponse.data.paidToday === "string"
            ? parseFloat(dashboardResponse.data.paidToday)
            : dashboardResponse.data.paidToday || 0;
        const insuranceExpectedAmount =
          typeof dashboardResponse.data.insuranceExpectedAmount === "string"
            ? parseFloat(dashboardResponse.data.insuranceExpectedAmount)
            : dashboardResponse.data.insuranceExpectedAmount || 0;

        setDashboardData({
          paidToday: isNaN(paidToday) ? 0 : paidToday,
          insuranceExpectedAmount: isNaN(insuranceExpectedAmount)
            ? 0
            : insuranceExpectedAmount,
          transactionCount: dashboardResponse.data.patients || 0,
        });
      }
      // Refresh monthly expenses when transactions/expenses are added
      fetchMonthlyExpenses();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  useEffect(() => {
    const fetchAnnualChart = async () => {
      try {
        setIsLoadingChart(true);
        const [insurancesRes, dashboardResponse] = await Promise.all([
          insuranceApi.getAll(),
          dashboardApi.getCards(chartYear),
        ]);

        const idToName: Record<string, string> = {};
        insurancesRes.data.forEach((ins) => {
          idToName[ins.id] = ins.name;
        });

        // Get chart data from dashboard endpoint
        const chartDataFromApi =
          dashboardResponse.success && dashboardResponse.data
            ? dashboardResponse.data.chart
            : {};

        // Get all unique insurance names from chart data
        const allInsuranceNames = new Set<string>();
        Object.values(chartDataFromApi).forEach((monthData) => {
          Object.keys(monthData).forEach((insuranceName) => {
            allInsuranceNames.add(insuranceName);
          });
        });

        const insuranceKeys = Array.from(allInsuranceNames).sort((a, b) =>
          a.localeCompare(b),
        );

        setAnnualChartMeta({
          insuranceKeys,
          insuranceIdToName: idToName,
        });

        // Only include months that have data in the chart
        // The API returns month names like "January", "February", etc.
        const monthsWithData = Object.keys(chartDataFromApi).sort((a, b) => {
          const indexA = MONTH_NAMES.findIndex(
            (m) => m.toLowerCase() === a.toLowerCase(),
          );
          const indexB = MONTH_NAMES.findIndex(
            (m) => m.toLowerCase() === b.toLowerCase(),
          );
          return indexA - indexB;
        });

        // Transform chart data to match the expected format - only for months with data
        const chartData = monthsWithData.map((month) => {
          const row: Record<string, string | number> = {
            month: month.toUpperCase(),
          };
          const monthData = chartDataFromApi[month] || {};
          insuranceKeys.forEach((name) => {
            row[name] = monthData[name] || 0;
          });
          return row;
        });

        setAnnualChartData(chartData);
      } catch (error) {
        console.error("Failed to fetch annual chart:", error);
        setAnnualChartData([]);
        setAnnualChartMeta({ insuranceKeys: [], insuranceIdToName: {} });
      } finally {
        setIsLoadingChart(false);
      }
    };
    fetchAnnualChart();
  }, [chartYear]);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await pdfApi.downloadDailyReport();
      toast.success("PDF downloaded successfully");
    } catch (error: any) {
      const message = error?.message || "Failed to download PDF";
      toast.error(message);
      console.error("PDF download error:", error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const PatientsIcon = () => (
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
  );

  const RevenueIcon = () => (
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
  );

  const InsuranceIcon = () => (
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
  );

  const ExpensesIcon = () => (
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
  );

  const statCards = [
    {
      title: "Total Patients",
      value: isLoadingStats ? "..." : totalPatients,
      subtitle: "All registered",
      icon: PatientsIcon,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Today's Revenue",
      value: isLoadingStats
        ? "..."
        : dashboardData
          ? formatRWF(dashboardData.paidToday)
          : formatRWF(0),
      subtitle: dashboardData
        ? `${dashboardData.transactionCount} transactions`
        : "",
      icon: RevenueIcon,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Insurance Coverage",
      value: isLoadingStats
        ? "..."
        : dashboardData
          ? formatRWF(dashboardData.insuranceExpectedAmount)
          : formatRWF(0),
      subtitle: "Today's coverage",
      icon: InsuranceIcon,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Monthly Expenses",
      value: isLoadingExpenses ? "..." : formatRWF(monthlyExpenses),
      subtitle: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`,
      icon: ExpensesIcon,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-0.5 font-normal">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {userCanEdit && (
            <>
              <button
                onClick={() => setIsPatientModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Patient
              </button>
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Transaction
              </button>
            </>
          )}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {isDownloadingPdf ? "Downloading..." : "Download Report PDF"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1.5">
                    {card.title}
                  </p>
                  {typeof card.value === "number" ? (
                    <p className="text-2xl font-semibold text-gray-900">
                      {card.value}
                    </p>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">
                      {card.value}
                    </p>
                  )}
                  {card.subtitle && (
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div
                  className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}
                >
                  <IconComponent />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Transactions Table and Insurance Distribution Chart */}
      {!isLoadingStats && todayTransactions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                Today's Transactions
              </h3>
            </div>
            {todayTransactionsList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="mb-2">No transactions today</p>
                <button
                  onClick={() => setIsTransactionModalOpen(true)}
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Add your first transaction
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Insurance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {todayTransactionsList
                        .slice((transactionsPage - 1) * 5, transactionsPage * 5)
                        .map((transaction: any, index: number) => (
                          <tr
                            key={
                              transaction.id ||
                              `transaction-${(transactionsPage - 1) * 5 + index}`
                            }
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-large  text-black">
                                {`${transaction.patient.firstName} ${transaction.patient.lastName}`}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                {transaction.patient?.insurance?.name || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatRWF(transaction.patientPaidAmount || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 ">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  {transaction.paymentMethod}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {todayTransactionsList.length > 5 && (
                  <Pagination
                    currentPage={transactionsPage}
                    totalItems={todayTransactionsList.length}
                    itemsPerPage={5}
                    onPageChange={setTransactionsPage}
                  />
                )}
              </>
            )}
          </div>

          {/* Insurance Distribution Pie Chart */}
          {todayTransactions.insuranceCount &&
            todayTransactions.insuranceCount.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Insurance Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={todayTransactions.insuranceCount.map(
                        (item: any) => ({
                          name: item.insuranceName || "Unknown",
                          value: item.transactionCount,
                        }),
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {todayTransactions.insuranceCount.map(
                        (_: any, index: number) => {
                          const colors = [
                            "#8884d8",
                            "#82ca9d",
                            "#ffc658",
                            "#ff7300",
                            "#0088fe",
                          ];
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[index % colors.length]}
                            />
                          );
                        },
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
        </div>
      )}

      {/* Annual insurance progress chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Annual {chartYear} insurance progress by month
          </h3>
          <div className="flex items-center gap-2">
            <label
              htmlFor="chart-year"
              className="text-sm font-medium text-gray-700"
            >
              Year:
            </label>
            <select
              id="chart-year"
              value={chartYear}
              onChange={(e) => setChartYear(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {[
                now.getFullYear(),
                now.getFullYear() - 1,
                now.getFullYear() - 2,
              ].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        {isLoadingChart ? (
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            Loading chart...
          </div>
        ) : annualChartData.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            No data for this year
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={annualChartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(v: number | null) =>
                  v == null
                    ? ""
                    : v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : `${(v / 1000).toFixed(0)}K`
                }
              />
              <Tooltip
                formatter={(value: number | undefined) => formatRWF(value ?? 0)}
              />
              <Legend />
              {annualChartMeta.insuranceKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={key}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Modals */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => {
          handleModalSuccess();
          setIsPatientModalOpen(false);
        }}
      />
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={() => {
          handleModalSuccess();
          setIsTransactionModalOpen(false);
        }}
      />
    </div>
  );
};

export default Dashboard;
