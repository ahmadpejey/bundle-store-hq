import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Trash2, Edit, Save, X, Search, FileText, Printer, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounting() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, remarks: '' });

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCashier, setFilterCashier] = useState('ALL');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await InventoryAPI.getTransactions();
      setTransactions(data || []);
    } catch (e) { toast.error('Failed to load records'); }
  };

  const handleDelete = async (id: number, type: string) => {
    if (!confirm(`VOID this ${type} record? Stock will be reversed.`)) return;
    try {
      await InventoryAPI.deleteTransaction(id);
      toast.success('Record voided & Stock reversed');
      loadData();
    } catch (e) { toast.error('Error voiding record'); }
  };

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setEditForm({ price: tx.price || 0, remarks: tx.remarks || '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await InventoryAPI.updateTransaction(editingId, editForm);
      toast.success('Record updated');
      setEditingId(null);
      loadData();
    } catch (e) { toast.error('Update failed'); }
  };

  // FILTER LOGIC
  const filtered = transactions.filter(tx => {
    const txDate = tx.created_at.split('T')[0];
    const matchSearch = (tx.bale_type || '').toLowerCase().includes(search.toLowerCase()) || 
                        (tx.remarks || '').toLowerCase().includes(search.toLowerCase());
    const matchDate = (!dateFrom || txDate >= dateFrom) && (!dateTo || txDate <= dateTo);
    const matchType = filterType === 'ALL' || tx.action_type === filterType;
    const matchCashier = filterCashier === 'ALL' || tx.operator === filterCashier;

    return matchSearch && matchDate && matchType && matchCashier;
  });

  // SUMMARY CALCULATION
  const totalSale = filtered.reduce((acc, tx) => acc + (tx.action_type === 'SALE' ? (tx.price || 0) : 0), 0);
  const totalProfit = filtered.reduce((acc, tx) => acc + (tx.action_type === 'SALE' ? ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)) : 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans print-container">
      {/* Header & Filters (Hidden on Print) */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 shadow-sm shrink-0 flex flex-col gap-4 no-print">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="text-blue-400" size={20} /> Accounting Ledger</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Financial Records</p>
          </div>
          <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Printer size={18}/> Print / PDF
          </button>
        </div>
        
        {/* Filter Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-xs text-white" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-xs text-white" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white">
            <option value="ALL">All Types</option>
            <option value="SALE">Sale</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </select>
          <select value={filterCashier} onChange={e => setFilterCashier(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white">
            <option value="ALL">All Cashiers</option>
            {['SAIFUL', 'MADAN', 'SAMSUL'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-xs text-white" />
          </div>
        </div>
      </div>

      {/* Print Header (Visible only on print) */}
      <div className="hidden print:block p-4 text-black text-center border-b border-black">
        <h1 className="text-2xl font-bold">Laporan Jualan Bundle Wira Damai</h1>
        <p className="text-sm">Dicetak pada: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 print:p-0 print:overflow-visible">
        <div className="max-w-7xl mx-auto pb-20 print:pb-0">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto shadow-xl print:bg-white print:border-none print:shadow-none">
            <table className="w-full text-left text-sm whitespace-nowrap print:text-black">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-xs border-b border-slate-800 print:bg-white print:text-black print:border-black">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Item</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 text-right">Sale Price</th>
                  <th className="p-4 text-right no-print">Profit</th>
                  <th className="p-4">Cashier</th>
                  <th className="p-4 text-right no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 print:divide-black">
                {filtered.map((tx) => {
                  const isProfit = ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)) > 0;
                  const isEditing = editingId === tx.id;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                      <td className="p-4 text-slate-400 font-mono text-xs print:text-black">
                        {new Date(tx.created_at).toLocaleDateString()} <br className="no-print"/>
                        <span className="opacity-50 no-print">{new Date(tx.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase print:border print:border-black print:text-black ${tx.action_type === 'SALE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {tx.action_type}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-200 print:text-black">
                        {tx.bale_type}
                        {isEditing ? <input value={editForm.remarks} onChange={(e) => setEditForm({...editForm, remarks: e.target.value})} className="block mt-1 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs no-print" /> : tx.remarks && <div className="text-xs text-slate-500 italic mt-0.5 print:text-black">{tx.remarks}</div>}
                      </td>
                      <td className="p-4 text-center font-bold print:text-black">{tx.qty}</td>
                      <td className="p-4 text-right font-mono print:text-black">
                        {isEditing ? <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right no-print" /> : (tx.price || 0).toFixed(2)}
                      </td>
                      <td className={`p-4 text-right font-mono font-bold no-print ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.action_type === 'SALE' ? ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)).toFixed(2) : '-'}
                      </td>
                      <td className="p-4 text-slate-400 text-xs print:text-black">{tx.operator}</td>
                      <td className="p-4 flex justify-end gap-2 no-print">
                        {isEditing ? (
                          <><button onClick={saveEdit} className="p-1.5 text-emerald-400 bg-emerald-400/10 rounded"><Save size={16}/></button><button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 bg-slate-800 rounded"><X size={16}/></button></>
                        ) : (
                          <><button onClick={() => startEdit(tx)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"><Edit size={16}/></button><button onClick={() => handleDelete(tx.id, tx.action_type)} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded"><Trash2 size={16}/></button></>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Summary Footer */}
              <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold print:bg-white print:border-black print:text-black">
                <tr>
                  <td colSpan={4} className="p-4 text-right uppercase text-xs text-slate-400 print:text-black">Total (Filtered)</td>
                  <td className="p-4 text-right font-mono text-white print:text-black">RM {totalSale.toFixed(2)}</td>
                  <td className="p-4 text-right font-mono text-emerald-400 no-print">RM {totalProfit.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}