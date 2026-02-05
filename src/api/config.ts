export const API_CONFIG = {
  INVENTORY_URL: import.meta.env.VITE_GOOGLE_SCRIPT_INVENTORY_URL as string,
  ACCOUNTING_URL: import.meta.env.VITE_GOOGLE_SCRIPT_ACCOUNTING_URL as string,
};

export const handleApiError = (error: unknown) => {
  console.error("API Error:", error);
  // In production, we would log this to a monitoring service
  throw new Error("System communication failed.");
};