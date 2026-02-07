import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryManager() {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: '', cost: 0, price: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', cost: 0, price: 0, qty: 0 });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const data = await InventoryAPI.getFullInventory();
      setItems(data);
    } catch (e) { toast.error('Failed to load inventory'); }
  };

  const handleAdd = async () => {
    if (!newItem.name) return;
    try {
      await InventoryAPI.addItem(newItem.name, newItem.cost, newItem.price);
      toast.success('Item added');
      setNewItem({ name: '', cost: 0, price: 0 });
      loadItems();
    } catch (e) { toast.error('Error adding item'); }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({ name: item.bale_type, cost: item.cost_price || 0, price: item.sale_price || 0, qty: item.quantity || 0 });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await InventoryAPI.updateItem(editingId, editForm.name, editForm.cost, editForm.price, editForm.qty);
      toast.success('Item updated');
      setEditingId(null);
      loadItems();
    } catch (e) { toast.error('Error updating item'); }
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
    // FIXED: h-full fits into flex-1 container from App.tsx
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
      
      {/* Sub-Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-white">Inventory Manager</h1>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Manage Stock & Prices</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
          {/* Add Item Form */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <div className="md:col-span-1">
              <label className="text-xs text-slate-500 uppercase font-bold ml-1">Item Name</label>
              <input value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Vintage Shirt" className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold ml-1">Modal (RM)</label>
              <input type="number" value={newItem.cost} onChange={(e) => setNewItem({...newItem, cost: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold ml-1">Jual (RM)</label>
              <input type="number" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Plus size={18} /> Add</button>
          </div>

          {/* Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold">
                <tr><th className="p-4">Item Name / Code</th><th className="p-4 text-right">Modal</th><th className="p-4 text-right">Jual</th><th className="p-4 text-right">Stock</th><th className="p-4 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50">
                    <td className="p-4">{editingId === item.id ? <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="bg-slate-950 border border-slate-600 rounded px-2 py-1 text-white w-full" /> : <div><div className="font-bold text-white">{item.bale_type}</div>{item.code && <div className="text-xs text-slate-500">Code: {item.code} | {item.supplier_mark}</div>}</div>}</td>
                    <td className="p-4 text-right text-yellow-500 font-mono">{editingId === item.id ? <input type="number" value={editForm.cost} onChange={(e) => setEditForm({...editForm, cost: Number(e.target.value)})} className="bg-slate-950 border border-slate-600 rounded px-2 py-1 text-white w-20 text-right" /> : item.cost_price}</td>
                    <td className="p-4 text-right text-emerald-400 font-mono">{editingId === item.id ? <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} className="bg-slate-950 border border-slate-600 rounded px-2 py-1 text-white w-20 text-right" /> : item.sale_price}</td>
                    <td className="p-4 text-right font-bold">{editingId === item.id ? <input type="number" value={editForm.qty} onChange={(e) => setEditForm({...editForm, qty: Number(e.target.value)})} className="bg-slate-950 border border-slate-600 rounded px-2 py-1 text-white w-20 text-right" /> : item.quantity}</td>
                    <td className="p-4 flex justify-end gap-2">
                      {editingId === item.id ? <><button onClick={saveEdit} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded"><Save size={16} /></button><button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-700 rounded"><X size={16} /></button></> : <><button onClick={() => startEdit(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"><Edit size={16} /></button><button onClick={() => handleDelete(item.id)} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded"><Trash2 size={16} /></button></>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}