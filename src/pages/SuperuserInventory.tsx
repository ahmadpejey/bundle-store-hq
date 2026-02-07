import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Search, Plus, Minus, Save, Trash2, X, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperuserInventory() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [form, setForm] = useState({ name: '', code: '', supplier: '', cost: 0, price: 0, qty: 0 });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    const data = await InventoryAPI.getFullInventory();
    setItems(data || []);
  };

  // --- LOGIC ---
  const handleQuickStock = async (item: any, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      // Optimistic Update (Update UI immediately)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
      
      // Update DB
      await InventoryAPI.updateItem(item.id, item.bale_type, item.cost_price, item.sale_price, newQty, item.code, item.supplier_mark);
    } catch (e) {
      toast.error('Sync error');
      loadItems(); // Revert on fail
    }
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ 
      name: item.bale_type, code: item.code || '', supplier: item.supplier_mark || '', 
      cost: item.cost_price || 0, price: item.sale_price || 0, qty: item.quantity || 0 
    });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', code: '', supplier: '', cost: 0, price: 0, qty: 0 });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    try {
      if (editingId) {
        await InventoryAPI.updateItem(editingId, form.name, form.cost, form.price, form.qty, form.code, form.supplier);
        toast.success('UPDATED');
      } else {
        await InventoryAPI.addItem(form.name, form.cost, form.price, form.code, form.supplier);
        toast.success('CREATED');
      }
      setIsModalOpen(false);
      loadItems();
    } catch (e) { toast.error('ERROR'); }
  };

  const handleDelete = async () => {
    if (!editingId || !confirm('DELETE PERMANENTLY?')) return;
    await InventoryAPI.deleteItem(editingId);
    setIsModalOpen(false);
    loadItems();
  };

  const filteredItems = items.filter(i => 
    (i.bale_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-black text-gray-300 font-mono text-sm">
      
      {/* HEADER: Minimalist Terminal Style */}
      <div className="p-3 border-b border-gray-800 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-white flex items-center gap-2"><Terminal size={16}/> SUPERUSER_CONSOLE</h1>
          <button onClick={openAdd} className="bg-gray-800 text-white px-3 py-1 text-xs border border-gray-600 hover:bg-gray-700">
            [+ NEW ITEM]
          </button>
        </div>
        
        <div className="relative">
          <input 
            className="w-full bg-black border-b border-gray-700 py-2 pl-2 focus:border-white outline-none text-white placeholder:text-gray-700"
            placeholder="> Search item code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* COMPACT LIST VIEW */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.map((item, index) => (
          <div key={item.id} className={`flex items-center p-2 border-b border-gray-900 hover:bg-gray-900/50 transition-colors ${item.quantity === 0 ? 'opacity-50' : ''}`}>
            
            {/* 1. Item Details (Click to Edit) */}
            <div className="flex-1 cursor-pointer" onClick={() => openEdit(item)}>
              <div className="flex items-baseline gap-2">
                <span className="text-emerald-500 font-bold w-12 shrink-0">{item.code || '---'}</span>
                <span className="text-white truncate font-bold">{item.bale_type}</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                <span>BUY:{item.cost_price}</span>
                <span>SELL:{item.sale_price}</span>
                <span>SUP:{item.supplier_mark}</span>
              </div>
            </div>

            {/* 2. Quick Stock Actions (Right Side) */}
            <div className="flex items-center gap-1 bg-gray-950 border border-gray-800 p-1">
              <button onClick={() => handleQuickStock(item, -1)} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800"><Minus size={14}/></button>
              <span className={`w-8 text-center font-bold ${item.quantity > 0 ? 'text-white' : 'text-red-600'}`}>{item.quantity}</span>
              <button onClick={() => handleQuickStock(item, 1)} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800"><Plus size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* RAW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-black border border-gray-600 w-full max-w-md p-4 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X size={20}/></button>
            
            <h2 className="text-white font-bold border-b border-gray-800 pb-2 mb-4">
              {editingId ? `EDIT_ID: ${editingId}` : 'CREATE_NEW_ITEM'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">ITEM_NAME</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white outline-none focus:border-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">CODE</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white outline-none focus:border-white" /></div>
                <div><label className="text-xs uppercase text-gray-500 block mb-1">Supplier</label><input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full bg-gray-900 border border-slate-700 p-2 text-white outline-none focus:border-white" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">COST</label><input type="number" value={form.cost} onChange={e => setForm({...form, cost: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white outline-none focus:border-white" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">PRICE</label><input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white outline-none focus:border-white" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">QTY</label><input type="number" value={form.qty} onChange={e => setForm({...form, qty: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white outline-none focus:border-white" /></div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-800">
              {editingId && <button onClick={handleDelete} className="bg-red-900/30 text-red-500 px-4 py-2 border border-red-900 hover:bg-red-900/50"><Trash2 size={16}/></button>}
              <div className="flex-1"></div>
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-white">CANCEL</button>
              <button onClick={handleSave} className="bg-white text-black px-6 py-2 font-bold hover:bg-gray-200 flex items-center gap-2"><Save size={16}/> SAVE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}