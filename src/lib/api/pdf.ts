import api from "../api";

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
};
