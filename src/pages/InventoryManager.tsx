import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Trash2, Edit, Plus, Save, X, Search, PackagePlus, ArrowUpDown, Boxes, BadgeAlert, Wallet, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryManager() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'quantity', direction: 'desc' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ name: '', code: '', supplier: '', cost: 0, price: 0, qty: 0 });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const data = await InventoryAPI.getFullInventory();
      setItems(data);
    } catch (e) { toast.error('Failed to load inventory'); }
  };

  // Statistik untuk Boss
  const totalBales = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const totalStockValue = items.reduce((acc, item) => acc + ((item.cost_price || 0) * (item.quantity || 0)), 0);
  const lowStockItems = items.filter(item => item.quantity > 0 && item.quantity < 5).length;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    // Logic: Kalau dah sort key yang sama, kita terbalikkan (toggle) direction
    // Special case: Untuk Quantity & Price, biasanya kita nak tengok 'desc' (Banyak/Mahal) dulu
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // Default first click direction based on type
      if (key === 'quantity' || key === 'cost_price' || key === 'sale_price') direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredItems = sortedItems.filter(i => 
    (i.bale_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.supplier_mark || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm({ name: '', code: '', supplier: '', cost: 0, price: 0, qty: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setForm({ 
      name: item.bale_type, 
      code: item.code || '', 
      supplier: item.supplier_mark || '', 
      cost: item.cost_price || 0, 
      price: item.sale_price || 0, 
      qty: item.quantity || 0 
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return toast.error("Item Name is required");
    try {
      if (editingId) {
        await InventoryAPI.updateItem(editingId, form.name, form.cost, form.price, form.qty, form.code, form.supplier);
        toast.success('Item updated');
      } else {
        await InventoryAPI.addItem(form.name, form.cost, form.price, form.code, form.supplier);
        toast.success('Item added');
      }
      setIsModalOpen(false);
      loadItems();
    } catch (e) { toast.error('Error saving item'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      await InventoryAPI.deleteItem(id);
      toast.success('Deleted');
      loadItems();
    } catch (e) { toast.error('Failed to delete'); }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans relative">
      
      {/* Header & Stats */}
      <div className="bg-slate-900 border-b border-slate-800 shadow-sm shrink-0">
        
        {/* Title Bar & Search */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Inventory Manager</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Manage Stock & Prices</p>
          </div>
          
          <div className="flex flex-col-reverse md:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-600"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={openAddModal} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
              <Plus size={18} /> <span>New Item</span>
            </button>
          </div>
        </div>

        {/* --- MOBILE SORTING BAR (Baru Ditambah) --- */}
        <div className="flex md:hidden gap-2 px-4 mb-4 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => handleSort('quantity')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 border transition-colors ${sortConfig.key === 'quantity' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            <Boxes size={14}/> Stock {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          
          <button 
            onClick={() => handleSort('bale_type')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 border transition-colors ${sortConfig.key === 'bale_type' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            <ArrowUpDown size={14}/> Name {sortConfig.key === 'bale_type' && (sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A')}
          </button>

          <button 
            onClick={() => handleSort('cost_price')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 border transition-colors ${sortConfig.key === 'cost_price' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            <Wallet size={14}/> Price {sortConfig.key === 'cost_price' && (sortConfig.direction === 'asc' ? 'Low' : 'High')}
          </button>
        </div>

        {/* Dashboard Boss */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 hidden sm:block"><Boxes size={20} /></div>
            <div><p className="text-[10px] uppercase font-bold text-slate-500">Total Bales</p><p className="text-xl font-black text-white">{totalBales}</p></div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 hidden sm:block"><Wallet size={20} /></div>
            <div><p className="text-[10px] uppercase font-bold text-slate-500">Total Modal</p><p className="text-xl font-black text-emerald-400">RM {totalStockValue.toLocaleString()}</p></div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
            <div className="bg-rose-500/20 p-2 rounded-lg text-rose-400 hidden sm:block"><BadgeAlert size={20} /></div>
            <div><p className="text-[10px] uppercase font-bold text-slate-500">Low Stock</p><p className={`text-xl font-black ${lowStockItems > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{lowStockItems} <span className="text-xs font-normal text-slate-500">Items</span></p></div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 bg-slate-950">
        <div className="max-w-7xl mx-auto pb-20">
          
          {/* --- MOBILE CARD VIEW --- */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm active:scale-[0.99] transition-transform" onClick={() => openEditModal(item)}>
                
                {/* Info Kiri */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700">{item.code || 'NO CODE'}</span>
                    {item.quantity < 5 && <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20">LOW</span>}
                  </div>
                  <h3 className="font-bold text-white text-base leading-tight mb-1">{item.bale_type}</h3>
                  <p className="text-xs text-slate-500">{item.supplier_mark || 'No Supplier'}</p>
                </div>

                {/* Info Kanan (Stok & Harga) */}
                <div className="flex flex-col items-end gap-1 ml-4">
                  <div className={`text-2xl font-black ${item.quantity > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {item.quantity}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Bales Left</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="bg-blue-500/10 text-blue-400 p-2 rounded-lg border border-blue-500/20">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* --- DESKTOP TABLE VIEW --- */}
          <div className="hidden md:block bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-xs cursor-pointer select-none">
                <tr>
                  <th className="p-4 hover:text-white" onClick={() => handleSort('bale_type')}>Item Name <ArrowUpDown size={12} className="inline ml-1"/></th>
                  <th className="p-4 hover:text-white" onClick={() => handleSort('code')}>Code <ArrowUpDown size={12} className="inline ml-1"/></th>
                  <th className="p-4 hover:text-white" onClick={() => handleSort('supplier_mark')}>Supplier <ArrowUpDown size={12} className="inline ml-1"/></th>
                  <th className="p-4 text-right hover:text-white" onClick={() => handleSort('cost_price')}>Modal <ArrowUpDown size={12} className="inline ml-1"/></th>
                  <th className="p-4 text-right hover:text-white" onClick={() => handleSort('sale_price')}>Jual <ArrowUpDown size={12} className="inline ml-1"/></th>
                  <th className="p-4 text-right hover:text-emerald-400" onClick={() => handleSort('quantity')}>Stock <ArrowUpDown size={12} className="inline ml-1"/></th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 group transition-colors">
                    <td className="p-4 font-bold text-white">{item.bale_type}</td>
                    <td className="p-4 font-mono text-xs text-blue-400">{item.code || '-'}</td>
                    <td className="p-4 text-slate-400 text-xs">{item.supplier_mark || '-'}</td>
                    <td className="p-4 text-right text-yellow-500 font-mono">{item.cost_price}</td>
                    <td className="p-4 text-right text-emerald-400 font-mono">{item.sale_price}</td>
                    <td className={`p-4 text-right font-bold ${item.quantity > 0 ? 'text-white' : 'text-rose-500'}`}>{item.quantity}</td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl md:rounded-2xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PackagePlus className="text-emerald-400" /> {editingId ? 'Update Stock / Edit' : 'New Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label className="text-xs uppercase font-bold text-emerald-400 mb-2 block flex justify-between">
                  Current Stock
                  <span className="text-slate-500">Unit: Bales</span>
                </label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setForm({...form, qty: Math.max(0, form.qty - 1)})} className="p-3 bg-slate-800 rounded-lg border border-slate-600 text-white hover:bg-slate-700"><Minus size={20}/></button>
                  <input type="number" value={form.qty} onChange={e => setForm({...form, qty: Number(e.target.value)})} className="flex-1 bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-3 text-center text-2xl font-black text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                  <button onClick={() => setForm({...form, qty: form.qty + 1})} className="p-3 bg-emerald-600 rounded-lg text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"><Plus size={20}/></button>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Item Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Vintage Jeans" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Code</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="A-01" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Supplier</label>
                  <input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="JPN" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Modal (RM)</label>
                  <input type="number" value={form.cost} onChange={e => setForm({...form, cost: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Jual (RM)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/50 md:rounded-b-2xl pb-8 md:pb-5">
              {editingId && (
                <button onClick={() => { if(confirm("Delete item?")) handleDelete(editingId); setIsModalOpen(false); }} className="mr-auto text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg">
                  <Trash2 size={20} />
                </button>
              )}
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 font-bold transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                <Save size={18} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icons for plus/minus in modal
function Minus({size}:{size:number}) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>; }