import api from '../api';

export interface DashboardResponse {
  success: boolean;
  data: {
    paidToday: string | number | null;
    coverage: string | number | null;
    patients: number; // This is transaction count, not total patients
    chart: Record<string, Record<string, number>>; // month -> insurance -> amount
    year: number;
  };
}

export const dashboardApi = {
  getCards: async (year?: number): Promise<DashboardResponse> => {
    const response = await api.get('/dashboard', {
      params: year ? { year } : {},
    });
    return response.data;
  },
};


