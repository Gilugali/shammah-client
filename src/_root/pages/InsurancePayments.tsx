import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { insuranceApi, type Insurance } from "@/lib/api/insurance";
import { transactionApi } from "@/lib/api/transaction";
import { formatRWF } from "@/lib/utils/currency";
import { toast } from "sonner";
import { Pagination } from "@/components/shared/Pagination";
import InsurancePaymentModal from "@/components/InsurancePaymentModal";

interface InsurancePaymentRecord {
  insuranceId: string;
  insuranceName: string;
  month: string; // Format: "YYYY-MM"
  monthDisplay: string; // Format: "January 2024"
  peopleReceived: number; // Number of transactions/patients
  expectedAmount: number; // Amount expected from insurance (from coverage)
  actualPaidAmount: number; // Amount actually paid (placeholder for now)
}

const getMonthBounds = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const InsurancePayments = () => {
  const now = new Date();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<
    InsurancePaymentRecord[]
  >([]);
  const [filteredRecords, setFilteredRecords] = useState<
    InsurancePaymentRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedInsurance, setSelectedInsurance] = useState<string>("all");
  const [fromMonth, setFromMonth] = useState(now.getMonth() + 1);
  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(now.getMonth() + 1);
  const [toYear, setToYear] = useState(now.getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<InsurancePaymentRecord | null>(null);
  const itemsPerPage = 50; // Increased for reporting view
  const monthNames = [
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

  // Fetch all insurances
  useEffect(() => {
    const fetchInsurances = async () => {
      try {
        const response = await insuranceApi.getAll();
        setInsurances(response.data);
      } catch (error) {
        toast.error("Failed to load insurances");
        console.error(error);
      }
    };
    fetchInsurances();
  }, []);

  // Fetch and process payment records
  const fetchPaymentRecords = useCallback(async () => {
      try {
        setIsLoading(true);

        // Use the new API endpoint with month/year range
        const params: any = {
          fromMonth,
          fromYear,
          toMonth,
          toYear,
        };

        if (selectedInsurance !== "all") {
          params.insuranceId = selectedInsurance;
        }

        // Call the new insurance payments endpoint
        const response = await insuranceApi.getPayments(
          params.fromYear,
          params.fromMonth,
          params.toYear,
          params.toMonth,
          params.insuranceId,
        );

        if (response.success && response.data) {
          // Transform API response to match our interface
          let records: InsurancePaymentRecord[] = response.data.map((item) => ({
            insuranceId: item.insuranceId,
            insuranceName: item.insuranceName,
            month: item.month,
            monthDisplay: item.monthDisplay,
            peopleReceived: item.peopleReceived,
            expectedAmount: item.expectedAmount,
            actualPaidAmount: item.actualPaidAmount,
          }));

          // Filter by selected insurance if not "all"
          if (selectedInsurance !== "all") {
            records = records.filter(
              (record) => record.insuranceId === selectedInsurance,
            );
            // Exclude current month when insurance is selected
            const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            records = records.filter(
              (record) => record.month !== currentMonthKey,
            );
          }

          // Filter by date range (fromMonth/fromYear to toMonth/toYear)
          const fromMonthKey = `${fromYear}-${String(fromMonth).padStart(2, "0")}`;
          const toMonthKey = `${toYear}-${String(toMonth).padStart(2, "0")}`;
          records = records.filter((record) => {
            return record.month >= fromMonthKey && record.month <= toMonthKey;
          });

          setPaymentRecords(records);
          setIsLoading(false);
          return;
        }

        // Fallback to old method if API not ready
        const fromBounds = getMonthBounds(fromYear, fromMonth);
        const toBounds = getMonthBounds(toYear, toMonth);
        const start = fromBounds.start;
        const end = toBounds.end;

        const fallbackResponse = await transactionApi.getMonthlyReport(
          start,
          end,
        );
        const transactions = fallbackResponse.data || [];

        // Group transactions by insurance and month
        const recordsMap = new Map<string, InsurancePaymentRecord>();

        transactions.forEach((transaction) => {
          if (!transaction.insuranceId) return;

          const transactionDate = new Date(transaction.createdAt);
          const transactionYear = transactionDate.getFullYear();
          const transactionMonth = transactionDate.getMonth() + 1;
          const monthKey = `${transactionYear}-${String(transactionMonth).padStart(2, "0")}`;
          const recordKey = `${transaction.insuranceId}-${monthKey}`;

          if (!recordsMap.has(recordKey)) {
            // Find insurance name
            const insurance = insurances.find(
              (ins) => ins.id === transaction.insuranceId,
            );
            const insuranceName = insurance?.name || "Unknown Insurance";

            recordsMap.set(recordKey, {
              insuranceId: transaction.insuranceId,
              insuranceName,
              month: monthKey,
              monthDisplay: `${monthNames[transactionMonth - 1]} ${transactionYear}`,
              peopleReceived: 0,
              expectedAmount: 0,
              actualPaidAmount: 0,
            });
          }

          const record = recordsMap.get(recordKey)!;
          record.peopleReceived += 1;
          record.expectedAmount += Number(transaction.coverage) || 0;
        });

        // Convert map to array and calculate actualPaidAmount from transactions
        const records = Array.from(recordsMap.values());

        // Calculate actualPaidAmount from transaction actualPaid values
        records.forEach((record) => {
          const monthTransactions = transactions.filter((t) => {
            if (!t.insuranceId || t.insuranceId !== record.insuranceId)
              return false;
            const tDate = new Date(t.createdAt);
            const tYear = tDate.getFullYear();
            const tMonth = tDate.getMonth() + 1;
            const tMonthKey = `${tYear}-${String(tMonth).padStart(2, "0")}`;
            return tMonthKey === record.month;
          });

          record.actualPaidAmount = monthTransactions.reduce(
            (sum, t) => sum + (Number(t.actualPaid) || 0),
            0,
          );
        });

        // Filter by selected insurance if not "all"
        let filteredRecords = records;
        if (selectedInsurance !== "all") {
          filteredRecords = records.filter(
            (record) => record.insuranceId === selectedInsurance,
          );
          // Exclude current month when insurance is selected
          const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          filteredRecords = filteredRecords.filter(
            (record) => record.month !== currentMonthKey,
          );
        }

        // Filter by date range (fromMonth/fromYear to toMonth/toYear)
        const fromMonthKey = `${fromYear}-${String(fromMonth).padStart(2, "0")}`;
        const toMonthKey = `${toYear}-${String(toMonth).padStart(2, "0")}`;
        filteredRecords = filteredRecords.filter((record) => {
          return record.month >= fromMonthKey && record.month <= toMonthKey;
        });

        // Sort by month (newest first), then by insurance name
        filteredRecords.sort((a, b) => {
          if (a.month !== b.month) {
            return b.month.localeCompare(a.month);
          }
          return a.insuranceName.localeCompare(b.insuranceName);
        });

        setPaymentRecords(filteredRecords);
      } catch (error) {
        toast.error("Failed to load payment records");
        console.error(error);
        setPaymentRecords([]);
      } finally {
        setIsLoading(false);
      }
    }, [insurances, fromMonth, fromYear, toMonth, toYear, selectedInsurance, now]);

  useEffect(() => {
    if (insurances.length > 0) {
      fetchPaymentRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insurances, fromMonth, fromYear, toMonth, toYear, selectedInsurance]);

  // Filter records (insurance filter is now handled by API)
  useEffect(() => {
    setFilteredRecords(paymentRecords);
    setPage(1); // Reset to first page when records change
  }, [paymentRecords]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const validPage = Math.min(Math.max(1, page), totalPages || 1);
  const paginatedRecords = filteredRecords.slice(
    (validPage - 1) * itemsPerPage,
    validPage * itemsPerPage,
  );

  // Calculate totals for reporting
  const totals = filteredRecords.reduce(
    (acc, record) => {
      acc.expectedAmount += record.expectedAmount;
      acc.actualPaidAmount += record.actualPaidAmount;
      acc.peopleReceived += record.peopleReceived;
      return acc;
    },
    { expectedAmount: 0, actualPaidAmount: 0, peopleReceived: 0 },
  );
  // Calculate total difference by summing individual differences from each record
  const totalDifference = filteredRecords.reduce((sum, record) => {
    const recordDifference = record.actualPaidAmount === 0
      ? 0
      : record.expectedAmount - record.actualPaidAmount;
    return sum + recordDifference;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <Link
              to="/insurances"
              className="hover:text-teal-600 transition-colors"
            >
              Insurances
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Payment Tracking</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Insurance Payment Report
          </h1>
          <p className="text-gray-600 mt-1 text-sm font-normal">
            Track expected vs actual payments from insurance providers
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setSelectedRecord(null);
              setIsModalOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Record Payment
          </button>
        </div>
      </div>

      {/* Month/Year Range Selectors and Insurance Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">From:</label>
            <select
              value={fromMonth}
              onChange={(e) => setFromMonth(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {monthNames.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={fromYear}
              onChange={(e) => setFromYear(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">To:</label>
            <select
              value={toMonth}
              onChange={(e) => setToMonth(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {monthNames.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={toYear}
              onChange={(e) => setToYear(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ),
              )}
            </select>
          </div>
          {insurances.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">
                Insurance:
              </label>
              <select
                value={selectedInsurance}
                onChange={(e) => setSelectedInsurance(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[150px]"
              >
                <option value="all">All Insurances</option>
                {insurances.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">
              Total Expected
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatRWF(totals.expectedAmount)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">
              Total Actual Paid
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatRWF(totals.actualPaidAmount)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">
              Net Difference
            </div>
            <div
              className={`text-lg font-semibold ${
                totalDifference > 0
                  ? "text-red-600"
                  : totalDifference < 0
                    ? "text-green-600"
                    : "text-gray-600"
              }`}
            >
              {totalDifference !== 0 && (totalDifference < 0 ? "+" : "")}
              {formatRWF(Math.abs(totalDifference))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading payment records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">
              No payment records found for the selected period
            </p>
            <p className="text-sm text-gray-400">
              Try selecting a different date range or insurance
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Insurance Name
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      People Received
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Amount
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Paid Amount
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difference
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecords.map((record, index) => {
                    // If actualPaidAmount is 0, difference should be 0
                    const difference = record.actualPaidAmount === 0
                      ? 0
                      : record.expectedAmount - record.actualPaidAmount;
                    const isUnderpaid = difference > 0; // Expected more than received
                    const isOverpaid = difference < 0; // Received more than expected
                    return (
                      <tr
                        key={`${record.insuranceId}-${record.month}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            {record.insuranceName}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {record.monthDisplay}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {record.peopleReceived}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-900">
                            {formatRWF(record.expectedAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-900">
                            {formatRWF(record.actualPaidAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div
                            className={`text-xs font-medium ${
                              isUnderpaid
                                ? "text-red-600"
                                : isOverpaid
                                  ? "text-green-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {difference !== 0 && (isOverpaid ? "+" : "")}
                            {formatRWF(Math.abs(difference))}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsModalOpen(true);
                            }}
                            className="text-teal-600 hover:text-teal-900 p-1 rounded hover:bg-teal-50 transition-colors"
                            title="Update payment amount"
                          >
                            <svg
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals Row */}
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900">
                        TOTAL
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-500">
                        {filteredRecords.length}{" "}
                        {filteredRecords.length === 1 ? "record" : "records"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900">
                        {totals.peopleReceived.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900">
                        {formatRWF(totals.expectedAmount)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900">
                        {formatRWF(totals.actualPaidAmount)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div
                        className={`text-xs font-bold ${
                          totalDifference > 0
                            ? "text-red-600"
                            : totalDifference < 0
                              ? "text-green-600"
                              : "text-gray-600"
                        }`}
                      >
                        {totalDifference !== 0 && (totalDifference < 0 ? "+" : "")}
                        {formatRWF(Math.abs(totalDifference))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {/* Empty for actions column */}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {filteredRecords.length > itemsPerPage && (
              <Pagination
                currentPage={validPage}
                totalItems={filteredRecords.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Payment records are currently stored
              locally. Once the backend API is implemented, data will be synced
              with the server.
            </p>
          </div>
        </div>
      </div>

      {/* Insurance Payment Modal */}
      <InsurancePaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
        insuranceId={selectedRecord?.insuranceId}
        month={selectedRecord?.month}
        year={
          selectedRecord
            ? parseInt(selectedRecord.month.split("-")[0])
            : undefined
        }
        monthNumber={
          selectedRecord
            ? parseInt(selectedRecord.month.split("-")[1])
            : undefined
        }
        expectedAmount={selectedRecord?.expectedAmount}
        actualPaidAmount={
          selectedRecord?.actualPaidAmount !== selectedRecord?.expectedAmount
            ? selectedRecord?.actualPaidAmount
            : undefined
        }
        onSuccess={() => {
          // Refresh payment records by calling the same fetch function
          fetchPaymentRecords();
        }}
      />
    </div>
  );
};

export default InsurancePayments;
