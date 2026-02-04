import api from "../api";

export interface Insurance {
  id: string;
  name: string;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInsuranceRequest {
  name: string;
  percentage: number;
}
export interface UpdateInsuranceRequest {
  name?: string;
  percentage?: number;
}
export interface CreateInsuranceResponse {
  success: boolean;
  message: string;
  insurance: Insurance;
}

export interface GetInsuranceResponse {
  success: boolean;
  message: string;
  data: Insurance[];
}

export interface SubmitInsurancePaymentRequest {
  insuranceId: string;
  month: string; // Format: "YYYY-MM"
  year: number;
  monthNumber: number;
  actualPaidAmount: number;
  notes?: string;
}

export interface SubmitInsurancePaymentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    insuranceId: string;
    month: string;
    year: number;
    monthNumber: number;
    expectedAmount: number;
    actualPaidAmount: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface GetInsurancePaymentsResponse {
  success: boolean;
  message: string;
  data: Array<{
    insuranceId: string;
    insuranceName: string;
    month: string;
    monthDisplay: string;
    peopleReceived: number;
    expectedAmount: number;
    actualPaidAmount: number;
    difference: number;
  }>;
}

export const insuranceApi = {
  create: async (
    data: CreateInsuranceRequest,
  ): Promise<CreateInsuranceResponse> => {
    const response = await api.post("/insurance/create", data);
    return response.data;
  },

  getAll: async (): Promise<GetInsuranceResponse> => {
    const response = await api.get("/insurance");
    return response.data;
  },
  update: async (
    id: string,
    data: UpdateInsuranceRequest,
  ): Promise<{ success: boolean; message: string; insurance: Insurance }> => {
    const response = await api.put(`/insurance/update/${id}`, data);
    return response.data;
  },

  // Insurance Payment Methods
  submitPayment: async (
    data: SubmitInsurancePaymentRequest,
  ): Promise<SubmitInsurancePaymentResponse> => {
    const response = await api.post("/insurance/payments/submit", data);
    return response.data;
  },

  updatePayment: async (
    insuranceId: string,
    month: string,
    data: { actualPaidAmount: number; notes?: string },
  ): Promise<SubmitInsurancePaymentResponse> => {
    const response = await api.put(
      `/insurance/payments/${insuranceId}/${month}`,
      data,
    );
    return response.data;
  },

  getPayments: async (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number,
    insuranceId?: string,
  ): Promise<GetInsurancePaymentsResponse> => {
    const params: any = {
      fromYear,
      fromMonth,
      toYear,
      toMonth,
    };
    if (insuranceId) params.insuranceId = insuranceId;

    const response = await api.get("/insurance/payments", { params });
    return response.data;
  },
};
