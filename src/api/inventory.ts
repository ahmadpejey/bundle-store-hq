import { supabase } from './supabaseClient';

// Helper: Generate Sequential Receipt ID (SFB-MMYY-0001)
const generateNextReceiptID = async () => {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const prefix = `SFB-${month}${year}-`;

  // Fetch the last transaction that matches the current month's prefix
  const { data, error } = await supabase
    .from('transactions')
    .select('receipt_no')
    .ilike('receipt_no', `${prefix}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let nextSequence = 1;

  if (data && data.receipt_no) {
    const parts = data.receipt_no.split('-');
    const lastNum = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  return `${prefix}${nextSequence.toString().padStart(4, '0')}`;
};

export interface TransactionPayload {
  actionType: 'IN' | 'OUT' | 'SALE' | 'DISPOSE' | 'RESERVE' | 'DEBT';
  baleType: string;
  qty: number;
  salePrice: number;
  operator: string;
  remarks?: string;
  paymentMethod?: string;
  receiptNo?: string; 
}

export const InventoryAPI = {
  
  // --- 1. CORE INVENTORY ---
  getFullInventory: async () => {
    const { data, error } = await supabase.from('inventory').select('*').order('bale_type');
    if (error) throw error;
    return data || [];
  },

  addItem: async (name: string, cost: number, price: number, code: string, supplier: string) => {
    const { error } = await supabase.from('inventory').insert([{ bale_type: name, quantity: 0, cost_price: cost, sale_price: price, code: code, supplier_mark: supplier }]);
    if (error) throw error;
  },
  
  updateItem: async (id: number, name: string, cost: number, price: number, qty: number, code: string, supplier: string) => {
    const { error } = await supabase.from('inventory').update({ bale_type: name, cost_price: cost, sale_price: price, quantity: qty, code: code, supplier_mark: supplier }).eq('id', id);
    if (error) throw error;
  },
  
  deleteItem: async (id: number) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 2. TRANSACTION LOGIC ---
  // Now Async to check DB for last sequence
  getNewReceiptID: async () => {
    return await generateNextReceiptID();
  },

  getDebtors: async () => {
    const { data, error } = await supabase.from('transactions').select('remarks').in('action_type', ['RESERVE', 'DEBT']); 
    if (error) return [];
    const uniqueNames = [...new Set(data.map(item => {
      // Extract Clean Name
      const parts = item.remarks?.split(': ');
      if (parts && parts.length > 1) {
         // Handle "Delivery: Name - 012... - Addr"
         const subParts = parts[1].split(','); 
         return subParts[0].trim();
      }
      return null;
    }).filter(Boolean))];
    return uniqueNames;
  },

  logTransaction: async (payload: TransactionPayload) => {
    const { data: itemData, error: itemError } = await supabase.from('inventory').select('cost_price, quantity').eq('bale_type', payload.baleType).single();
    if (itemError) throw new Error("Item not found");

    const currentCost = itemData.cost_price || 0;
    const currentQty = itemData.quantity || 0;

    const { error: txError } = await supabase.from('transactions').insert([{
        action_type: payload.actionType,
        bale_type: payload.baleType,
        qty: payload.qty,
        price: payload.salePrice,
        cost_price: currentCost,
        operator: payload.operator,
        remarks: payload.remarks,
        payment_method: payload.paymentMethod || 'CASH',
        receipt_no: payload.receiptNo
      }]);
    
    if (txError) throw txError;

    const adjustment = payload.actionType === 'IN' ? payload.qty : -payload.qty;
    const { error: invError } = await supabase.from('inventory').update({ quantity: currentQty + adjustment }).eq('bale_type', payload.baleType);
    if (invError) throw invError;
  },

  // --- 3. ACCOUNTING & STATS ---
  getTransactions: async () => {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getQuickStats: async () => {
    const { data, error } = await supabase.from('transactions').select('action_type, qty');
    if (error) return { reserved: 0, sold: 0 };
    
    const reserved = data.filter(t => t.action_type === 'RESERVE').reduce((acc, t) => acc + t.qty, 0);
    const sold = data.filter(t => t.action_type === 'SALE').reduce((acc, t) => acc + t.qty, 0);
    
    return { reserved, sold };
  },

  updateTransaction: async (id: number, updates: { price?: number, remarks?: string }) => {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (error) throw error;
  },

  settleReservation: async (id: number, finalPrice: number, method: string) => {
    const newReceipt = await generateNextReceiptID(); // Generate sequential ID for settlement
    const { error } = await supabase.from('transactions').update({ 
        action_type: 'SALE',
        price: finalPrice,
        payment_method: method,
        receipt_no: newReceipt,
        created_at: new Date().toISOString()
      }).eq('id', id);
    if (error) throw error;
  },

  deleteTransaction: async (id: number) => {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
    const isStockIn = tx.action_type === 'IN';
    const reverseAdjustment = isStockIn ? -tx.qty : tx.qty;
    const { data: item } = await supabase.from('inventory').select('quantity').eq('bale_type', tx.bale_type).single(); 
    if (item) {
      await supabase.from('inventory').update({ quantity: item.quantity + reverseAdjustment }).eq('bale_type', tx.bale_type);
    }
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  getProfitAnalytics: async (startDate: string, endDate: string) => {
    const start = `${startDate}T00:00:00`;
    const end = `${endDate}T23:59:59`;
    const { data, error } = await supabase.from('transactions').select('*').eq('action_type', 'SALE').gte('created_at', start).lte('created_at', end).order('created_at', { ascending: true });
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