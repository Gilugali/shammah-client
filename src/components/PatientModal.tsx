import { useState, useEffect } from "react";
import { patientApi, type Patient } from "@/lib/api/patient";
import { insuranceApi, type Insurance } from "@/lib/api/insurance";
import { toast } from "sonner";

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSuccess: () => void;
}

const PatientModal = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: PatientModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loadingInsurances, setLoadingInsurances] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    dateOfBirth: "",
    phoneNumber: "",
    location: "",
    insuranceId: "",
  });

  useEffect(() => {
    if (isOpen) {
      // Load insurances when modal opens
      loadInsurances();

      // If editing, populate form with patient data
      if (patient) {
        setFormData({
          firstName: patient.firstName || "",
          lastName: patient.lastName || "",
          nationalId: patient.nationalId || "",
          dateOfBirth: patient.dateOfBirth
            ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
            : "",
          phoneNumber: patient.phoneNumber || "",
          location: patient.location || "",
          insuranceId: "", // Insurance ID is not in the Patient interface, will need to be fetched separately
        });
      } else {
        // Reset form for new patient
        setFormData({
          firstName: "",
          lastName: "",
          nationalId: "",
          dateOfBirth: "",
          phoneNumber: "",
          location: "",
          insuranceId: "",
        });
      }
    }
  }, [isOpen, patient]);

  const loadInsurances = async () => {
    try {
      setLoadingInsurances(true);
      const response = await insuranceApi.getAll();
      setInsurances(response.data);
    } catch (error) {
      console.error("Failed to load insurances:", error);
      toast.error("Failed to load insurances");
    } finally {
      setLoadingInsurances(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.nationalId) {
      toast.error(
        "Please fill in all required fields (First Name, Last Name, National ID)",
      );
      return;
    }

    if (!patient && !formData.insuranceId) {
      toast.error("Please select an insurance");
      return;
    }

    setIsLoading(true);
    try {
      if (patient) {
        // Update patient
        const updateData: any = {};
        if (formData.firstName) updateData.firstName = formData.firstName;
        if (formData.lastName) updateData.lastName = formData.lastName;
        if (formData.phoneNumber) updateData.phoneNumber = formData.phoneNumber;
        if (formData.dateOfBirth)
          updateData.dateOfBirth = new Date(formData.dateOfBirth).toISOString();
        if (formData.location) updateData.location = formData.location;

        await patientApi.update(patient.id, updateData);
        toast.success("Patient updated successfully");
      } else {
        // Create new patient
        await patientApi.create({
          firstName: formData.firstName,
          lastName: formData.lastName,
          nationalId: formData.nationalId,
          dateOfBirth: formData.dateOfBirth
            ? new Date(formData.dateOfBirth).toISOString()
            : undefined,
          phoneNumber: formData.phoneNumber || undefined,
          location: formData.location || undefined,
          insuranceId: formData.insuranceId,
        });
        toast.success("Patient created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to save patient";
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
                {patient ? "Edit Patient" : "Add New Patient"}
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
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* National ID */}
              <div>
                <label
                  htmlFor="nationalId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  National ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nationalId"
                  name="nationalId"
                  required
                  disabled={!!patient} // Can't edit national ID
                  value={formData.nationalId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Insurance (only for new patients) */}
              {!patient && (
                <div>
                  <label
                    htmlFor="insuranceId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Insurance <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="insuranceId"
                    name="insuranceId"
                    required
                    value={formData.insuranceId}
                    onChange={handleChange}
                    disabled={loadingInsurances}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select an insurance</option>
                    {insurances.map((insurance) => (
                      <option key={insurance.id} value={insurance.id}>
                        {insurance.name} ({insurance.percentage}%)
                      </option>
                    ))}
                  </select>
                  {loadingInsurances && (
                    <p className="mt-1 text-xs text-gray-500">
                      Loading insurances...
                    </p>
                  )}
                </div>
              )}
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
                {isLoading ? "Saving..." : patient ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientModal;
