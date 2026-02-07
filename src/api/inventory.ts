import { supabase } from './supabaseClient';

export interface TransactionPayload {
  actionType: 'IN' | 'OUT' | 'SALE' | 'DISPOSE';
  baleType: string;
  qty: number;
  salePrice: number; // Renamed for clarity
  operator: string;
  remarks?: string;
}

export const InventoryAPI = {
  // 1. GET ALL ITEMS (POS & Inventory)
  getFullInventory: async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('bale_type');
    if (error) throw error;
    return data || [];
  },

  // 2. LOG TRANSACTION (Now tracks Profit!)
  logTransaction: async (payload: TransactionPayload) => {
    // A. Fetch the item to get its current COST price
    const { data: itemData, error: itemError } = await supabase
      .from('inventory')
      .select('cost_price, quantity')
      .eq('bale_type', payload.baleType)
      .single();
    
    if (itemError) throw new Error("Item not found");

    const currentCost = itemData.cost_price || 0;
    const currentQty = itemData.quantity || 0;

    // B. Record the Transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert([{
        action_type: payload.actionType,
        bale_type: payload.baleType,
        qty: payload.qty,
        price: payload.salePrice, // The price you sold it for
        cost_price: currentCost,  // The price you bought it for (Profit = Price - Cost)
        operator: payload.operator,
        remarks: payload.remarks
      }]);
    
    if (txError) throw txError;

    // C. Update Inventory Qty
    const adjustment = payload.actionType === 'IN' ? payload.qty : -payload.qty;
    const { error: invError } = await supabase
      .from('inventory')
      .update({ quantity: currentQty + adjustment })
      .eq('bale_type', payload.baleType);

    if (invError) throw invError;
  },

  // 3. ADMIN: ADD / EDIT / DELETE
  addItem: async (name: string, cost: number, price: number) => {
    const { error } = await supabase.from('inventory').insert([{ bale_type: name, quantity: 0, cost_price: cost, sale_price: price }]);
    if (error) throw error;
  },
  updateItem: async (id: number, name: string, cost: number, price: number) => {
    const { error } = await supabase.from('inventory').update({ bale_type: name, cost_price: cost, sale_price: price }).eq('id', id);
    if (error) throw error;
  },
  deleteItem: async (id: number) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw error;
  },

  // 4. NEW: PROFIT ANALYTICS ENGINE
  getProfitAnalytics: async (range: 'day' | 'week' | 'month' | 'year') => {
    let startDate = new Date();
    
    // Calculate Date Range
    if (range === 'day') startDate.setDate(startDate.getDate() - 1);
    if (range === 'week') startDate.setDate(startDate.getDate() - 7);
    if (range === 'month') startDate.setMonth(startDate.getMonth() - 1);
    if (range === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('action_type', 'SALE')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Grouping Logic
    const grouped: Record<string, { revenue: number, profit: number, cost: number }> = {};

    data.forEach(tx => {
      // Format date label based on range
      let label = tx.created_at.split('T')[0]; // Default YYYY-MM-DD
      if (range === 'year') label = tx.created_at.slice(0, 7); // YYYY-MM

      if (!grouped[label]) grouped[label] = { revenue: 0, profit: 0, cost: 0 };

      const revenue = tx.price || 0;
      const cost = (tx.cost_price || 0); // Cost for this single unit
      // Note: If you sold multiple qty in one tx, multiply. Assuming tx logs per row or handled in qty
      // Correction: Qty is in tx.
      const totalRev = revenue; // Assuming price is TOTAL for the row? Or per unit?
      // Let's assume price is TOTAL price passed from POS.
      // But cost is usually PER UNIT. Let's adjust math:
      // Profit = (Revenue) - (UnitCost * Qty)
      
      const totalCost = (tx.cost_price || 0) * tx.qty;
      
      grouped[label].revenue += revenue;
      grouped[label].cost += totalCost;
      grouped[label].profit += (revenue - totalCost);
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      ...grouped[key]
    }));
  },

  // 9. ACCOUNTING: Get Full Transaction History
  getTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false }); // Newest first
    if (error) throw error;
    return data || [];
  },

  // 10. ACCOUNTING: Update a Transaction (Fixing Price/Remarks)
  updateTransaction: async (id: number, updates: { price?: number, remarks?: string, cost_price?: number }) => {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  // 11. ACCOUNTING: Void Transaction (Delete & Reverse Stock)
  deleteTransaction: async (id: number) => {
    // A. Get the transaction details first so we know what to reverse
    const { data: tx, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;

    // B. Calculate Stock Reversal
    // If it was 'IN', we must SUBTRACT stock.
    // If it was 'SALE'/'OUT', we must ADD stock back.
    const isStockIn = tx.action_type === 'IN';
    const reverseAdjustment = isStockIn ? -tx.qty : tx.qty;

    // C. Update Inventory
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

    // D. Finally, Delete the Record
    const { error: delError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (delError) throw delError;
  }

  
};