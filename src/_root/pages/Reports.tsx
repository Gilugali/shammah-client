import { useState, useEffect } from "react";
import { pdfApi, type IReport } from "@/lib/api/pdf";
import { formatRWF } from "@/lib/utils/currency";
import { toast } from "sonner";

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

const Reports = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  const [reports, setReports] = useState<IReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fromYear, setFromYear] = useState(currentYear);
  const [fromMonth, setFromMonth] = useState(1); // January
  const [toYear, setToYear] = useState(currentYear);
  const [toMonth, setToMonth] = useState(currentMonth);
  const [totalPatients, setTotalPatients] = useState(0);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await pdfApi.getRangeReports(
        fromYear,
        fromMonth,
        toYear,
        toMonth
      );
      setReports(response.data.reports);
      setTotalPatients(response.totalPatients || 0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load reports");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromYear, fromMonth, toYear, toMonth]);

  const handlePrintReport = async () => {
    try {
      await pdfApi.downloadRangeReportPDF(
        fromYear,
        fromMonth,
        toYear,
        toMonth
      );
      toast.success("Report downloaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to download report");
      console.error(error);
    }
  };

  const handleClearFilters = () => {
    setFromYear(currentYear);
    setFromMonth(1); // January
    setToYear(currentYear);
    setToMonth(currentMonth);
  };

  // Format month display (from "2024-December" to "December 2024")
  const formatMonthDisplay = (monthKey: string): string => {
    const parts = monthKey.split("-");
    if (parts.length === 2) {
      return `${parts[1]} ${parts[0]}`;
    }
    return monthKey;
  };

  // Calculate grand totals
  const grandTotalMomo = reports.reduce(
    (sum, r) => sum + r.totalMomo.totalAmount,
    0
  );
  const grandTotalCash = reports.reduce(
    (sum, r) => sum + r.totalcash.totalAmount,
    0
  );
  const grandTotalInsurance = reports.reduce(
    (sum, r) => sum + r.insurances.reduce((s, i) => s + i.amount, 0),
    0
  );
  const grandTotalRevenue = grandTotalMomo + grandTotalInsurance + grandTotalCash;
  const grandTotalExpenses = reports.reduce(
    (sum, r) => sum + r.totalExpense,
    0
  );
  const grandNetProfit = grandTotalRevenue - grandTotalExpenses;

  // Generate year options (current year and previous 2 years)
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">
            View and download monthly financial reports
          </p>
        </div>
        <button
          onClick={handlePrintReport}
          disabled={isLoading || reports.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print Report
        </button>
      </div>

      {/* Month/Year Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Date Range Filters</h2>
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Year
            </label>
            <select
              value={fromYear}
              onChange={(e) => setFromYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Month
            </label>
            <select
              value={fromMonth}
              onChange={(e) => setFromMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {MONTH_NAMES.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Year
            </label>
            <select
              value={toYear}
              onChange={(e) => setToYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Month
            </label>
            <select
              value={toMonth}
              onChange={(e) => setToMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {MONTH_NAMES.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No reports found for the selected date range.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-teal-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Patients
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    MOMO
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Insurance
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Cash
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Expenses
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider bg-teal-700">
                    Net Profit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...reports].sort((a, b) => a.month.localeCompare(b.month)).map((report) => {
                  // Calculate total unique patients for the month
                  const totalPatientsForMonth =
                    report.totalMomo.patients +
                    report.totalcash.patients +
                    report.insurances.reduce((sum, ins) => sum + ins.patients, 0);
                  
                  const totalInsurance = report.insurances.reduce(
                    (sum, ins) => sum + ins.amount,
                    0
                  );
                  const totalRevenue = report.totalMomo.totalAmount + totalInsurance + report.totalcash.totalAmount;
                  const netProfit = totalRevenue - report.totalExpense;

                  return (
                    <tr key={report.month} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatMonthDisplay(report.month)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {totalPatientsForMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatRWF(report.totalMomo.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatRWF(totalInsurance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatRWF(report.totalcash.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatRWF(totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatRWF(report.totalExpense)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                        netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatRWF(netProfit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                    {totalPatients}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatRWF(grandTotalMomo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatRWF(grandTotalInsurance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatRWF(grandTotalCash)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-teal-700 text-right">
                    {formatRWF(grandTotalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatRWF(grandTotalExpenses)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                    grandNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatRWF(grandNetProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

