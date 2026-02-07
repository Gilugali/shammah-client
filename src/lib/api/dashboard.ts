import api from '../api';

export interface DashboardResponse {
  success: boolean;
  data: {
    paidToday: string | number | null;
    insuranceExpectedAmount: string | number | null;
    patients: number; // This is transaction count, not total patients
    chart: Record<string, Record<string, number>>; // month -> insurance -> amount
    year: number;
  };
}

export interface FinancialSummaryResponse {
  success: boolean;
  message: string;
  data: {
    finalTotalRevenue: number;
    expectedTotalRevenue: number;
    expectedNetProfit: number;
    finalNetProfit: number;
    expenses: number;
    fromMonth: number;
    fromYear: number;
    toMonth: number;
    toYear: number;
  };
}

export interface MonthlyBarChart {
  month: string;
  revenue: number;
  totalExpense: number;
  profit: number;
}

export interface ProfitTrend {
  month: string;
  profit: number;
}

export interface ExpenseBreakdown {
  clinicalExpense?: number;
  operationalExpense?: number;
}

export interface FinancialSummaryChartsResponse {
  sucess: boolean; // Note: Backend has typo
  message: string;
  data: {
    monthlyComparison: MonthlyBarChart[];
    expenseTrackerBreakdown: ExpenseBreakdown[];
    profitTrend: ProfitTrend[];
  };
}

export const dashboardApi = {
  getCards: async (year?: number): Promise<DashboardResponse> => {
    const response = await api.get('/dashboard', {
      params: year ? { year } : {},
    });
    return response.data;
  },
  getFinancialSummary: async (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number,
  ): Promise<FinancialSummaryResponse> => {
    const response = await api.get('/dashboard/financial-summary', {
      params: {
        fromYear,
        fromMonth,
        toYear,
        toMonth,
      },
    });
    return response.data;
  },
  getFinancialSummaryCharts: async (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number,
  ): Promise<FinancialSummaryChartsResponse> => {
    const response = await api.get('/dashboard/charts-financial-summary', {
      params: {
        fromYear,
        fromMonth,
        toYear,
        toMonth,
      },
    });
    return response.data;
  },
  getCashInCharts: async (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number,
  ): Promise<FinancialSummaryChartsResponse> => {
    const response = await api.get('/dashboard/charts-cash-in', {
      params: {
        fromYear,
        fromMonth,
        toYear,
        toMonth,
      },
    });
    return response.data;
  },
};


