import { useState, useEffect } from "react";
import { transactionApi, type CreateTransactionRequest } from "@/lib/api/transaction";
import { patientApi, type Patient } from "@/lib/api/patient";
import { insuranceApi, type Insurance } from "@/lib/api/insurance";
import { toast } from "sonner";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
}: TransactionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatientInsurance, setSelectedPatientInsurance] = useState<Insurance | null>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    patientPaid: "",
    paymentMethod: "",
    description: "",
  });

  const paymentMethods = ["MOMO", "CASH", "NONE"];
  
  // Check if insurance covers 100%
  const isFullInsuranceCoverage = selectedPatientInsurance?.percentage === 100;

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      // Reset form when modal opens
      setFormData({
        patientId: "",
        patientPaid: "",
        paymentMethod: "",
        description: "",
      });
      setSearchQuery("");
      setShowPatientDropdown(false);
      setSelectedPatientInsurance(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = patients.filter(
        (patient) =>
          patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.nationalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.patient-dropdown-container')) {
        setShowPatientDropdown(false);
      }
    };

    if (showPatientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPatientDropdown]);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await patientApi.getAll(1, 1000); // Get all patients for dropdown
      setPatients(response.patients);
      setFilteredPatients(response.patients);
    } catch (error) {
      console.error("Failed to load patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientSelect = async (patient: Patient) => {
    setFormData((prev) => ({ ...prev, patientId: patient.id }));
    setSearchQuery(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);
    
    // Fetch insurance details if patient has insurance
    const insuranceId = patient.insuranceId || patient.insurance?.id;
    if (insuranceId) {
      try {
        // Fetch all insurances to find the one matching this patient
        const insurancesResponse = await insuranceApi.getAll();
        const insurance = insurancesResponse.data.find(
          (ins) => ins.id === insuranceId
        );
        if (insurance) {
          setSelectedPatientInsurance(insurance);
          // If 100% coverage, set default payment method and clear patientPaid
          if (insurance.percentage === 100) {
            setFormData((prev) => ({ 
              ...prev, 
              paymentMethod: "NONE",
              patientPaid: "" // Clear so user enters insurance amount
            }));
          } else {
            // Reset payment method for non-100% insurance
            setFormData((prev) => ({ ...prev, paymentMethod: "" }));
          }
        } else {
          setSelectedPatientInsurance(null);
        }
      } catch (error) {
        console.error("Failed to fetch insurance details:", error);
        setSelectedPatientInsurance(null);
      }
    } else {
      setSelectedPatientInsurance(null);
      // Reset payment method if no insurance
      setFormData((prev) => ({ ...prev, paymentMethod: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.patientId) {
      toast.error("Please select a patient");
      return;
    }

    if (!formData.patientPaid || parseFloat(formData.patientPaid) <= 0) {
      toast.error("Please enter a valid amount paid by patient");
      return;
    }

    // For 100% insurance, payment method is auto-set, so skip validation
    if (!isFullInsuranceCoverage && !formData.paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsLoading(true);
    try {
      // For 100% insurance coverage, patientPaid should be the total amount (what insurance pays)
      // Backend will handle: if patientPaid = totalAmount, then patient actually pays 0
      const requestData: CreateTransactionRequest = {
        patientId: formData.patientId,
        patientPaid: parseFloat(formData.patientPaid),
        // For 100% insurance, use payment method NONE to indicate no direct patient payment
        paymentMethod: isFullInsuranceCoverage ? (formData.paymentMethod || "NONE") : formData.paymentMethod,
        description: formData.description || undefined,
      };

      await transactionApi.create(requestData);
      toast.success("Transaction created successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create transaction";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === formData.patientId);

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
                Create New Transaction
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
              {/* Patient Selection */}
              <div className="relative patient-dropdown-container">
                <label
                  htmlFor="patient"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Patient <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="patient"
                    placeholder="Search patient by name, ID, or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowPatientDropdown(true);
                      if (!e.target.value) {
                        setFormData((prev) => ({ ...prev, patientId: "" }));
                      }
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {loadingPatients && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                    </div>
                  )}
                </div>
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.nationalId}
                          {patient.phoneNumber && ` • ${patient.phoneNumber}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div className="mt-2 p-2 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-sm font-medium text-teal-900">
                      Selected: {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    {selectedPatientInsurance && (
                      <p className="text-xs text-teal-700 mt-1">
                        Insurance: {selectedPatientInsurance.name} ({selectedPatientInsurance.percentage}% coverage)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Amount Input - Changes based on insurance coverage */}
              <div>
                <label
                  htmlFor="patientPaid"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {isFullInsuranceCoverage ? (
                    <>
                      Insurance Will Pay (RWF) <span className="text-red-500">*</span>
                    </>
                  ) : (
                    <>
                      Amount Paid by Patient (RWF) <span className="text-red-500">*</span>
                    </>
                  )}
                </label>
                <input
                  type="number"
                  id="patientPaid"
                  name="patientPaid"
                  required
                  min="0"
                  step="0.01"
                  value={formData.patientPaid}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {isFullInsuranceCoverage ? (
                    <>
                      The total amount that insurance will cover. Patient pays nothing.
                    </>
                  ) : (
                    <>
                      The amount the patient is paying. Insurance coverage will be calculated automatically.
                    </>
                  )}
                </p>
                {isFullInsuranceCoverage && selectedPatientInsurance && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">{selectedPatientInsurance.name}</span> covers 100% of expenses. 
                      Patient will not pay anything.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method - Hidden for 100% insurance coverage */}
              {!isFullInsuranceCoverage && (
                <div>
                  <label
                    htmlFor="paymentMethod"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    required
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isFullInsuranceCoverage && (
                <div className="hidden">
                  {/* Hidden input to ensure paymentMethod is sent to backend */}
                  <input
                    type="hidden"
                    name="paymentMethod"
                    value={formData.paymentMethod || "NONE"}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any additional notes or description..."
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
                {isLoading ? "Creating..." : "Create Transaction"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;

