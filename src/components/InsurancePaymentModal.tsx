import { useState, useEffect } from "react";
import { insuranceApi, type Insurance } from "@/lib/api/insurance";
import { transactionApi } from "@/lib/api/transaction";
import { toast } from "sonner";

interface InsurancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  insuranceId?: string;
  month?: string; // Format: "YYYY-MM"
  year?: number;
  monthNumber?: number;
  expectedAmount?: number;
  actualPaidAmount?: number; // For editing existing records
  onSuccess: () => void;
}

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

const InsurancePaymentModal = ({
  isOpen,
  onClose,
  insuranceId: initialInsuranceId,
  year: initialYear,
  monthNumber: initialMonthNumber,
  expectedAmount: initialExpectedAmount,
  actualPaidAmount: initialActualPaidAmount,
  onSuccess,
}: InsurancePaymentModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [formData, setFormData] = useState({
    insuranceId: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    actualPaidAmount: "",
    notes: "",
  });

  // Fetch insurances
  useEffect(() => {
    const fetchInsurances = async () => {
      try {
        const response = await insuranceApi.getAll();
        setInsurances(response.data);
      } catch (error) {
        console.error("Failed to load insurances", error);
      }
    };
    if (isOpen) {
      fetchInsurances();
    }
  }, [isOpen]);

  // Initialize form data when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const currentYear = initialYear || new Date().getFullYear();
      const currentMonth = initialMonthNumber || new Date().getMonth() + 1;
      
      setFormData({
        insuranceId: initialInsuranceId || "",
        year: currentYear,
        month: currentMonth,
        actualPaidAmount: initialActualPaidAmount?.toString() || "",
        notes: "",
      });
    }
  }, [isOpen, initialInsuranceId, initialYear, initialMonthNumber, initialActualPaidAmount]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.insuranceId) {
      toast.error("Please select an insurance provider");
      return;
    }

    if (!formData.actualPaidAmount) {
      toast.error("Please enter the actual paid amount");
      return;
    }

    const actualPaid = parseFloat(formData.actualPaidAmount);
    if (isNaN(actualPaid) || actualPaid < 0) {
      toast.error("Actual paid amount must be a valid positive number");
      return;
    }

    setIsLoading(true);
    try {
      // Get date range for the month
      const startDate = new Date(formData.year, formData.month - 1, 1);
      const endDate = new Date(formData.year, formData.month, 0, 23, 59, 59, 999);
      
      // Fetch all transactions for this insurance and month
      const reportResponse = await transactionApi.getMonthlyReport(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      // Filter transactions for this insurance
      const insuranceTransactions = reportResponse.data.filter(
        (t) => t.insuranceId === formData.insuranceId
      );
      
      if (insuranceTransactions.length === 0) {
        toast.error("No transactions found for this insurance in the selected month");
        setIsLoading(false);
        return;
      }
      
      // Calculate total expected (sum of insuranceExpectedAmount)
      const totalExpected = insuranceTransactions.reduce(
        (sum, t) => sum + (Number(t.insuranceExpectedAmount) || 0),
        0
      );
      
      // Calculate ratio for proportional distribution
      const ratio = actualPaid / totalExpected;
      
      // Update each transaction proportionally
      const updatePromises = insuranceTransactions.map((transaction) => {
        const transactionActualPaid = (Number(transaction.insuranceExpectedAmount) || 0) * ratio;
        return transactionApi.updateActualPaid(transaction.id, transactionActualPaid);
      });
      
      await Promise.all(updatePromises);

      toast.success("Actual paid amounts updated successfully for all transactions");
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to save payment record";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 bg-opacity-10 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-semibold leading-6 text-gray-900"
                id="modal-title"
              >
                {initialActualPaidAmount !== undefined
                  ? "Update Payment Record"
                  : "Record Insurance Payment"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 sm:p-6">
            <div className="space-y-4">
              {/* Insurance Selection */}
              <div>
                <label
                  htmlFor="insuranceId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Insurance Provider <span className="text-red-500">*</span>
                </label>
                <select
                  id="insuranceId"
                  name="insuranceId"
                  required
                  value={formData.insuranceId}
                  onChange={handleChange}
                  disabled={!!initialInsuranceId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select insurance provider</option>
                  {insurances.map((insurance) => (
                    <option key={insurance.id} value={insurance.id}>
                      {insurance.name} ({insurance.percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Month and Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="month"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Month <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="month"
                    name="month"
                    required
                    value={formData.month}
                    onChange={handleChange}
                    disabled={!!initialMonthNumber}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {monthNames.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="year"
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    disabled={!!initialYear}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - i
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expected Amount (Read-only if provided) */}
              {initialExpectedAmount !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Amount
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700">
                    {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                      minimumFractionDigits: 0,
                    }).format(initialExpectedAmount)}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This is the total amount expected from insurance based on transactions
                  </p>
                </div>
              )}

              {/* Actual Paid Amount */}
              <div>
                <label
                  htmlFor="actualPaidAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Actual Paid Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="actualPaidAmount"
                  name="actualPaidAmount"
                  required
                  min="0"
                  step="0.01"
                  value={formData.actualPaidAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the actual amount received from the insurance provider
                </p>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes about this payment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? initialActualPaidAmount !== undefined
                    ? "Updating..."
                    : "Saving..."
                  : initialActualPaidAmount !== undefined
                    ? "Update Payment"
                    : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsurancePaymentModal;

