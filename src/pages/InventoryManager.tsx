import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Trash2, Edit, Plus, Save, X, Search, PackagePlus, ArrowUpDown, Boxes, BadgeAlert, Wallet, Terminal, LayoutGrid, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryManager() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'quantity', direction: 'desc' });
  const [viewMode, setViewMode] = useState<'STANDARD' | 'TERMINAL'>('STANDARD'); 
  const [stats, setStats] = useState({ reserved: 0, sold: 0 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', code: '', supplier: '', cost: 0, price: 0, qty: 0 });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const data = await InventoryAPI.getFullInventory();
      setItems(data || []);
      const quickStats = await InventoryAPI.getQuickStats();
      setStats(quickStats);
    } catch (e) { toast.error('Failed to load inventory'); }
  };

  const handleQuickStock = async (item: any, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
      await InventoryAPI.updateItem(item.id, item.bale_type, item.cost_price, item.sale_price, newQty, item.code, item.supplier_mark);
    } catch (e) { toast.error('Sync failed'); loadItems(); }
  };

  const totalBales = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const totalStockValue = items.reduce((acc, item) => acc + ((item.cost_price || 0) * (item.quantity || 0)), 0);
  const lowStockItems = items.filter(item => item.quantity > 0 && item.quantity < 2).length;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key) direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    else if (key === 'quantity' || key === 'cost_price' || key === 'sale_price') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredItems = sortedItems.filter(i => (i.bale_type || '').toLowerCase().includes(search.toLowerCase()) || (i.code || '').toLowerCase().includes(search.toLowerCase()));

  const openAddModal = () => { setEditingId(null); setForm({ name: '', code: '', supplier: '', cost: 0, price: 0, qty: 0 }); setIsModalOpen(true); };
  const openEditModal = (item: any) => { setEditingId(item.id); setForm({ name: item.bale_type, code: item.code || '', supplier: item.supplier_mark || '', cost: item.cost_price || 0, price: item.sale_price || 0, qty: item.quantity || 0 }); setIsModalOpen(true); };
  const handleSave = async () => {
    if (!form.name) return toast.error("Name required");
    try {
      if (editingId) { await InventoryAPI.updateItem(editingId, form.name, form.cost, form.price, form.qty, form.code, form.supplier); toast.success('Updated'); } 
      else { await InventoryAPI.addItem(form.name, form.cost, form.price, form.code, form.supplier); toast.success('Created'); }
      setIsModalOpen(false); loadItems();
    } catch (e) { toast.error('Error saving'); }
  };
  const handleDelete = async (id: number) => { if (!confirm('Delete item permanently?')) return; try { await InventoryAPI.deleteItem(id); toast.success('Deleted'); loadItems(); } catch (e) { toast.error('Delete failed'); } };

  return (
    <div className={`h-full flex flex-col ${viewMode === 'TERMINAL' ? 'bg-black text-gray-300 font-mono' : 'bg-slate-950 text-slate-100 font-sans'} relative transition-colors duration-300`}>
      <div className={`${viewMode === 'TERMINAL' ? 'bg-gray-950 border-gray-800' : 'bg-slate-900 border-slate-800'} border-b shadow-sm shrink-0 transition-colors duration-300`}>
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">{viewMode === 'TERMINAL' ? <Terminal size={20} className="text-emerald-500"/> : null} Inventory Manager</h1>
              <p className="text-xs opacity-50 uppercase tracking-wider font-bold">{viewMode === 'TERMINAL' ? 'Itemized List' : 'Manage Stock & Prices'}</p>
            </div>
            <div className="flex bg-slate-950/50 p-1 rounded-lg border border-white/10">
              <button onClick={() => setViewMode('STANDARD')} className={`p-1.5 rounded-md transition-all ${viewMode === 'STANDARD' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setViewMode('TERMINAL')} className={`p-1.5 rounded-md transition-all ${viewMode === 'TERMINAL' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-white'}`}><Terminal size={18} /></button>
            </div>
          </div>
          <div className="flex flex-col-reverse md:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-2.5 opacity-50" size={16} /><input className={`w-full bg-transparent border rounded-lg py-2 pl-9 pr-4 text-sm outline-none placeholder:opacity-40 focus:ring-1 ${viewMode === 'TERMINAL' ? 'border-gray-700 focus:border-white focus:ring-white text-white' : 'bg-slate-950 border-slate-700 focus:ring-emerald-500 text-white'}`} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <button onClick={openAddModal} className={`${viewMode === 'TERMINAL' ? 'bg-gray-800 border border-gray-600 hover:bg-gray-700' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'} px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors`}><Plus size={18} /> <span>New Item</span></button>
          </div>
        </div>

        {viewMode === 'STANDARD' && (
          <div className="px-4 pb-4">
            {/* Mobile Text-Based Stats */}
            <div className="md:hidden text-xs text-slate-400 space-y-1 font-mono border-l-2 border-slate-700 pl-3 my-2">
              <div className="flex justify-between"><span>Total Bales:</span> <span className="text-white font-bold">{totalBales}</span></div>
              <div className="flex justify-between"><span>Total Modal:</span> <span className="text-emerald-400 font-bold">RM{totalStockValue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Low Stock (&lt;2):</span> <span className={`${lowStockItems > 0 ? 'text-rose-500' : 'text-slate-500'}`}>{lowStockItems} Items</span></div>
              <div className="flex justify-between"><span>Reserved:</span> <span className="text-yellow-500">{stats.reserved}</span></div>
              <div className="flex justify-between"><span>Total Sold:</span> <span className="text-blue-400">{stats.sold}</span></div>
            </div>

            {/* Desktop Card Stats */}
            <div className="hidden md:grid grid-cols-5 gap-2">
              <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3"><div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Boxes size={20} /></div><div><p className="text-[10px] uppercase font-bold text-slate-500">Total Bales</p><p className="text-xl font-black text-white">{totalBales}</p></div></div>
              <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3"><div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Wallet size={20} /></div><div><p className="text-[10px] uppercase font-bold text-slate-500">Total Modal</p><p className="text-xl font-black text-emerald-400">RM {totalStockValue.toLocaleString()}</p></div></div>
              <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3"><div className="bg-rose-500/20 p-2 rounded-lg text-rose-400"><BadgeAlert size={20} /></div><div><p className="text-[10px] uppercase font-bold text-slate-500">Low Stock</p><p className={`text-xl font-black ${lowStockItems > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{lowStockItems}</p></div></div>
              <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3"><div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400"><PackagePlus size={20} /></div><div><p className="text-[10px] uppercase font-bold text-slate-500">Reserved</p><p className="text-xl font-black text-white">{stats.reserved}</p></div></div>
              <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3"><div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400"><Terminal size={20} /></div><div><p className="text-[10px] uppercase font-bold text-slate-500">Total Sold</p><p className="text-xl font-black text-white">{stats.sold}</p></div></div>
            </div>
          </div>
        )}
      </div>

      {/* Lists ... (Similar structure to before, just applied minor fixes) */}
      <div className="flex-1 overflow-y-auto p-0 md:p-6 min-h-0">
        {viewMode === 'STANDARD' && (
          <div className="max-w-7xl mx-auto pb-20 p-4 md:p-0">
             <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm active:scale-[0.99] transition-transform" onClick={() => openEditModal(item)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700">{item.code || 'NO CODE'}</span>{item.quantity < 2 && <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20">LOW STOCK</span>}</div>
                    <h3 className="font-bold text-white text-base leading-tight mb-1">{item.bale_type}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4"><div className={`text-2xl font-black ${item.quantity > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{item.quantity}</div></div>
                </div>
              ))}
            </div>
            <div className="hidden md:block bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-xs cursor-pointer select-none">
                    <tr><th className="p-4" onClick={() => handleSort('bale_type')}>Item Name</th><th className="p-4" onClick={() => handleSort('code')}>Code</th><th className="p-4 text-right" onClick={() => handleSort('sale_price')}>Jual</th><th className="p-4 text-right" onClick={() => handleSort('quantity')}>Stock</th><th className="p-4 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/50 group transition-colors">
                        <td className="p-4 font-bold text-white">{item.bale_type}</td>
                        <td className="p-4 font-mono text-xs text-blue-400">{item.code || '-'}</td>
                        <td className="p-4 text-right text-emerald-400 font-mono">{item.sale_price}</td>
                        <td className={`p-4 text-right font-bold ${item.quantity > 0 ? 'text-white' : 'text-rose-500'}`}>{item.quantity}</td>
                        <td className="p-4 flex justify-end gap-2"><button onClick={() => openEditModal(item)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"><Edit size={16} /></button><button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded transition-colors"><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
        {viewMode === 'TERMINAL' && (
          <div className="pb-20">
             {filteredItems.map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-3 border-b border-gray-900 ${item.quantity === 0 ? 'opacity-50' : ''} odd:bg-gray-900/20`}>
                <div className="flex-1 min-w-0 pr-4 cursor-pointer" onClick={() => openEditModal(item)}>
                  <div className="flex items-baseline gap-2"><span className="text-emerald-500 font-bold font-mono text-sm w-10 shrink-0">{item.code || '--'}</span><span className="text-white font-bold truncate">{item.bale_type}</span></div>
                </div>
                <div className="flex items-center bg-gray-900 rounded border border-gray-800 overflow-hidden shrink-0">
                  <button onClick={() => handleQuickStock(item, -1)} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 active:bg-gray-700"><Minus size={18}/></button>
                  <div className={`w-10 text-center font-mono font-bold text-lg ${item.quantity > 0 ? 'text-white' : 'text-red-500'}`}>{item.quantity}</div>
                  <button onClick={() => handleQuickStock(item, 1)} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 active:bg-gray-700"><Plus size={18} className="text-black bg-gray-400 rounded-full p-0.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-4">
          <div className={`border rounded-t-2xl md:rounded-2xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 ${viewMode === 'TERMINAL' ? 'bg-black border-gray-600' : 'bg-slate-900 border-slate-700'}`}>
            {/* Modal Content (Similar to previous, trimmed for brevity) */}
            <div className={`p-5 border-b flex justify-between items-center ${viewMode === 'TERMINAL' ? 'border-gray-800' : 'border-slate-800'}`}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><PackagePlus className={viewMode === 'TERMINAL' ? 'text-white' : 'text-emerald-400'} /> {editingId ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-sans">
              <div className={`${viewMode === 'TERMINAL' ? 'bg-gray-900 border-gray-700' : 'bg-slate-800/50 border-slate-700'} p-4 rounded-xl border`}>
                <label className={`text-xs uppercase font-bold mb-2 block flex justify-between ${viewMode === 'TERMINAL' ? 'text-gray-400' : 'text-emerald-400'}`}>Current Stock <span className="opacity-50">Unit: Bales</span></label>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setForm({...form, qty: Math.max(0, form.qty - 1)})} className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg border text-white ${viewMode === 'TERMINAL' ? 'bg-gray-800 border-gray-600' : 'bg-slate-800 border-slate-600'}`}><Minus size={24}/></button>
                  <input type="number" value={form.qty} onChange={e => setForm({...form, qty: Number(e.target.value)})} className={`w-32 rounded-lg py-3 text-center text-3xl font-black text-white focus:ring-2 outline-none border ${viewMode === 'TERMINAL' ? 'bg-black border-gray-600 focus:ring-white' : 'bg-slate-950 border-emerald-500/50 focus:ring-emerald-500'}`} />
                  <button onClick={() => setForm({...form, qty: form.qty + 1})} className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg text-white shadow-lg ${viewMode === 'TERMINAL' ? 'bg-white text-black hover:bg-gray-200' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}><Plus size={24}/></button>
                </div>
              </div>
              <div><label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Item Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full rounded-lg px-3 py-3 text-white outline-none border ${viewMode === 'TERMINAL' ? 'bg-gray-900 border-gray-700 focus:border-white' : 'bg-slate-950 border-slate-700 focus:ring-2 focus:ring-blue-500'}`} placeholder="e.g. Vintage Jeans" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Code</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className={`w-full rounded-lg px-3 py-2 text-white outline-none border ${viewMode === 'TERMINAL' ? 'bg-gray-900 border-gray-700 focus:border-white' : 'bg-slate-950 border-slate-700 focus:ring-2 focus:ring-blue-500'}`} /></div>
                <div><label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Supplier</label><input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className={`w-full rounded-lg px-3 py-2 text-white outline-none border ${viewMode === 'TERMINAL' ? 'bg-gray-900 border-gray-700 focus:border-white' : 'bg-slate-950 border-slate-700 focus:ring-2 focus:ring-blue-500'}`} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Modal (RM)</label><input type="number" value={form.cost} onChange={e => setForm({...form, cost: Number(e.target.value)})} className={`w-full rounded-lg px-3 py-2 text-white outline-none border ${viewMode === 'TERMINAL' ? 'bg-gray-900 border-gray-700 focus:border-white' : 'bg-slate-950 border-slate-700 focus:ring-2 focus:ring-yellow-500'}`} /></div>
                <div><label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Jual (RM)</label><input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className={`w-full rounded-lg px-3 py-2 text-white outline-none border ${viewMode === 'TERMINAL' ? 'bg-gray-900 border-gray-700 focus:border-white' : 'bg-slate-950 border-slate-700 focus:ring-2 focus:ring-emerald-500'}`} /></div>
              </div>
            </div>

            <div className={`p-5 border-t flex justify-end gap-3 md:rounded-b-2xl pb-8 md:pb-5 ${viewMode === 'TERMINAL' ? 'border-gray-800 bg-gray-900' : 'border-slate-800 bg-slate-950/50'}`}>
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 font-bold transition-colors">Cancel</button>
              <button onClick={handleSave} className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${viewMode === 'TERMINAL' ? 'bg-white text-black hover:bg-gray-200' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'}`}><Save size={18} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}