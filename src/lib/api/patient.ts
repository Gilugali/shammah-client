import api from "../api";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  dateOfBirth: string;
  nationalId: string;
  location: string | null;
  insuranceId?: string | null;
  insurance?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientsResponse {
  success: boolean;
  patients: Patient[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SearchPatientsResponse {
  success: boolean;
  data: Patient[];
}

export const patientApi = {
  getAll: async (page = 1, limit = 10): Promise<PatientsResponse> => {
    const response = await api.get("/patient/get-all", {
      params: { page, limit },
    });
    return response.data;
  },

  search: async (query: string): Promise<SearchPatientsResponse> => {
    const response = await api.get("/patient/search", {
      params: { q: query },
    });
    return response.data;
  },

  getById: async (
    id: string,
  ): Promise<{ success: boolean; patient: Patient }> => {
    const response = await api.get(`/patient/get/${id}`);
    return response.data;
  },

  create: async (data: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationalId: string;
    phoneNumber?: string;
    location?: string;
    insuranceId?: string;
  }): Promise<{ success: boolean; message: string; patient: Patient }> => {
    const response = await api.post("/patient/new", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phoneNumber: string;
      dateOfBirth: string;
      location: string;
    }>,
  ): Promise<{ success: boolean; message: string; patient: Patient }> => {
    const response = await api.put(`/patient/update/${id}`, data);
    return response.data;
  },
};
