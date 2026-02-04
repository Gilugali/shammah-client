import api from "../api";

export enum Expensetype {
  OPERATIONAL = "OPERATIONAL",
  CLINICAL = "CLINICAL",
}

export interface Expense {
  id: string;
  description: string;
  expenseDate: string;
  amount: number;
  type: Expensetype;
  reportedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  udpatedAt: string;
}

export interface ExpensesResponse {
  success: boolean;
  expenses: Expense[];
}

export interface CreateExpenseRequest {
  name: string;
  date: string;
  amount: number;
  type: Expensetype;
}

export interface UpdateExpenseRequest {
  name?: string;
  date?: string;
  amount?: number;
  type?: Expensetype;
}

export const expenseApi = {
  getAll: async (): Promise<ExpensesResponse> => {
    const response = await api.get("/expense/get");
    return response.data;
  },

  create: async (
    data: CreateExpenseRequest,
  ): Promise<{ success: boolean; message: string; expense: Expense }> => {
    const response = await api.post("/expense/create", data);
    return response.data;
  },
  update: async (
    id: string,
    data: UpdateExpenseRequest,
  ): Promise<{ success: boolean; message: string; updateExpense: Expense }> => {
    const response = await api.put(`/expense/update/${id}`, data);
    return response.data;
  },
};

