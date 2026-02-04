import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api/dashboard";
import { pdfApi } from "@/lib/api/pdf";
import { formatRWF } from "@/lib/utils/currency";
import { toast } from "sonner";
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
  LineChart,
  Line,
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

const InvestorDashboard = () => {
  const { user } = useAuth();
  const now = new Date();
  const [dashboardData, setDashboardData] = useState<{
    paidToday: number;
    coverage: number;
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const dashboardResponse = await dashboardApi.getCards();
        if (dashboardResponse.success && dashboardResponse.data) {
          const paidToday =
            typeof dashboardResponse.data.paidToday === "string"
              ? parseFloat(dashboardResponse.data.paidToday)
              : dashboardResponse.data.paidToday || 0;
          const coverage =
            typeof dashboardResponse.data.coverage === "string"
              ? parseFloat(dashboardResponse.data.coverage)
              : dashboardResponse.data.coverage || 0;

          setDashboardData({
            paidToday: isNaN(paidToday) ? 0 : paidToday,
            coverage: isNaN(coverage) ? 0 : coverage,
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

  useEffect(() => {
    const fetchAnnualChart = async () => {
      try {
        setIsLoadingChart(true);
        const dashboardResponse = await dashboardApi.getCards(chartYear);

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
          insuranceIdToName: {},
        });

        // Only include months that have data in the chart
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

  // Calculate total revenue from chart data
  const totalRevenue = annualChartData.reduce((sum, month) => {
    return (
      sum +
      annualChartMeta.insuranceKeys.reduce((monthSum, key) => {
        return monthSum + (Number(month[key]) || 0);
      }, 0)
    );
  }, 0);

  // Calculate monthly totals for revenue trend
  const monthlyTotals = annualChartData.map((month) => {
    const total = annualChartMeta.insuranceKeys.reduce((sum, key) => {
      return sum + (Number(month[key]) || 0);
    }, 0);
    return {
      month: month.month,
      total,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Investor Dashboard</h1>
          <p className="text-sm text-gray-600 mt-0.5 font-normal">
            Welcome, {user?.name} - Clinic Performance Overview
          </p>
        </div>
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
          {isDownloadingPdf ? "Downloading..." : "Download Report"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Today's Revenue
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoadingStats
                  ? "..."
                  : dashboardData
                    ? formatRWF(dashboardData.paidToday)
                    : formatRWF(0)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {dashboardData?.transactionCount || 0} transactions today
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
                Annual Revenue ({chartYear})
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoadingChart ? "..." : formatRWF(totalRevenue)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Total from all months
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
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

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Insurance Coverage
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoadingStats
                  ? "..."
                  : dashboardData
                    ? formatRWF(dashboardData.coverage)
                    : formatRWF(0)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Today's coverage
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
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
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly Revenue Trend
          </h3>
        </div>
        {isLoadingChart ? (
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            Loading chart data...
          </div>
        ) : monthlyTotals.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            No data available for the selected year
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyTotals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value: number) => formatRWF(value)}
                labelStyle={{ color: "#374151" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#14b8a6"
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Annual Insurance Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Annual Insurance Distribution ({chartYear})
          </h3>
          <select
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
        {isLoadingChart ? (
          <div className="h-[400px] flex items-center justify-center text-gray-500">
            Loading chart data...
          </div>
        ) : annualChartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-gray-500">
            No data available for the selected year
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={annualChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value: number | undefined) => formatRWF(value ?? 0)}
              />
              <Legend />
              {annualChartMeta.insuranceKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default InvestorDashboard;








