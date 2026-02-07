import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { insuranceApi, type Insurance } from "@/lib/api/insurance";
import { transactionApi } from "@/lib/api/transaction";
import { formatRWF } from "@/lib/utils/currency";
import { toast } from "sonner";
import InsuranceModal from "@/components/InsuranceModal";
import { Pagination } from "@/components/shared/Pagination";

const getMonthBounds = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const Insurances = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [allInsurances, setAllInsurances] = useState<Insurance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOwed, setIsLoadingOwed] = useState(true);
  const [owedByInsurance, setOwedByInsurance] = useState<
    Record<string, number>
  >({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchInsurances = async () => {
    try {
      setIsLoading(true);
      const response = await insuranceApi.getAll();
      setAllInsurances(response.data);
      // Paginate client-side
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setInsurances(response.data.slice(startIndex, endIndex));
    } catch (error) {
      toast.error("Failed to load insurances");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsurances();
  }, [page]);

  const fetchMonthlyOwed = async () => {
    try {
      setIsLoadingOwed(true);
      const { start, end } = getMonthBounds(year, month);
      const response = await transactionApi.getMonthlyReport(start, end);
      const data = response.data || [];
      const byInsurance: Record<string, number> = {};
      data.forEach((t) => {
        if (!t.insuranceId) return;
        const cov = Number(t.insuranceExpectedAmount) || 0;
        byInsurance[t.insuranceId] = (byInsurance[t.insuranceId] ?? 0) + cov;
      });
      setOwedByInsurance(byInsurance);
    } catch (error) {
      toast.error("Failed to load amounts owed");
      console.error(error);
      setOwedByInsurance({});
    } finally {
      setIsLoadingOwed(false);
    }
  };

  useEffect(() => {
    fetchMonthlyOwed();
  }, [year, month]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleOpenModal = (insurance?: Insurance) => {
    setEditingInsurance(insurance || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInsurance(null);
  };

  const handleModalSuccess = () => {
    fetchInsurances();
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Insurances</h1>
          <p className="text-gray-600 mt-1 font-normal">
            Manage insurance providers and coverage rates
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label
              htmlFor="month-select"
              className="text-sm font-medium text-gray-700"
            >
              Amount owed for:
            </label>
            <div className="flex gap-1">
              <select
                id="month-select"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {monthNames.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/insurances/payments"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Payment Tracking
          </Link>
          <button
            onClick={() => handleOpenModal()}
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
            Add Insurance
          </button>
        </div>
      </div>

      {/* Insurances Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading insurances...
          </div>
        ) : insurances.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No insurances found</p>
            <button
              onClick={() => handleOpenModal()}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Add your first insurance
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coverage Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owed this month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insurances.map((insurance) => (
                  <tr key={insurance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {insurance.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                          {insurance.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isLoadingOwed ? (
                        <span className="text-sm text-gray-400">...</span>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {formatRWF(owedByInsurance[insurance.id] ?? 0)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(insurance.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(insurance.updatedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(insurance)}
                        className="text-teal-600 hover:text-teal-900 mr-4 p-1 rounded hover:bg-teal-50 transition-colors"
                        title="Edit insurance"
                      >
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          className="w-5 h-4"
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {allInsurances.length > itemsPerPage && (
          <Pagination
            currentPage={page}
            totalItems={allInsurances.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Insurance Modal */}
      <InsuranceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        insurance={editingInsurance}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Insurances;
