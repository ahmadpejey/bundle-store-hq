import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { PrintableReceipt } from '../components/PrintableReceipt';
import { Trash2, Edit, Save, X, Search, FileText, Banknote, QrCode, Smartphone, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { cn } from '../lib/utils';

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
    try { const data = await InventoryAPI.getTransactions(); setTransactions(data || []); } catch (e) { toast.error('Failed to load records'); }
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
    } catch (e) { toast.error("Failed to generate receipt"); }
  };

  const filtered = transactions.filter(tx => {
    const txDate = tx.created_at.split('T')[0];
    const matchSearch = (tx.bale_type || '').toLowerCase().includes(search.toLowerCase()) || (tx.remarks || '').toLowerCase().includes(search.toLowerCase()) || (tx.receipt_no || '').toLowerCase().includes(search.toLowerCase());
    const matchDate = (!dateFrom || txDate >= dateFrom) && (!dateTo || txDate <= dateTo);
    const matchType = filterType === 'ALL' || tx.action_type === filterType;
    const matchCashier = filterCashier === 'ALL' || tx.operator === filterCashier;
    return matchSearch && matchDate && matchType && matchCashier;
  });

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Pop-up blocked");

    const totalSales = filtered.reduce((acc, tx) => acc + (tx.action_type === 'SALE' ? (tx.price || 0) : 0), 0);

    // ... (Keep existing report logic or improve styling if needed, keeping it simple for now)
    const htmlContent = `
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; margin-top: 20px; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>Sales Report</h1>
          <p>Date Range: ${dateFrom || 'All'} to ${dateTo || 'All'}</p>
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Qty</th><th>Price</th><th>Customer</th><th>Cashier</th></tr></thead>
            <tbody>
              ${filtered.map(tx => {
      let customer = '-';
      if (tx.remarks) {
        const r = tx.remarks;
        if (r.startsWith('Sale: ')) customer = r.replace('Sale: ', '');
        else if (r.startsWith('Booking: ')) customer = r.replace('Booking: ', '');
        else if (r.startsWith('Hutang: ')) customer = r.replace('Hutang: ', '');
        else if (r.startsWith('Delivery: ')) customer = r.replace('Delivery: ', '').split(',')[0];
      }
      return `
                <tr>
                  <td>${new Date(tx.created_at).toLocaleDateString()} ${new Date(tx.created_at).toLocaleTimeString()}</td>
                  <td>${tx.action_type}</td>
                  <td>${tx.bale_type}</td>
                  <td>${tx.qty}</td>
                  <td>RM${(tx.price || 0).toFixed(2)}</td>
                  <td>${customer}</td>
                  <td>${tx.operator}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
          <div class="total">Total Sales: RM${totalSales.toFixed(2)}</div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const totalSale = filtered.reduce((acc, tx) => acc + (tx.action_type === 'SALE' ? (tx.price || 0) : 0), 0);
  const totalProfit = filtered.reduce((acc, tx) => acc + (tx.action_type === 'SALE' ? ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)) : 0), 0);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div id="print-root">{receiptData && <PrintableReceipt {...receiptData} />}</div>

      {/* HEADER & STATS */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">LEDGER</h1>
          <p className="text-slate-500 text-sm font-medium">Financial records & transactions</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Card className="p-3 flex-1 md:w-40 bg-slate-900 text-white border-none shadow-lg">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Revenue</div>
            <div className="text-lg font-black break-words">RM {totalSale.toLocaleString()}</div>
          </Card>
          <Card className="p-3 flex-1 md:w-40 bg-white border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-emerald-600">Net Profit</div>
            <div className="text-lg font-black text-slate-900 break-words">RM {totalProfit.toLocaleString()}</div>
          </Card>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 bg-white p-3 rounded-xl border shadow-sm no-print">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="pl-10 bg-slate-50 border-slate-200"
            />
          </div>
          <Button onClick={handlePrintReport} variant="outline" className="shrink-0 gap-2">
            <Printer size={16} /> Print Report
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-slate-50 border-slate-200 text-xs" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-slate-50 border-slate-200 text-xs" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"><option value="ALL">All Types</option><option value="SALE">Sale</option><option value="DEBT">Hutang</option><option value="RESERVE">Booking</option><option value="IN">Stock In</option><option value="OUT">Stock Out</option></select>
          <select value={filterCashier} onChange={e => setFilterCashier(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"><option value="ALL">All Cashiers</option>{['SAIFUL', 'MADAN', 'SAMSUL'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>
      </div>

      {/* LIST / TABLE */}
      <div className="flex-1 overflow-hidden bg-white border rounded-xl shadow-sm flex flex-col no-print">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b text-xs font-black uppercase text-slate-500 select-none">
          <div className="col-span-2">Date</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-3">Item / Remarks</div>
          <div className="col-span-1 text-center">Qty</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-right">Profit</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText size={48} className="opacity-20 mb-4" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((tx) => {
                const isEditing = editingId === tx.id;
                const displayType = tx.action_type === 'RESERVE' ? 'BOOKING' : tx.action_type === 'DEBT' ? 'HUTANG' : tx.action_type;
                const typeColor = tx.action_type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : tx.action_type === 'RESERVE' ? 'bg-yellow-100 text-yellow-700' : tx.action_type === 'DEBT' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600';

                return (
                  <div key={tx.id} className="group hover:bg-slate-50 transition-colors">
                    {/* DESKTOP ROW */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center text-sm">
                      <div className="col-span-2 text-slate-500 text-xs">
                        <div className="font-bold text-slate-700">{new Date(tx.created_at).toLocaleDateString()}</div>
                        <div>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="col-span-1"><Badge variant="outline" className={cn("border-none", typeColor)}>{displayType}</Badge></div>
                      <div className="col-span-3">
                        <div className="font-bold text-slate-900">{tx.bale_type}</div>
                        {isEditing ? <Input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} className="h-7 text-xs mt-1" /> : tx.remarks && <div className="text-xs text-slate-500 italic mt-0.5 truncate">{tx.remarks}</div>}
                      </div>
                      <div className="col-span-1 text-center font-mono font-bold">{tx.qty}</div>
                      <div className="col-span-2 text-right font-mono">
                        {isEditing ? <Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className="h-7 text-right" /> : (tx.price || 0).toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right font-mono font-bold text-emerald-600">{tx.action_type === 'SALE' ? ((tx.price || 0) - ((tx.cost_price || 0) * tx.qty)).toFixed(2) : '-'}</div>
                      <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <><Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8 text-emerald-600"><Save size={14} /></Button><Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-slate-400"><X size={14} /></Button></>
                        ) : (
                          <>
                            {tx.action_type === 'SALE' && tx.receipt_no && <Button size="icon" variant="ghost" onClick={() => handleReprint(tx)} className="h-8 w-8 text-slate-400 hover:text-slate-900"><Printer size={14} /></Button>}
                            {(tx.action_type === 'RESERVE' || tx.action_type === 'DEBT') && <Button size="sm" variant="default" onClick={() => openSettleModal(tx)} className="h-8 px-2 text-[10px] bg-yellow-500 hover:bg-yellow-600 text-white">SETTLE</Button>}
                            <Button size="icon" variant="ghost" onClick={() => startEdit(tx)} className="h-8 w-8 text-blue-400 hover:text-blue-600"><Edit size={14} /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(tx.id, tx.action_type)} className="h-8 w-8 text-rose-400 hover:text-rose-600"><Trash2 size={14} /></Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* MOBILE ROW */}
                    <div className="md:hidden p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={cn("border-none px-1.5 py-0 h-5 text-[10px]", typeColor)}>{displayType}</Badge>
                            <span className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="font-bold text-slate-900">{tx.bale_type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-lg">RM {(tx.price || 0).toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500">{tx.qty} Units</div>
                        </div>
                      </div>
                      {isEditing ? (
                        <div className="grid gap-2 bg-slate-50 p-2 rounded-lg">
                          <Input value={editForm.remarks} onChange={e => setEditForm({ ...editForm, remarks: e.target.value })} placeholder="Remarks" className="h-8 text-xs bg-white" />
                          <Input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} placeholder="Price" className="h-8 text-xs bg-white" />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 text-xs">Cancel</Button>
                            <Button size="sm" onClick={saveEdit} className="h-7 text-xs bg-emerald-600 text-white">Save</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <div className="text-xs text-slate-500 italic truncate max-w-[150px]">{tx.remarks}</div>
                          <div className="flex gap-1">
                            {tx.action_type === 'SALE' && tx.receipt_no && <Button size="icon" variant="ghost" onClick={() => handleReprint(tx)} className="h-7 w-7 text-slate-400"><Printer size={14} /></Button>}
                            {(tx.action_type === 'RESERVE' || tx.action_type === 'DEBT') && <Button size="sm" onClick={() => openSettleModal(tx)} className="h-7 px-2 text-[10px] bg-yellow-500 text-white">SETTLE</Button>}
                            <Button size="icon" variant="ghost" onClick={() => startEdit(tx)} className="h-7 w-7 text-blue-400"><Edit size={14} /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(tx.id, tx.action_type)} className="h-7 w-7 text-rose-400"><Trash2 size={14} /></Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* SETTLE MODAL */}
      <Dialog open={!!settleId} onOpenChange={(open) => !open && setSettleId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Settle Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Final Amount (RM)</label>
              <Input type="number" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} className="text-lg font-bold" />
            </div>
            <div className="grid gap-2">
              <Button variant="outline" onClick={() => handleSettle('CASH')} className="justify-start"><Banknote size={16} className="mr-2 text-emerald-600" /> Cash</Button>
              <Button variant="outline" onClick={() => handleSettle('QR_PAY')} className="justify-start"><QrCode size={16} className="mr-2 text-pink-600" /> QR Pay</Button>
              <Button variant="outline" onClick={() => handleSettle('TRANSFER')} className="justify-start"><Smartphone size={16} className="mr-2 text-blue-600" /> Transfer</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettleId(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}