import api from "../api";

export interface Transaction {
  id: string;
  amount: number;
  coverage: number;
  totalPayable: number;
  description: string | null;
  paymentMethod: string;
  reportedBy: {
    name: string;
  };
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTransactionRequest {
  patientPaid: number;
  paymentMethod: string;
  description?: string;
  patientId: string;
}

export interface CreateTransactionResponse {
  success: boolean;
  message: string;
  transaction: Transaction;
}

export interface GetAllTransactionsResponse {
  succes: boolean; // Note: Backend has typo, keeping to match actual response
  message: string;
  transactions: Transaction[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SearchTransactionsResponse {
  success: boolean;
  data: Transaction[];
}

export interface TodayTransactionsResponse {
  success: boolean;
  message: string;
  data: {
    transactions: Array<{
      amount: number;
      coverage: number;
      description: string | null;
      patient: {
        phoneNumber: string | null;
        firstName: string;
        lastName: string;
      };
      reportedBy: {
        name: string;
        phoneNumber: string | null;
      };
    }>;
    totalPaidToday: number;
    insurance: number | null;
    count: number;
    insuranceCount: Array<{
      insuranceId: string;
      insuranceName: string | undefined;
      transactionCount: number;
    }>;
  };
}

export interface MonthlyReportTransaction {
  id: string;
  insuranceId: string | null;
  coverage: number;
  amount: number;
  totalPayable: number;
  actualPaid: number | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface GetMonthlyReportResponse {
  success: boolean;
  message: string;
  data: MonthlyReportTransaction[];
}

export const transactionApi = {
  create: async (
    data: CreateTransactionRequest,
  ): Promise<CreateTransactionResponse> => {
    const response = await api.post("/transactions/create", data);
    return response.data;
  },

  getAll: async (page = 1, limit = 10): Promise<GetAllTransactionsResponse> => {
    // Note: Backend currently doesn't support pagination, but we pass params for future compatibility
    const response = await api.get("/transactions/get-all", {
      params: { page, limit },
    });
    return response.data;
  },

  search: async (query: string): Promise<SearchTransactionsResponse> => {
    // Note: Backend doesn't have search endpoint, so we filter client-side
    // This still fetches all transactions - backend search endpoint would be better
    const allResponse = await api.get("/transactions/get-all", {
      params: { page: 1, limit: 1000 }, // Request large limit for search
    });
    const allTransactions = allResponse.data.transactions || [];
    const filtered = allTransactions.filter(
      (t: Transaction) =>
        t.description?.toLowerCase().includes(query.toLowerCase()) ||
        t.paymentMethod?.toLowerCase().includes(query.toLowerCase()) ||
        `${t.patient.firstName} ${t.patient.lastName}`.toLowerCase().includes(query.toLowerCase()),
    );
    return {
      success: true,
      data: filtered,
    };
  },

  getToday: async (): Promise<TodayTransactionsResponse> => {
    const response = await api.get("/transactions/get-today");
    return response.data;
  },

  getMonthlyReport: async (
    start: string,
    end: string
  ): Promise<GetMonthlyReportResponse> => {
    const response = await api.post("/transactions/get-monthly-report", {
      start,
      end,
    });
    return response.data;
  },

  updateActualPaid: async (
    transactionId: string,
    actualPaid: number,
  ): Promise<{ success: boolean; message: string; transaction: any }> => {
    const response = await api.put(`/transactions/insurance-paid/${transactionId}`, {
      actualPaid,
    });
    return response.data;
  },
};
