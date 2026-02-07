import api from "../api";

export interface IInsurance {
  name: string;
  amount: number;
  patients: number;
}

export interface IMomo {
  patients: number;
  totalAmount: number;
}

export interface ICash {
  patients: number;
  totalAmount: number;
}

export interface IReport {
  month: string;
  insurances: IInsurance[];
  totalMomo: IMomo;
  totalcash: ICash;
  totalMomoAndCash: number;
  grossTotal: number;
  totalMomoAndInsuranceAndCash: number;
  totalExpense: number;
}

export interface IRangeReportResponse {
  success: boolean;
  data: {
    reports: IReport[];
  };
  totalPatients: number;
}

export const pdfApi = {
  downloadDailyReport: async (): Promise<void> => {
    try {
      const response = await api.get("/pdf/reports/daily", {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.message || "Failed to download PDF");
      }

      // Success - we have a PDF blob
      const blob = response.data;

      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Shammah-Health-Daily-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        const contentType = error.response.headers["content-type"] || "";
        if (contentType.includes("application/json")) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || "Failed to download PDF");
          } catch (parseError) {
            throw new Error("Failed to download PDF");
          }
        }
      }
      if (error.message) {
        throw error;
      }
      throw new Error("Failed to download PDF");
    }
  },

  getRangeReports: async (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number
  ): Promise<IRangeReportResponse> => {
    const response = await api.get("/pdf/reports/range", {
      params: {
        fromYear,
        fromMonth,
        toYear,
        toMonth,
      },
    });
    return response.data;
  },

  downloadRangeReportPDF: async (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number
  ): Promise<void> => {
    try {
      const response = await api.get("/pdf/reports/range/pdf", {
        params: {
          fromYear,
          fromMonth,
          toYear,
          toMonth,
        },
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.message || "Failed to download PDF");
      }

      // Success - we have a PDF blob
      const blob = response.data;

      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Generate filename based on date range
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const fromMonthName = monthNames[fromMonth - 1];
      const toMonthName = monthNames[toMonth - 1];
      const filename = fromYear === toYear && fromMonth === toMonth
        ? `Financial-Report-${fromMonthName}-${fromYear}.pdf`
        : `Financial-Report-${fromMonthName}-${fromYear}-to-${toMonthName}-${toYear}.pdf`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        const contentType = error.response.headers["content-type"] || "";
        if (contentType.includes("application/json")) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || "Failed to download PDF");
          } catch (parseError) {
            throw new Error("Failed to download PDF");
          }
        }
      }
      if (error.message) {
        throw error;
      }
      throw new Error("Failed to download PDF");
    }
  },
};
