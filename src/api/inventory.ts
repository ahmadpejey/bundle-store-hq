import { API_CONFIG, handleApiError } from './config';

export interface TransactionPayload {
  actionType: 'IN' | 'OUT' | 'SALE' | 'DISPOSE';
  baleType: string;
  qty: number;
  price: number;
  operator: 'Saiful' | 'Syamsul' | 'Ramadan';
  remarks?: string;
}

export const InventoryAPI = {
  getDashboardStats: async () => {
    try {
      if (!API_CONFIG.INVENTORY_URL) throw new Error("API URL missing");
      const res = await fetch(`${API_CONFIG.INVENTORY_URL}?action=getDashboard`);
      return await res.json();
    } catch (err) {
      handleApiError(err);
    }
  },

  logTransaction: async (payload: TransactionPayload) => {
    try {
      const res = await fetch(API_CONFIG.INVENTORY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 'text/plain' prevents CORS preflight on GAS
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      handleApiError(err);
    }
  }
};