import { useEffect, useState } from "react";
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
  revenue: "#10b981", // Green
  expenses: "#ef4444", // Red
  profit: "#3b82f6", // Blue
  clinical: "#8b5cf6", // Purple
  operational: "#f59e0b", // Amber
  background: "#f9fafb",
  grid: "#e5e7eb",
};

const FinancialOverview = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [isLoading, setIsLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [expectedRevenue, setExpectedRevenue] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [finalNetProfit, setFinalNetProfit] = useState<number>(0);
  const [expectedNetProfit, setExpectedNetProfit] = useState<number>(0);
  const [availableForNextMonth, setAvailableForNextMonth] = useState<number>(0);
  const [monthlyData, setMonthlyData] = useState<
    Array<{
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>
  >([]);
  const [profitTrendData, setProfitTrendData] = useState<
    Array<{
      month: string;
      profit: number;
    }>
  >([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null means "all months"
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

        // Determine month/year for API call
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
          // For single month or default (January to current month)
          if (selectedMonth !== null) {
            // Single month selected
            apiFromMonth = selectedMonth + 1; // Backend expects 1-12
            apiFromYear = selectedYear;
            apiToMonth = selectedMonth + 1; // Backend expects 1-12
            apiToYear = selectedYear;
          } else {
            // Default: January to current month
            apiFromMonth = 1; // January
            apiFromYear = selectedYear;
            apiToMonth = currentMonth + 1; // Current month (1-12)
            apiToYear = selectedYear;
          }
        }

        // Fetch financial summary from backend
        const summaryResponse = await dashboardApi.getFinancialSummary(
          apiFromYear,
          apiFromMonth,
          apiToYear,
          apiToMonth,
        );

        const summary = summaryResponse.data;

        // Set main financial data from backend
        setMonthlyRevenue(summary.finalTotalRevenue);
        setExpectedRevenue(summary.expectedTotalRevenue);
        setMonthlyExpenses(summary.expenses);
        setFinalNetProfit(summary.finalNetProfit);
        setExpectedNetProfit(summary.expectedNetProfit);
        setAvailableForNextMonth(summary.finalNetProfit);

        // Fetch charts data from backend
        const chartsResponse = await dashboardApi.getFinancialSummaryCharts(
          apiFromYear,
          apiFromMonth,
          apiToYear,
          apiToMonth,
        );

        const chartsData = chartsResponse.data;

        // Set expense breakdown from charts API
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

        // Set monthly comparison data from charts API
        const monthlyComparisonData = chartsData.monthlyComparison.map((item) => ({
          month: item.month,
          revenue: item.revenue,
          expenses: item.totalExpense,
          profit: item.profit,
        }));

        setMonthlyData(monthlyComparisonData);

        // Set profit trend data from charts API
        setProfitTrendData(chartsData.profitTrend);
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
        setMonthlyRevenue(0);
        setExpectedRevenue(0);
        setMonthlyExpenses(0);
        setFinalNetProfit(0);
        setExpectedNetProfit(0);
        setAvailableForNextMonth(0);
        setMonthlyData([]);
        setProfitTrendData([]);
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

  const profit = finalNetProfit; // Use the profit from backend
  const displayMonth = useRange
    ? fromMonth
    : selectedMonth !== null
      ? selectedMonth
      : currentMonth;
  const displayYear = useRange ? fromYear : selectedYear;
  const displayToMonth = useRange ? toMonth : displayMonth;
  const displayToYear = useRange ? toYear : displayYear;
  const nextMonthForDisplay = displayToMonth === 11 ? 0 : displayToMonth + 1;
  const nextYearForDisplay =
    displayToMonth === 11 ? displayToYear + 1 : displayToYear;

  // Calculate period label
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Financial Overview
          </h1>
          <p className="text-sm text-gray-600 mt-0.5 font-normal">
            Expenses vs Profits Analysis
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
                  setFromMonth(currentMonth);
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
                    setSelectedMonth(null); // Reset month when year changes
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

      {/* Current Month Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                {useRange ? "Period" : selectedMonth !== null ? "Selected Month" : "Current Month"}{" "}
                Revenue
              </p>
              <p className="text-2xl font-semibold text-green-600">
                {isLoading ? "..." : formatRWF(monthlyRevenue)}
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

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Net Profit
              </p>
              <div
                className={`text-2xl font-semibold ${
                  profit >= 0 ? "text-green-600" : ""
                }`}
              >
                {isLoading ? "..." : <AmountWithIndicator amount={profit} />}
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Revenue - Expenses
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                profit >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-teal-200 bg-teal-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700 mb-1.5">
                Available for Next Month
              </p>
              <div
                className={`text-2xl font-bold ${
                  availableForNextMonth >= 0
                    ? "text-teal-600"
                    : ""
                }`}
              >
                    {isLoading ? "..." : <AmountWithIndicator amount={availableForNextMonth} />}
              </div>
              <p className="text-[11px] text-gray-600 mt-1.5">
                {MONTH_NAMES[nextMonthForDisplay]} {nextYearForDisplay}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
            Expenses vs Profits - {getPeriodLabel()}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Detailed financial breakdown for{" "}
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
                      Total Revenue
                    </div>
                    <div className="text-xs text-gray-500">
                      From all transactions
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {formatRWF(monthlyRevenue)}
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
                      Final Net Profit
                    </div>
                    <div className="text-xs text-gray-500">
                      Actual revenue - Expenses
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-semibold ${
                        finalNetProfit >= 0 ? "text-green-600" : ""
                      }`}
                    >
                      <AmountWithIndicator amount={finalNetProfit} />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Expected Net Profit
                    </div>
                    <div className="text-xs text-gray-500">
                      Expected revenue - Expenses
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-semibold ${
                        expectedNetProfit >= 0 ? "text-blue-600" : ""
                      }`}
                    >
                      <AmountWithIndicator amount={expectedNetProfit} />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Expected Total Revenue
                    </div>
                    <div className="text-xs text-gray-500">
                      Insurance expected + Patient paid
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-blue-600">
                      {formatRWF(expectedRevenue)}
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-teal-50 border-t-2 border-teal-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      Available for {MONTH_NAMES[nextMonthForDisplay]}{" "}
                      {nextYearForDisplay}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Money available for next month
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-lg font-bold ${
                        availableForNextMonth >= 0
                          ? "text-teal-600"
                          : ""
                      }`}
                    >
                      <AmountWithIndicator amount={availableForNextMonth} />
                    </div>
                  </td>
                </tr>
              </tfoot>
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
            Revenue, expenses, and profit breakdown by month
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
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.expenses} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={CHART_COLORS.expenses} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="revenue"
                  name="Revenue"
                  fill="url(#revenueGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="url(#expensesGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="url(#profitGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Profit Trend Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Profit Trend - {useRange ? getPeriodLabel() : `${selectedYear}`}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Profit performance over time
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
                data={profitTrendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="profitLineGradient" x1="0" y1="0" x2="0" y2="1">
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
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;

