import { useState, useEffect, useMemo } from "react";
import { expenseApi, type Expense, Expensetype } from "@/lib/api/expense";
import { formatRWF } from "@/lib/utils/currency";
import { toast } from "sonner";
import ExpenseModal from "@/components/ExpenseModal";
import SalaryExpenseModal from "@/components/SalaryExpenseModal";
import { Pagination } from "@/components/shared/Pagination";
import FilterBar, { type DateRangeFilter } from "@/components/shared/FilterBar";

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({});

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await expenseApi.getAll();
      setExpenses(response.expenses);
    } catch (error) {
      toast.error("Failed to load expenses");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(
        (expense) => expense.type === typeFilter.toUpperCase(),
      );
    }

    // Filter by date range
    if (dateRangeFilter.startDate || dateRangeFilter.endDate) {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.expenseDate);
        if (dateRangeFilter.startDate) {
          const startDate = new Date(dateRangeFilter.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (expenseDate < startDate) return false;
        }
        if (dateRangeFilter.endDate) {
          const endDate = new Date(dateRangeFilter.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (expenseDate > endDate) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [expenses, typeFilter, dateRangeFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, dateRangeFilter.startDate, dateRangeFilter.endDate]);

  // Calculate total pages and ensure page is valid
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const validPage = Math.min(page, Math.max(1, totalPages || 1));
  
  // Update page if it's invalid
  useEffect(() => {
    if (page !== validPage && totalPages > 0) {
      setPage(validPage);
    }
  }, [page, validPage, totalPages]);

  const paginatedExpenses = filteredExpenses.slice(
    (validPage - 1) * itemsPerPage,
    validPage * itemsPerPage,
  );

  const handleClearFilters = () => {
    setTypeFilter("");
    setDateRangeFilter({});
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1 font-normal">
            Manage clinic expenses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSalaryModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10c1.11 0 2.08.402 2.599 1M12 8V7m0 1v10m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Add Salaries
          </button>
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
            Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={{
          type: {
            label: "Expense Type",
            options: [
              { value: "", label: "All Types" },
              { value: Expensetype.OPERATIONAL, label: "Operational" },
              { value: Expensetype.CLINICAL, label: "Clinical" },
            ],
            value: typeFilter,
            onChange: (value) => {
              setTypeFilter(value);
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No expenses found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expense Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                          {expense.type.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(expense.expenseDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatRWF(expense.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {expense.reportedBy?.name || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredExpenses.length > itemsPerPage && (
              <Pagination
                currentPage={validPage}
                totalItems={filteredExpenses.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
      />

      <SalaryExpenseModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        onSuccess={fetchExpenses}
      />
    </div>
  );
};

export default Expenses;
