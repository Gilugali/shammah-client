import { useEffect, useState } from "react";
import { transactionApi } from "@/lib/api/transaction";
import { expenseApi } from "@/lib/api/expense";
import { dashboardApi } from "@/lib/api/dashboard";
import { formatRWF } from "@/lib/utils/currency";
import { AmountWithIndicator } from "@/components/AmountWithIndicator";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

// Professional color palette
const CHART_COLORS = {
  cash: "#10b981", // Green
  expenses: "#ef4444", // Red
  profit: "#3b82f6", // Blue
  clinical: "#8b5cf6", // Purple
  operational: "#f59e0b", // Amber
  background: "#f9fafb",
  grid: "#e5e7eb",
};

const CashIn = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [isLoading, setIsLoading] = useState(true);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [netCash, setNetCash] = useState<number>(0);
  const [monthlyData, setMonthlyData] = useState<
    Array<{
      month: string;
      cash: number;
      expenses: number;
      netCash: number;
    }>
  >([]);
  const [netCashTrendData, setNetCashTrendData] = useState<
    Array<{
      month: string;
      profit: number;
    }>
  >([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [useRange, setUseRange] = useState(false);
  // Default to January to current month
  const [fromMonth, setFromMonth] = useState(0); // January
  const [fromYear, setFromYear] = useState(currentYear);
  const [toMonth, setToMonth] = useState(currentMonth);
  const [toYear, setToYear] = useState(currentYear);
  const [expenseBreakdown, setExpenseBreakdown] = useState<{
    clinical: number;
    operational: number;
  }>({ clinical: 0, operational: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Determine API parameters
        let apiFromMonth: number;
        let apiFromYear: number;
        let apiToMonth: number;
        let apiToYear: number;

        if (useRange) {
          apiFromMonth = fromMonth + 1; // Backend expects 1-12
          apiFromYear = fromYear;
          apiToMonth = toMonth + 1; // Backend expects 1-12
          apiToYear = toYear;
        } else {
          if (selectedMonth !== null) {
            apiFromMonth = selectedMonth + 1;
            apiFromYear = selectedYear;
            apiToMonth = selectedMonth + 1;
            apiToYear = selectedYear;
          } else {
            // Default: January to current month
            apiFromMonth = 1; // January
            apiFromYear = selectedYear;
            apiToMonth = currentMonth + 1; // Current month (1-12)
            apiToYear = selectedYear;
          }
        }

        // Try to fetch from cash-in charts API, fallback to manual calculation if not available
        try {
          const chartsResponse = await dashboardApi.getCashInCharts(
            apiFromYear,
            apiFromMonth,
            apiToYear,
            apiToMonth,
          );

          const chartsData = chartsResponse.data;

          // Calculate totals from monthly comparison
          const totalCash = chartsData.monthlyComparison.reduce(
            (sum, item) => sum + item.revenue,
            0,
          );
          const totalExpenses = chartsData.monthlyComparison.reduce(
            (sum, item) => sum + item.totalExpense,
            0,
          );
          const totalNetCash = totalCash - totalExpenses;

          setCashReceived(totalCash);
          setMonthlyExpenses(totalExpenses);
          setNetCash(totalNetCash);

          // Set expense breakdown
          const clinicalExpense = chartsData.expenseTrackerBreakdown.find(
            (item) => item.clinicalExpense !== undefined
          )?.clinicalExpense ?? 0;
          const operationalExpense = chartsData.expenseTrackerBreakdown.find(
            (item) => item.operationalExpense !== undefined
          )?.operationalExpense ?? 0;

          setExpenseBreakdown({
            clinical: Number(clinicalExpense) || 0,
            operational: Number(operationalExpense) || 0,
          });

          // Transform monthly comparison data for cash-in charts
          const monthlyComparisonData = chartsData.monthlyComparison.map((item) => ({
            month: item.month,
            cash: item.revenue, // Revenue in cash-in context is only cash
            expenses: item.totalExpense,
            netCash: item.profit, // Profit in cash-in context is net cash
          }));

          setMonthlyData(monthlyComparisonData);

          // Set net cash trend data
          setNetCashTrendData(chartsData.profitTrend);
        } catch (error) {
          // Fallback to manual calculation if API doesn't exist
          console.warn("Cash-in charts API not available, using manual calculation:", error);

          let startDate: Date;
          let endDate: Date;

          if (useRange) {
            startDate = new Date(fromYear, fromMonth, 1);
            endDate = new Date(toYear, toMonth + 1, 0, 23, 59, 59, 999);
          } else {
            const monthToUse = selectedMonth !== null ? selectedMonth : currentMonth;
            const yearToUse = selectedYear;
            startDate = new Date(yearToUse, monthToUse, 1);
            endDate = new Date(
              yearToUse,
              monthToUse + 1,
              0,
              23,
              59,
              59,
              999,
            );
          }

          // Fetch transactions for selected period
          const transactionsResponse = await transactionApi.getMonthlyReport(
            startDate.toISOString(),
            endDate.toISOString(),
          );

          // Calculate total cash received (only patientPaidAmount - no insurance)
          const cash = transactionsResponse.data.reduce(
            (sum, transaction) => sum + Number(transaction.patientPaidAmount || 0),
            0,
          );

          // Fetch expenses
          const expensesResponse = await expenseApi.getAll();

          // Filter expenses for selected period
          const selectedPeriodExpenses = expensesResponse.expenses.filter(
            (expense) => {
              const expenseDate = new Date(expense.expenseDate);
              return expenseDate >= startDate && expenseDate <= endDate;
            },
          );

          // Calculate total expenses
          const expenses = selectedPeriodExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount || 0),
            0,
          );

          // Calculate expense breakdown by type
          const clinicalExpenses = selectedPeriodExpenses
            .filter((expense) => expense.type === "CLINICAL")
            .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

          const operationalExpenses = selectedPeriodExpenses
            .filter((expense) => expense.type === "OPERATIONAL")
            .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

          // Calculate net cash (cash received - expenses)
          const net = cash - expenses;

          setCashReceived(cash);
          setMonthlyExpenses(expenses);
          setNetCash(net);
          setExpenseBreakdown({
            clinical: clinicalExpenses,
            operational: operationalExpenses,
          });

          // Calculate monthly data for the selected period
          const monthlyBreakdown: Array<{
            month: string;
            cash: number;
            expenses: number;
            netCash: number;
          }> = [];

          if (useRange) {
            const start = new Date(fromYear, fromMonth, 1);
            const end = new Date(toYear, toMonth + 1, 0, 23, 59, 59, 999);
            
            let current = new Date(start);
            while (current <= end) {
              const month = current.getMonth();
              const year = current.getFullYear();
              const monthStart = new Date(year, month, 1);
              const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

              const monthTransactionsResponse =
                await transactionApi.getMonthlyReport(
                  monthStart.toISOString(),
                  monthEnd.toISOString(),
                );

              const monthCash = monthTransactionsResponse.data.reduce(
                (sum, transaction) => sum + Number(transaction.patientPaidAmount || 0),
                0,
              );

              const monthExpenses = expensesResponse.expenses
                .filter((expense) => {
                  const expenseDate = new Date(expense.expenseDate);
                  return (
                    expenseDate.getMonth() === month &&
                    expenseDate.getFullYear() === year
                  );
                })
                .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

              monthlyBreakdown.push({
                month: `${MONTH_NAMES[month]} ${year}`,
                cash: monthCash,
                expenses: monthExpenses,
                netCash: monthCash - monthExpenses,
              });

              current = new Date(year, month + 1, 1);
            }
          } else {
            const yearToUse = selectedYear;
            const startMonth = selectedMonth !== null ? selectedMonth : 0; // January
            const endMonth = selectedMonth !== null ? selectedMonth : currentMonth; // Current month

            for (let month = startMonth; month <= endMonth; month++) {
              const monthStart = new Date(yearToUse, month, 1);
              const monthEnd = new Date(
                yearToUse,
                month + 1,
                0,
                23,
                59,
                59,
                999,
              );

              const monthTransactionsResponse =
                await transactionApi.getMonthlyReport(
                  monthStart.toISOString(),
                  monthEnd.toISOString(),
                );

              const monthCash = monthTransactionsResponse.data.reduce(
                (sum, transaction) => sum + Number(transaction.patientPaidAmount || 0),
                0,
              );

              const monthExpenses = expensesResponse.expenses
                .filter((expense) => {
                  const expenseDate = new Date(expense.expenseDate);
                  return (
                    expenseDate.getMonth() === month &&
                    expenseDate.getFullYear() === yearToUse
                  );
                })
                .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

              monthlyBreakdown.push({
                month: MONTH_NAMES[month],
                cash: monthCash,
                expenses: monthExpenses,
                netCash: monthCash - monthExpenses,
              });
            }
          }

          setMonthlyData(monthlyBreakdown);
          
          // Create net cash trend from monthly data
          const trendData = monthlyBreakdown.map((item) => ({
            month: item.month,
            profit: item.netCash,
          }));
          setNetCashTrendData(trendData);
        }
      } catch (error) {
        console.error("Failed to fetch cash-in data:", error);
        setCashReceived(0);
        setMonthlyExpenses(0);
        setNetCash(0);
        setMonthlyData([]);
        setNetCashTrendData([]);
        setExpenseBreakdown({ clinical: 0, operational: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    selectedYear,
    selectedMonth,
    currentMonth,
    currentYear,
    useRange,
    fromMonth,
    fromYear,
    toMonth,
    toYear,
  ]);


  const getPeriodLabel = () => {
    if (useRange) {
      if (fromYear === toYear && fromMonth === toMonth) {
        return `${MONTH_NAMES[fromMonth]} ${fromYear}`;
      }
      return `${MONTH_NAMES[fromMonth]} ${fromYear} - ${MONTH_NAMES[toMonth]} ${toYear}`;
    }
    if (selectedMonth !== null) {
      return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    // Default: January to current month
    return `January - ${MONTH_NAMES[currentMonth]} ${currentYear}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cash-In</h1>
          <p className="text-sm text-gray-600 mt-0.5 font-normal">
            Cash Received vs Expenses Analysis
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle between single month and range */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              View Mode:
            </label>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setUseRange(false);
                  setFromMonth(0); // January
                  setFromYear(currentYear);
                  setToMonth(currentMonth);
                  setToYear(currentYear);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  !useRange
                    ? "bg-white text-teal-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Single Month
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseRange(true);
                  setSelectedMonth(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  useRange
                    ? "bg-white text-teal-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {!useRange ? (
            <>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="year-select"
                  className="text-sm font-medium text-gray-700"
                >
                  Year:
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setSelectedMonth(null);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {[
                    currentYear,
                    currentYear - 1,
                    currentYear - 2,
                    currentYear - 3,
                  ].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="month-select"
                  className="text-sm font-medium text-gray-700"
                >
                  Month:
                </label>
                <select
                  id="month-select"
                  value={selectedMonth !== null ? selectedMonth : ""}
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[140px]"
                >
                  <option value="">Year to Date (Jan - Current)</option>
                  {MONTH_NAMES.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  From:
                </label>
                <select
                  value={fromMonth}
                  onChange={(e) => setFromMonth(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[120px]"
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={fromYear}
                  onChange={(e) => setFromYear(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {[
                    currentYear,
                    currentYear - 1,
                    currentYear - 2,
                    currentYear - 3,
                  ].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  To:
                </label>
                <select
                  value={toMonth}
                  onChange={(e) => setToMonth(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[120px]"
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={toYear}
                  onChange={(e) => setToYear(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {[
                    currentYear,
                    currentYear - 1,
                    currentYear - 2,
                    currentYear - 3,
                  ].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                {useRange ? "Period" : selectedMonth !== null ? "Selected Month" : "Current Month"}{" "}
                Cash Received
              </p>
              <p className="text-2xl font-semibold text-green-600">
                {isLoading ? "..." : formatRWF(cashReceived)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {getPeriodLabel()}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                {useRange ? "Period" : selectedMonth !== null ? "Selected Month" : "Current Month"}{" "}
                Expenses
              </p>
              <p className="text-2xl font-semibold text-red-600">
                {isLoading ? "..." : formatRWF(monthlyExpenses)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {getPeriodLabel()}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-teal-200 bg-teal-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700 mb-1.5">
                Net Cash
              </p>
              <div
                className={`text-2xl font-bold ${
                  netCash >= 0 ? "text-teal-600" : ""
                }`}
              >
                {isLoading ? "..." : <AmountWithIndicator amount={netCash} />}
              </div>
              <p className="text-[11px] text-gray-600 mt-1.5">
                Cash - Expenses
              </p>
            </div>
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
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
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            Cash-In vs Expenses - {getPeriodLabel()}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Detailed breakdown for{" "}
            {useRange
              ? "selected period"
              : selectedMonth !== null
                ? "selected"
                : "current"}{" "}
            {useRange ? "" : "month"}
          </p>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading financial data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (RWF)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Total Cash Received
                    </div>
                    <div className="text-xs text-gray-500">
                      From patient payments only
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {formatRWF(cashReceived)}
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Total Expenses
                    </div>
                    <div className="text-xs text-gray-500">
                      Operational & Clinical
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-red-600">
                      {formatRWF(monthlyExpenses)}
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Net Cash
                    </div>
                    <div className="text-xs text-gray-500">
                      Cash Received - Expenses
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-semibold ${
                        netCash >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <AmountWithIndicator amount={netCash} />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Type Breakdown Donut Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Expense Type Breakdown - {getPeriodLabel()}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Clinical vs Operational expenses distribution
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            </div>
          ) : expenseBreakdown.clinical === 0 &&
            expenseBreakdown.operational === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="mt-2 text-gray-500">
                  No expense data available for the selected period
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <defs>
                      <linearGradient id="clinicalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.clinical} stopOpacity={1} />
                        <stop offset="95%" stopColor={CHART_COLORS.clinical} stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="operationalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.operational} stopOpacity={1} />
                        <stop offset="95%" stopColor={CHART_COLORS.operational} stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[
                        {
                          name: "Clinical",
                          value: expenseBreakdown.clinical,
                          fill: "url(#clinicalGradient)",
                        },
                        {
                          name: "Operational",
                          value: expenseBreakdown.operational,
                          fill: "url(#operationalGradient)",
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => {
                        if (value === 0) return "";
                        return `${name}\n${((percent ?? 0) * 100).toFixed(1)}%`;
                      }}
                      outerRadius={130}
                      innerRadius={70}
                      dataKey="value"
                      stroke="white"
                      strokeWidth={3}
                    >
                      <Cell key="clinical" fill="url(#clinicalGradient)" />
                      <Cell key="operational" fill="url(#operationalGradient)" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                      formatter={(value: number | undefined) => formatRWF(value ?? 0)}
                      labelStyle={{ color: "#111827", fontWeight: 600 }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-sm"></div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">
                          Clinical Expenses
                        </span>
                        <span className="text-xs text-gray-600 mt-0.5">
                          Medical & treatment costs
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-700">
                        {formatRWF(expenseBreakdown.clinical)}
                      </div>
                      <div className="text-xs font-medium text-purple-600 mt-1">
                        {monthlyExpenses > 0
                          ? (
                              (expenseBreakdown.clinical / monthlyExpenses) *
                              100
                            ).toFixed(1)
                          : 0}
                        % of total
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full shadow-sm"></div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">
                          Operational Expenses
                        </span>
                        <span className="text-xs text-gray-600 mt-0.5">
                          Administrative & overhead
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-amber-700">
                        {formatRWF(expenseBreakdown.operational)}
                      </div>
                      <div className="text-xs font-medium text-amber-600 mt-1">
                        {monthlyExpenses > 0
                          ? (
                              (expenseBreakdown.operational / monthlyExpenses) *
                              100
                            ).toFixed(1)
                          : 0}
                        % of total
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 shadow-sm mt-6">
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">
                        Total Expenses
                      </span>
                      <span className="text-xs text-gray-600 mt-0.5">
                        Combined expenses
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatRWF(monthlyExpenses)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Comparison Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly Comparison - {useRange ? getPeriodLabel() : `${selectedYear}`}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Cash received, expenses, and net cash breakdown by month
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="mt-2 text-gray-500">
                  No data available for the selected {useRange ? "period" : "year"}
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.cash} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={CHART_COLORS.cash} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.expenses} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={CHART_COLORS.expenses} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="netCashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.grid}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={{ stroke: CHART_COLORS.grid }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={{ stroke: CHART_COLORS.grid }}
                  tickFormatter={(value) =>
                    value >= 1_000_000
                      ? `${(value / 1_000_000).toFixed(1)}M`
                      : `${(value / 1000).toFixed(0)}K`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    padding: "12px",
                  }}
                  formatter={(value: number | undefined) => formatRWF(value ?? 0)}
                  labelStyle={{ color: "#111827", fontWeight: 600, marginBottom: "8px" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
                <Bar
                  dataKey="cash"
                  name="Cash Received"
                  fill="url(#cashGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="url(#expensesGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="netCash"
                  name="Net Cash"
                  fill="url(#netCashGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Net Cash Trend Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Net Cash Trend - {useRange ? getPeriodLabel() : `${selectedYear}`}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Net cash performance over time
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <p className="mt-2 text-gray-500">
                  No data available for the selected {useRange ? "period" : "year"}
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={netCashTrendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="netCashLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.grid}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={{ stroke: CHART_COLORS.grid }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={{ stroke: CHART_COLORS.grid }}
                  tickFormatter={(value) =>
                    value >= 1_000_000
                      ? `${(value / 1_000_000).toFixed(1)}M`
                      : `${(value / 1000).toFixed(0)}K`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    padding: "12px",
                  }}
                  formatter={(value: number | undefined) => formatRWF(value ?? 0)}
                  labelStyle={{ color: "#111827", fontWeight: 600, marginBottom: "8px" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke={CHART_COLORS.profit}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.profit, r: 5, strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 7, stroke: CHART_COLORS.profit, strokeWidth: 2 }}
                  name="Net Cash"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashIn;



