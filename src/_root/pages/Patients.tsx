import { useState, useEffect, useMemo } from "react";
import { patientApi, type Patient } from "@/lib/api/patient";
import { insuranceApi, type Insurance } from "@/lib/api/insurance";
import { toast } from "sonner";
import PatientModal from "@/components/PatientModal";
import { Pagination } from "@/components/shared/Pagination";
import FilterBar, { type DateRangeFilter } from "@/components/shared/FilterBar";
import { useAuth } from "@/context/AuthContext";
import { canEdit, isowner } from "@/lib/types/role";
import { SummaryCards } from "@/components/shared/SummaryCards";

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsurances, setIsLoadingInsurances] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [insuranceFilter, setInsuranceFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({});
  
  const userCanEdit = canEdit(user?.role);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await patientApi.getAll(1, 1000); // Get all for filtering (always use page 1)
      setAllPatients(response.patients);
      setTotal(response.meta.total);
    } catch (error) {
      toast.error("Failed to load patients");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInsurances = async () => {
    try {
      setIsLoadingInsurances(true);
      const response = await insuranceApi.getAll();
      setInsurances(response.data);
    } catch (error) {
      console.error("Failed to load insurances:", error);
    } finally {
      setIsLoadingInsurances(false);
    }
  };

  useEffect(() => {
    fetchInsurances();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [insuranceFilter, dateRangeFilter.startDate, dateRangeFilter.endDate]);

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      fetchPatients();
      return;
    }

    try {
      setIsLoading(true);
      const response = await patientApi.search(searchQuery);
      setPatients(response.data);
      setTotal(response.data.length);
    } catch (error) {
      toast.error("Failed to search patients");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []); // Only fetch once on mount, pagination is client-side

  // useEffect(() => {
  //   const debounceTimer = setTimeout(() => {
  //     if (searchQuery.trim()) {
  //       searchPatients();
  //     } else {
  //       fetchPatients();
  //     }
  //   }, 300);

  //   return () => clearTimeout(debounceTimer);
  // }, [searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Filter patients
  const filteredPatients = useMemo(() => {
    let filtered = searchQuery
      ? allPatients.filter(
          (p) =>
            `${p.firstName} ${p.lastName}`
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            p.nationalId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : [...allPatients];

    // Filter by insurance
    if (insuranceFilter) {
      filtered = filtered.filter((p) => p.insuranceId === insuranceFilter);
    }

    // Filter by date range (created date)
    if (dateRangeFilter.startDate || dateRangeFilter.endDate) {
      filtered = filtered.filter((p) => {
        const createdDate = new Date(p.createdAt);
        if (dateRangeFilter.startDate) {
          const startDate = new Date(dateRangeFilter.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (createdDate < startDate) return false;
        }
        if (dateRangeFilter.endDate) {
          const endDate = new Date(dateRangeFilter.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (createdDate > endDate) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [allPatients, searchQuery, insuranceFilter, dateRangeFilter]);

  // Calculate total pages and ensure page is valid
  const totalPages = Math.ceil(filteredPatients.length / 10);
  const validPage = Math.min(page, Math.max(1, totalPages || 1));
  
  // Update page if it's invalid (only when filters change, not on every render)
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages]); // Only depend on totalPages, not page

  const paginatedPatients = filteredPatients.slice(
    (validPage - 1) * 10,
    validPage * 10,
  );

  const handleClearFilters = () => {
    setInsuranceFilter("");
    setDateRangeFilter({});
    setPage(1);
  };

  const handleOpenModal = (patient?: Patient) => {
    setEditingPatient(patient || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleModalSuccess = () => {
    fetchPatients();
  };

  // Calculate summary statistics for owners
  const summaryStats = useMemo(() => {
    if (!user?.role || !isowner(user.role)) return null;

    const totalPatients = allPatients.length;
    
    // With Insurance = all insurances EXCEPT private
    const patientsWithInsurance = allPatients.filter((p) => {
      if (!p.insurance || !p.insurance.name) return false;
      return p.insurance.name.toLowerCase() !== "private";
    }).length;
    
    // Without Insurance = patients with private insurance
    const patientsWithPrivate = allPatients.filter((p) => {
      if (!p.insurance || !p.insurance.name) return false;
      return p.insurance.name.toLowerCase() === "private";
    }).length;

    return {
      totalPatients,
      patientsWithInsurance,
      patientsWithPrivate,
    };
  }, [allPatients, user?.role]);

  const summaryCards = summaryStats
    ? [
        {
          title: "Total Patients",
          value: summaryStats.totalPatients,
          icon: (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ),
          color: "text-blue-600",
        },
        {
          title: "With Insurance",
          value: summaryStats.patientsWithInsurance,
          icon: (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          ),
          color: "text-green-600",
        },
        {
          title: "Private Insurance",
          value: summaryStats.patientsWithPrivate,
          icon: (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          ),
          color: "text-yellow-600",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1 font-normal">
            Manage patient information
          </p>
        </div>
        {userCanEdit && (
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
            Add Patient
          </button>
        )}
      </div>

      {/* Summary Cards for Owners */}
      {user?.role && isowner(user.role) && (
        <SummaryCards cards={summaryCards} isLoading={isLoading} />
      )}

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
          placeholder="Search patients by name or phone..."
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
            label: "Insurance",
            options: [
              { value: "", label: "All Insurances" },
              ...insurances.map((ins) => ({
                value: ins.id,
                label: ins.name,
              })),
            ],
            value: insuranceFilter,
            onChange: (value) => {
              setInsuranceFilter(value);
              setPage(1);
            },
          },
          dateRange: {
            label: "Created Date Range",
            value: dateRangeFilter,
            onChange: (range) => {
              setDateRangeFilter(range);
              setPage(1);
            },
          },
        }}
        onClear={handleClearFilters}
      />

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading patients...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No patients found</p>
            <button
              onClick={() => handleOpenModal()}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Add your first patient
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
                    National ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Insurance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.nationalId || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.insurance ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {patient.insurance.name}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.phoneNumber || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.dateOfBirth
                          ? formatDate(patient.dateOfBirth)
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.createdBy?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm  font-medium">
                      {userCanEdit && (
                        <button
                          onClick={() => handleOpenModal(patient)}
                          className="text-teal-600 hover:text-teal-900 mr-4 p-1 rounded hover:bg-teal-50 transition-colors"
                          title="Edit patient"
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
                      )}
                      {!userCanEdit && (
                        <span className="text-gray-400 text-xs">Read-only</span>
                      )}
                      {/* <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors" title="Delete patient">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredPatients.length > 10 && (
          <Pagination
            currentPage={validPage}
            totalItems={filteredPatients.length}
            itemsPerPage={10}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Patient Modal */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        patient={editingPatient}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Patients;
