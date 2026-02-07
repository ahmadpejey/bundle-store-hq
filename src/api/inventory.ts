import { supabase } from './supabaseClient';

// Helper to generate Receipt ID (e.g., RCP-240209-X82A)
const generateReceiptID = () => {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 Char Random
  return `RCP-${date}-${random}`;
};

export interface TransactionPayload {
  actionType: 'IN' | 'OUT' | 'SALE' | 'DISPOSE' | 'RESERVE' | 'DEBT';
  baleType: string;
  qty: number;
  salePrice: number;
  operator: string;
  remarks?: string;
  paymentMethod?: string;
  receiptNo?: string; // Optional: Linked Receipt ID
}

export const InventoryAPI = {
  
  // --- 1. CORE INVENTORY ---

  // Get All Items
  getFullInventory: async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('bale_type');
    if (error) throw error;
    return data || [];
  },

  // Add New Item
  addItem: async (name: string, cost: number, price: number, code: string, supplier: string) => {
    const { error } = await supabase
      .from('inventory')
      .insert([{ 
        bale_type: name, 
        quantity: 0, 
        cost_price: cost, 
        sale_price: price, 
        code: code, 
        supplier_mark: supplier 
      }]);
    if (error) throw error;
  },
  
  // Update Item Details
  updateItem: async (id: number, name: string, cost: number, price: number, qty: number, code: string, supplier: string) => {
    const { error } = await supabase
      .from('inventory')
      .update({ 
        bale_type: name, 
        cost_price: cost, 
        sale_price: price, 
        quantity: qty, 
        code: code, 
        supplier_mark: supplier 
      })
      .eq('id', id);
    if (error) throw error;
  },
  
  // Delete Item
  deleteItem: async (id: number) => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- 2. TRANSACTION LOGIC ---

  // Expose Receipt Generator to Frontend
  getNewReceiptID: () => generateReceiptID(),

  // Get List of Debtors (For Auto-Complete)
  getDebtors: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('remarks')
      .in('action_type', ['RESERVE', 'DEBT']); 
    
    if (error) return [];
    // Extract unique names from "Booking: Name" or "Hutang: Name"
    const uniqueNames = [...new Set(data.map(item => {
      const parts = item.remarks?.split(': ');
      return parts && parts.length > 1 ? parts[1] : item.remarks;
    }).filter(Boolean))];
    return uniqueNames;
  },

  // Log a New Transaction (Sale, Reserve, Debt, Stock In/Out)
  logTransaction: async (payload: TransactionPayload) => {
    // A. Fetch current Cost Price for accurate profit calculation
    const { data: itemData, error: itemError } = await supabase
      .from('inventory')
      .select('cost_price, quantity')
      .eq('bale_type', payload.baleType)
      .single();
    
    if (itemError) throw new Error("Item not found");

    const currentCost = itemData.cost_price || 0;
    const currentQty = itemData.quantity || 0;

    // B. Insert Transaction Record
    const { error: txError } = await supabase
      .from('transactions')
      .insert([{
        action_type: payload.actionType,
        bale_type: payload.baleType,
        qty: payload.qty,
        price: payload.salePrice,
        cost_price: currentCost,
        operator: payload.operator,
        remarks: payload.remarks,
        payment_method: payload.paymentMethod || 'CASH',
        receipt_no: payload.receiptNo // Store Receipt Number
      }]);
    
    if (txError) throw txError;

    // C. Update Stock Logic
    // IN = Add Stock
    // OUT, SALE, DISPOSE, RESERVE, DEBT = Deduct Stock
    const adjustment = payload.actionType === 'IN' ? payload.qty : -payload.qty;
    
    const { error: invError } = await supabase
      .from('inventory')
      .update({ quantity: currentQty + adjustment })
      .eq('bale_type', payload.baleType);

    if (invError) throw invError;
  },

  // --- 3. ACCOUNTING & SETTLEMENT ---

  // Get All Transactions
  getTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Get Transactions by Receipt ID (For Reprinting)
  getTransactionByReceipt: async (receiptNo: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('receipt_no', receiptNo);
    if (error) throw error;
    return data || [];
  },

  // Update Transaction (Edit Price/Remarks)
  updateTransaction: async (id: number, updates: { price?: number, remarks?: string }) => {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  // Settle Reservation / Debt (Convert to SALE)
  settleReservation: async (id: number, finalPrice: number, method: string) => {
    const newReceipt = generateReceiptID(); // Generate new receipt for the payment
    const { error } = await supabase
      .from('transactions')
      .update({ 
        action_type: 'SALE',
        price: finalPrice,
        payment_method: method,
        receipt_no: newReceipt,
        created_at: new Date().toISOString() // Update time to payment time
      })
      .eq('id', id);
    if (error) throw error;
  },

  // Delete Transaction (Void & Reverse Stock)
  deleteTransaction: async (id: number) => {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
    
    // Reverse Stock Logic
    // If deleted 'IN', remove stock.
    // If deleted 'SALE/OUT/RESERVE', return stock.
    const isStockIn = tx.action_type === 'IN';
    const reverseAdjustment = isStockIn ? -tx.qty : tx.qty;

    const { data: item } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('bale_type', tx.bale_type)
      .single();
      
    if (item) {
      await supabase
        .from('inventory')
        .update({ quantity: item.quantity + reverseAdjustment })
        .eq('bale_type', tx.bale_type);
    }
    
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 4. ANALYTICS ---

  getProfitAnalytics: async (startDate: string, endDate: string) => {
    const start = `${startDate}T00:00:00`;
    const end = `${endDate}T23:59:59`;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('action_type', 'SALE')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const grouped: Record<string, { revenue: number, profit: number, cost: number }> = {};

    data?.forEach(tx => {
      let label = tx.created_at.split('T')[0]; 
      if (!grouped[label]) grouped[label] = { revenue: 0, profit: 0, cost: 0 };

      const revenue = tx.price || 0;
      const totalCost = (tx.cost_price || 0) * tx.qty;
      
      grouped[label].revenue += revenue;
      grouped[label].cost += totalCost;
      grouped[label].profit += (revenue - totalCost);
    });

    return Object.keys(grouped).map(key => ({ name: key, ...grouped[key] }));
  }
};