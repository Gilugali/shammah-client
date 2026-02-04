import { useState, useEffect, useMemo } from "react";
import { transactionApi, type Transaction } from "@/lib/api/transaction";
import TransactionModal from "@/components/TransactionModal";
import { formatRWF } from "@/lib/utils/currency";
import { toast } from "sonner";
import { Pagination } from "@/components/shared/Pagination";
import FilterBar, { type DateRangeFilter } from "@/components/shared/FilterBar";

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({});

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await transactionApi.getAll(page, 10);
      // Backend returns all transactions
      setAllTransactions(response.transactions);
      setTotal(response.transactions.length);
    } catch (error) {
      toast.error("Failed to load transactions");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchTransactions = async () => {
    if (!searchQuery.trim()) {
      fetchTransactions();
      return;
    }

    try {
      setIsLoading(true);
      const response = await transactionApi.search(searchQuery);
      setTransactions(response.data);
      setTotal(response.data.length);
    } catch (error) {
      toast.error("Failed to search transactions");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [paymentMethodFilter, dateRangeFilter.startDate, dateRangeFilter.endDate]);

  // useEffect(() => {
  //   const debounceTimer = setTimeout(() => {
  //     if (searchQuery.trim()) {
  //       searchTransactions();
  //     } else {
  //       fetchTransactions();
  //     }
  //   }, 300);

  //   return () => clearTimeout(debounceTimer);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = searchQuery
      ? transactions.filter(
          (t) =>
            t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${t.patient.firstName} ${t.patient.lastName}`
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
        )
      : [...allTransactions];

    // Filter by payment method
    if (paymentMethodFilter) {
      filtered = filtered.filter(
        (t) => t.paymentMethod === paymentMethodFilter,
      );
    }

    // Filter by date range
    if (dateRangeFilter.startDate || dateRangeFilter.endDate) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.createdAt);
        if (dateRangeFilter.startDate) {
          const startDate = new Date(dateRangeFilter.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (transactionDate < startDate) return false;
        }
        if (dateRangeFilter.endDate) {
          const endDate = new Date(dateRangeFilter.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (transactionDate > endDate) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [
    allTransactions,
    transactions,
    searchQuery,
    paymentMethodFilter,
    dateRangeFilter,
  ]);

  // Calculate total pages and ensure page is valid
  const totalPages = Math.ceil(filteredTransactions.length / 10);
  const validPage = Math.min(page, Math.max(1, totalPages || 1));
  
  // Update page if it's invalid
  useEffect(() => {
    if (page !== validPage && totalPages > 0) {
      setPage(validPage);
    }
  }, [page, validPage, totalPages]);

  const paginatedTransactions = filteredTransactions.slice(
    (validPage - 1) * 10,
    validPage * 10,
  );

  const handleClearFilters = () => {
    setPaymentMethodFilter("");
    setDateRangeFilter({});
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1 font-normal">
            View and manage all transactions
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
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
          Add Transaction
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search transactions by description or patient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:shadow-md hover:border-gray-300"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-gray-400 hover:text-gray-600 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        filters={{
          select: {
            label: "Payment Method",
            options: [
              { value: "", label: "All Methods" },
              { value: "MOMO", label: "Mobile Money" },
              { value: "CASH", label: "Cash" },
            ],
            value: paymentMethodFilter,
            onChange: (value) => {
              setPaymentMethodFilter(value);
              setPage(1);
            },
          },
          dateRange: {
            label: "Date Range",
            value: dateRangeFilter,
            onChange: (range) => {
              setDateRangeFilter(range);
              setPage(1);
            },
          },
        }}
        onClear={handleClearFilters}
      />

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No transactions found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Add your first transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Payable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.patient.firstName || "N/A"}{" "}
                        {transaction.patient.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {transaction.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {transaction.description || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatRWF(transaction.amount)}
                      </div>
                      {transaction.coverage > 0 && (
                        <div className="text-xs text-gray-500">
                          Coverage: {formatRWF(transaction.coverage)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Total: {formatRWF(transaction.totalPayable)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.reportedBy.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-teal-600 hover:text-teal-900 mr-4 p-1 rounded hover:bg-teal-50 transition-colors">
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
                      <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors">
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
        {filteredTransactions.length > 10 && (
          <Pagination
            currentPage={validPage}
            totalItems={filteredTransactions.length}
            itemsPerPage={10}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchTransactions();
          setPage(1); // Reset to first page after creating new transaction
        }}
      />
    </div>
  );
};

export default Transactions;
