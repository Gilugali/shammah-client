import { useState, useEffect } from "react";
import {
  insuranceApi,
  type Insurance,
  type CreateInsuranceRequest,
  type UpdateInsuranceRequest,
} from "@/lib/api/insurance";
import { toast } from "sonner";

interface InsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  insurance?: Insurance | null;
  onSuccess: () => void;
}

const InsuranceModal = ({
  isOpen,
  onClose,
  insurance,
  onSuccess,
}: InsuranceModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    percentage: "",
  });

  useEffect(() => {
    if (isOpen) {
      // If editing, populate form with insurance data
      if (insurance) {
        setFormData({
          name: insurance.name || "",
          percentage: insurance.percentage?.toString() || "",
        });
      } else {
        // Reset form for new insurance
        setFormData({
          name: "",
          percentage: "",
        });
      }
    }
  }, [isOpen, insurance]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.percentage) {
      toast.error("Please fill in all required fields");
      return;
    }

    const percentage = parseFloat(formData.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error("Percentage must be a number between 0 and 100");
      return;
    }

    setIsLoading(true);
    try {
      if (insurance) {
        // Update insurance
        const updateData: UpdateInsuranceRequest = {};
        if (formData.name !== insurance.name) {
          updateData.name = formData.name;
        }
        if (percentage !== insurance.percentage) {
          updateData.percentage = percentage;
        }

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
          await insuranceApi.update(insurance.id, updateData);
          toast.success("Insurance updated successfully");
          onSuccess();
          onClose();
        } else {
          toast.info("No changes to save");
          setIsLoading(false);
        }
      } else {
        // Create new insurance
        const requestData: CreateInsuranceRequest = {
          name: formData.name,
          percentage: percentage,
        };

        await insuranceApi.create(requestData);
        toast.success("Insurance created successfully");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to save insurance";
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
                {insurance ? "Edit Insurance" : "Add New Insurance"}
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
              {/* Insurance Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Insurance Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., RAMA, RSSB, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Percentage */}
              <div>
                <label
                  htmlFor="percentage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Coverage Percentage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="percentage"
                    name="percentage"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.percentage}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the percentage of coverage (0-100). This determines how much the insurance will cover.
                </p>
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
                  ? insurance
                    ? "Updating..."
                    : "Creating..."
                  : insurance
                    ? "Update Insurance"
                    : "Create Insurance"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsuranceModal;

