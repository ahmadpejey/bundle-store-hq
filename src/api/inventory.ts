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
  // 1. Get Dashboard Stats
  getDashboardStats: async () => {
    try {
      if (!API_CONFIG.INVENTORY_URL) throw new Error("API URL missing");
      const res = await fetch(`${API_CONFIG.INVENTORY_URL}?action=getDashboard`);
      return await res.json();
    } catch (err) {
      handleApiError(err);
    }
  },

  // 2. Log Transaction
  logTransaction: async (payload: TransactionPayload) => {
    try {
      const res = await fetch(API_CONFIG.INVENTORY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      handleApiError(err);
    }
  },

  // 3. Get Bale Types (THIS WAS MISSING/BROKEN)
  getBaleTypes: async () => {
    try {
      const res = await fetch(`${API_CONFIG.INVENTORY_URL}?action=getBaleTypes`);
      return await res.json();
    } catch (err) {
      handleApiError(err);
    }
  }
};