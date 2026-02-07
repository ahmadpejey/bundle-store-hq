import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { PrintableReceipt } from '../components/PrintableReceipt';
import { Trash2, Edit, Save, X, Search, FileText, Calendar, CheckCircle, Banknote, QrCode, Smartphone, Undo2, User, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounting() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, remarks: '' });

  const [settleId, setSettleId] = useState<number | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCashier, setFilterCashier] = useState('ALL');

  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await InventoryAPI.getTransactions();
      setTransactions(data || []);
    } catch (e) { toast.error('Failed to load records'); }
  };

  const handleDelete = async (id: number, type: string) => {
    const message = type === 'RESERVE' ? 'Cancel Booking & Return item to Stock?' : `VOID this ${type} record? Stock will be reversed.`;
    if (!confirm(message)) return;
    try { await InventoryAPI.deleteTransaction(id); toast.success('Record voided'); loadData(); } catch (e) { toast.error('Error'); }
  };

  const startEdit = (tx: any) => { setEditingId(tx.id); setEditForm({ price: tx.price || 0, remarks: tx.remarks || '' }); };
  const saveEdit = async () => { if (!editingId) return; try { await InventoryAPI.updateTransaction(editingId, editForm); toast.success('Updated'); setEditingId(null); loadData(); } catch (e) { toast.error('Update failed'); } };
  const openSettleModal = (tx: any) => { setSettleId(tx.id); setSettleAmount(tx.price.toString()); };
  const handleSettle = async (method: string) => { if (!settleId) return; try { await InventoryAPI.settleReservation(settleId, Number(settleAmount), method); toast.success('Settled'); setSettleId(null); loadData(); } catch (e) { toast.error('Failed'); } };

  const handleReprint = async (tx: any) => {
    if (!tx.receipt_no) return toast.error("No Receipt ID found.");
    try {
        const relatedItems = transactions.filter(t => t.receipt_no === tx.receipt_no);
        const total = relatedItems.reduce((acc, item) => acc + (item.price || 0), 0);
        
        setReceiptData({
            receiptNo: tx.receipt_no,
            date: tx.created_at,
            cashier: tx.operator,
            items: relatedItems.map(i => ({ bale_type: i.bale_type, qty: i.qty, price: i.price })),
            total: total,
            paymentMethod: tx.payment_method || 'CASH',
            customerName: tx.remarks?.replace('Sale: ', '').replace('Booking: ', '').replace('Hutang: ', ''),
            type: 'THERMAL'
        });

        setTimeout(() => { window.print(); }, 100);
    } catch(e) { toast.error("Failed to generate receipt"); }
  };

  const filtered = transactions.filter(tx => {
    const txDate = tx.created_at.split('T')[0];
    const matchSearch = (tx.bale_type || '').toLowerCase().includes(search.toLowerCase()) || (tx.remarks || '').toLowerCase().includes(search.toLowerCase()) || (tx.receipt_no || '').toLowerCase().includes(search.toLowerCase());
    const matchDate = (!dateFrom || txDate >= dateFrom) && (!dateTo || txDate <= dateTo);
    const matchType = filterType === 'ALL' || tx.action_type === filterType;
    const matchCashier = filterCashier === 'ALL' || tx.operator === filterCashier;
    return matchSearch && matchDate && matchType && matchCashier;
  });

  const totalSale = filtered.reduce((acc, tx) => acc + (tx.action_type === 'SALE' ? (tx.price || 0) : 0), 0);
  const totalProfit = filtered.reduce((acc, tx) => acc + (tx.action_type === 'SALE' ? ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)) : 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      
      {/* Hidden Receipt Area */}
      <div id="print-root">
        {receiptData && <PrintableReceipt {...receiptData} />}
      </div>

      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 shrink-0 flex flex-col gap-4 no-print z-10">
        <div className="flex justify-between items-center">
          <div><h1 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="text-blue-400" size={20} /> Accounting Ledger</h1><p className="text-xs text-slate-500 uppercase font-bold">Financial Records</p></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="relative"><Calendar className="absolute left-3 top-2.5 text-slate-500" size={14} /><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-xs text-white" /></div>
            <div className="relative"><Calendar className="absolute left-3 top-2.5 text-slate-500" size={14} /><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-xs text-white" /></div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white"><option value="ALL">All Types</option><option value="SALE">Sale</option><option value="DEBT">Hutang</option><option value="RESERVE">Booking</option><option value="IN">Stock In</option><option value="OUT">Stock Out</option></select>
            <select value={filterCashier} onChange={e => setFilterCashier(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white"><option value="ALL">All Cashiers</option>{['SAIFUL', 'MADAN', 'SAMSUL'].map(c => <option key={c} value={c}>{c}</option>)}</select>
            <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-500" size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-xs text-white" /></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950 no-scrollbar">
        <div className="max-w-7xl mx-auto pb-20">
          
          {/* MOBILE CARD VIEW */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? <p className="text-center text-slate-500 py-10">No records found.</p> : null}
            {filtered.map((tx) => {
              const typeColor = tx.action_type === 'SALE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                tx.action_type === 'RESERVE' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                tx.action_type === 'DEBT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                'bg-slate-800 border-slate-700 text-slate-400';
              const displayType = tx.action_type === 'RESERVE' ? 'BOOKING' : tx.action_type === 'DEBT' ? 'HUTANG' : tx.action_type;
              const isEditing = editingId === tx.id;

              return (
                <div key={tx.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${typeColor}`}>
                      {displayType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-white text-sm line-clamp-1">{tx.bale_type}</h3>
                      {isEditing ? <input value={editForm.remarks} onChange={(e) => setEditForm({...editForm, remarks: e.target.value})} className="block mt-1 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white" placeholder="Remarks"/> : tx.remarks && <p className="text-xs text-slate-500 italic mt-0.5 truncate">{tx.remarks}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {isEditing ? <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-white text-sm" /> : <div className="text-lg font-black text-white">RM {(tx.price || 0).toFixed(2)}</div>}
                      <div className="text-[10px] text-slate-500">{tx.qty} Unit(s)</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User size={12}/> {tx.operator}
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <><button onClick={saveEdit} className="p-1.5 text-emerald-400 bg-slate-800 rounded-lg"><Save size={16}/></button><button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 bg-slate-800 rounded-lg"><X size={16}/></button></>
                      ) : (
                        <>
                           {tx.action_type === 'SALE' && tx.receipt_no && <button onClick={() => handleReprint(tx)} className="p-1.5 text-slate-400 bg-slate-800 rounded-lg"><Printer size={16}/></button>}
                           {(tx.action_type === 'RESERVE' || tx.action_type === 'DEBT') && <button onClick={() => openSettleModal(tx)} className="bg-yellow-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-yellow-400"><CheckCircle size={14}/> Settle</button>}
                          <button onClick={() => startEdit(tx)} className="p-1.5 text-blue-400 bg-slate-800 rounded-lg"><Edit size={16}/></button>
                          {tx.action_type === 'RESERVE' ? <button onClick={() => handleDelete(tx.id, 'RESERVE')} className="p-1.5 text-rose-400 bg-slate-800 rounded-lg"><Undo2 size={16}/></button> : <button onClick={() => handleDelete(tx.id, tx.action_type)} className="p-1.5 text-rose-400 bg-slate-800 rounded-lg"><Trash2 size={16}/></button>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto shadow-xl print:hidden">
             <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-xs border-b border-slate-800">
                <tr><th className="p-4">Date</th><th className="p-4">Type</th><th className="p-4">Item</th><th className="p-4 text-center">Qty</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Profit</th><th className="p-4">Cashier</th><th className="p-4 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((tx) => {
                  const isProfit = ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)) > 0;
                  const isEditing = editingId === tx.id;
                  const typeColor = tx.action_type === 'SALE' ? 'bg-emerald-500/10 text-emerald-400' : tx.action_type === 'RESERVE' ? 'bg-yellow-500/10 text-yellow-400' : tx.action_type === 'DEBT' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400';
                  const displayType = tx.action_type === 'RESERVE' ? 'BOOKING' : tx.action_type === 'DEBT' ? 'HUTANG' : tx.action_type;
                  
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-400 font-mono text-xs">{new Date(tx.created_at).toLocaleDateString()} <br/><span className="opacity-50">{new Date(tx.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${typeColor}`}>{displayType}</span></td>
                      <td className="p-4 font-medium text-slate-200">{tx.bale_type}{isEditing ? <input value={editForm.remarks} onChange={(e) => setEditForm({...editForm, remarks: e.target.value})} className="block mt-1 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white" /> : tx.remarks && <div className="text-xs text-slate-500 italic mt-0.5">{tx.remarks}</div>}</td>
                      <td className="p-4 text-center font-bold">{tx.qty}</td>
                      <td className="p-4 text-right font-mono">{isEditing ? <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-white" /> : (tx.price || 0).toFixed(2)}</td>
                      <td className={`p-4 text-right font-mono font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.action_type === 'SALE' ? ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)).toFixed(2) : '-'}</td>
                      <td className="p-4 text-slate-400 text-xs">{tx.operator}</td>
                      <td className="p-4 flex justify-end gap-2">
                        {isEditing ? (
                          <><button onClick={saveEdit} className="p-1.5 text-emerald-400 bg-emerald-400/10 rounded"><Save size={16}/></button><button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 bg-slate-800 rounded"><X size={16}/></button></>
                        ) : (
                          <>
                             {tx.action_type === 'SALE' && tx.receipt_no && <button onClick={() => handleReprint(tx)} className="p-1.5 text-slate-400 bg-slate-800 rounded hover:bg-slate-700"><Printer size={16}/></button>}
                             {(tx.action_type === 'RESERVE' || tx.action_type === 'DEBT') && <button onClick={() => openSettleModal(tx)} className="p-1.5 text-yellow-400 bg-yellow-400/10 rounded hover:bg-yellow-400/20"><CheckCircle size={16}/></button>}
                            <button onClick={() => startEdit(tx)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"><Edit size={16}/></button>
                            {tx.action_type === 'RESERVE' ? <button onClick={() => handleDelete(tx.id, 'RESERVE')} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded"><Undo2 size={16}/></button> : <button onClick={() => handleDelete(tx.id, tx.action_type)} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded"><Trash2 size={16}/></button>}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold">
                <tr><td colSpan={4} className="p-4 text-right uppercase text-xs text-slate-400">Total Sales Only</td><td className="p-4 text-right font-mono text-white">RM {totalSale.toFixed(2)}</td><td className="p-4 text-right font-mono text-emerald-400">RM {totalProfit.toFixed(2)}</td><td colSpan={2}></td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {settleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-6">
            <div className="text-center"><h2 className="text-xl font-bold text-white">Selesaikan Bayaran</h2><p className="text-slate-400 text-sm">Convert to Sale</p></div>
            <div><label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Final Full Price (RM)</label><input type="number" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-mono" /></div>
            <div className="grid gap-2">
              <button onClick={() => handleSettle('CASH')} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 text-emerald-400 font-bold"><Banknote size={18}/> Cash</button>
              <button onClick={() => handleSettle('QR_PAY')} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 text-pink-400 font-bold"><QrCode size={18}/> QR Pay</button>
              <button onClick={() => handleSettle('TRANSFER')} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 text-blue-400 font-bold"><Smartphone size={18}/> Transfer</button>
            </div>
            <button onClick={() => setSettleId(null)} className="w-full py-2 text-slate-500 hover:text-white text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}