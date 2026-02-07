import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Trash2, Edit, Plus, Save, X, Search, PackagePlus, ArrowUpDown } from 'lucide-react';
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
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
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Inventory Manager</h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Manage Stock & Prices</p>
        </div>
        
        {/* Mobile View: Flex-col-reverse puts Add Button ABOVE Search */}
        <div className="flex flex-col-reverse md:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-600"
              placeholder="Search Name, Code, Supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={openAddModal} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
            <Plus size={18} /> <span>New Item</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        <div className="max-w-7xl mx-auto pb-20">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PackagePlus className="text-emerald-400" /> {editingId ? 'Edit Item' : 'New Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Item Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Jenis Bale" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Item Code</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Kod Bale" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Supplier Mark</label>
                  <input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Supplier" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Modal (RM)</label>
                  <input type="number" value={form.cost} onChange={e => setForm({...form, cost: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Jual (RM)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Stock</label>
                  <input type="number" value={form.qty} onChange={e => setForm({...form, qty: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/50 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 font-bold transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                <Save size={18} /> Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}