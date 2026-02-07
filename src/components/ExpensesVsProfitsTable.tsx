import { useEffect, useState } from "react";
import { transactionApi } from "@/lib/api/transaction";
import { expenseApi } from "@/lib/api/expense";
import { formatRWF } from "@/lib/utils/currency";
import { AmountWithIndicator } from "@/components/AmountWithIndicator";

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

interface ExpensesVsProfitsTableProps {
  refreshTrigger?: number;
}

const ExpensesVsProfitsTable = ({ refreshTrigger }: ExpensesVsProfitsTableProps) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const [isLoading, setIsLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [availableForNextMonth, setAvailableForNextMonth] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Calculate current month date range
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        // Fetch transactions for current month
        const transactionsResponse = await transactionApi.getMonthlyReport(
          startDate.toISOString(),
          endDate.toISOString(),
        );

        // Calculate total revenue (sum of totalPayable from transactions)
        const revenue = transactionsResponse.data.reduce(
          (sum, transaction) => sum + Number(transaction.totalBilledAmount || 0),
          0,
        );

        // Fetch expenses
        const expensesResponse = await expenseApi.getAll();

        // Filter expenses for current month
        const currentMonthExpenses = expensesResponse.expenses.filter(
          (expense) => {
            const expenseDate = new Date(expense.expenseDate);
            return (
              expenseDate.getMonth() === currentMonth &&
              expenseDate.getFullYear() === currentYear
            );
          },
        );

        // Calculate total expenses
        const expenses = currentMonthExpenses.reduce(
          (sum, expense) => sum + Number(expense.amount || 0),
          0,
        );

        // Calculate available money for next month (profit - expenses)
        const available = revenue - expenses;

        setMonthlyRevenue(revenue);
        setMonthlyExpenses(expenses);
        setAvailableForNextMonth(available);
      } catch (error) {
        console.error("Failed to fetch expenses vs profits data:", error);
        setMonthlyRevenue(0);
        setMonthlyExpenses(0);
        setAvailableForNextMonth(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger, currentMonth, currentYear]);

  const profit = monthlyRevenue - monthlyExpenses;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          Expenses vs Profits - {MONTH_NAMES[currentMonth]} {currentYear}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Financial overview for current month
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
                    Net Profit
                  </div>
                  <div className="text-xs text-gray-500">
                    Revenue - Expenses
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div
                    className={`text-sm font-semibold ${
                      profit >= 0 ? "text-green-600" : ""
                    }`}
                  >
                    <AmountWithIndicator amount={profit} />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-teal-50 border-t-2 border-teal-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    Available for {MONTH_NAMES[nextMonth]} {nextMonthYear}
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
  );
};

export default ExpensesVsProfitsTable;

