import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Trash2, Edit, Save, X, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounting() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, remarks: '' });

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

  // SAFETY FIX: Using ?.toLowerCase() to prevent crashes on null data
  const filtered = transactions.filter(t => 
    (t.bale_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.operator || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.action_type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Sub-Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-400" size={20} /> Accounting Ledger
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Financial Records</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-600"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        <div className="max-w-7xl mx-auto pb-20">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto shadow-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-xs tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Item</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 text-right">Sale Price (RM)</th>
                  <th className="p-4 text-right">Profit (RM)</th>
                  <th className="p-4">Cashier</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">No records found.</td></tr>
                ) : filtered.map((tx) => {
                  const isProfit = ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)) > 0;
                  const isEditing = editingId === tx.id;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-400 font-mono text-xs">
                        {new Date(tx.created_at).toLocaleDateString()} <br/>
                        <span className="opacity-50">{new Date(tx.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                          ${tx.action_type === 'SALE' ? 'bg-emerald-500/10 text-emerald-400' : 
                            tx.action_type === 'IN' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {tx.action_type}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-200">
                        {tx.bale_type}
                        {isEditing ? (
                          <input 
                            value={editForm.remarks}
                            onChange={(e) => setEditForm({...editForm, remarks: e.target.value})}
                            className="block mt-1 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                            placeholder="Add remark..."
                          />
                        ) : (
                          tx.remarks && <div className="text-xs text-slate-500 italic mt-0.5">{tx.remarks}</div>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold">{tx.qty}</td>
                      
                      <td className="p-4 text-right font-mono">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                            className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className={tx.action_type === 'SALE' ? 'text-emerald-400' : 'text-slate-500'}>
                            {(tx.price || 0).toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className={`p-4 text-right font-mono font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.action_type === 'SALE' ? ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)).toFixed(2) : '-'}
                      </td>

                      <td className="p-4 text-slate-400 text-xs">{tx.operator}</td>
                      
                      <td className="p-4 flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit} className="p-1.5 text-emerald-400 bg-emerald-400/10 rounded hover:bg-emerald-400/20"><Save size={16}/></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 bg-slate-800 rounded hover:bg-slate-700"><X size={16}/></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(tx)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Edit Price/Remark">
                              <Edit size={16}/>
                            </button>
                            <button onClick={() => handleDelete(tx.id, tx.action_type)} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded transition-colors" title="Void Transaction">
                              <Trash2 size={16}/>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}