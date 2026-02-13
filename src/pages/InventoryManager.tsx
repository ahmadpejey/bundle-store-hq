import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Trash2, Edit, Plus, Search, Package, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { cn } from '../lib/utils';

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
      setItems(data || []);
    } catch (e) { toast.error('Failed to load inventory'); }
  };

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

  const totalBales = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const totalStockValue = items.reduce((acc, item) => acc + ((item.cost_price || 0) * (item.quantity || 0)), 0);

  return (
    <div className="flex flex-col h-full space-y-4">

      {/* HEADER & STATS */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">INVENTORY</h1>
          <p className="text-slate-500 text-sm font-medium">Manage stock levels and pricing</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Card className="p-3 flex-1 md:w-40 bg-slate-900 text-white border-none shadow-lg">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Stock</div>
            <div className="text-2xl font-black">{totalBales} <span className="text-sm font-medium text-slate-500">units</span></div>
          </Card>
          <Card className="p-3 flex-1 md:w-40 bg-white border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-slate-500">Value</div>
            <div className="text-2xl font-black text-slate-900">RM {(totalStockValue / 1000).toFixed(1)}k</div>
          </Card>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-xl border shadow-sm sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="pl-10 bg-slate-50 border-slate-200"
          />
        </div>
        <Button onClick={openAddModal} className="shrink-0 bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={18} className="mr-2" /> New Item
        </Button>
      </div>

      {/* TABLE / LIST */}
      <div className="flex-1 overflow-hidden bg-white border rounded-xl shadow-sm flex flex-col">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b text-xs font-black uppercase text-slate-500 select-none">
          <div className="col-span-1 cursor-pointer hover:text-slate-800" onClick={() => handleSort('code')}>Code <ArrowUpDown size={12} className="inline" /></div>
          <div className="col-span-4 cursor-pointer hover:text-slate-800" onClick={() => handleSort('bale_type')}>Item Name <ArrowUpDown size={12} className="inline" /></div>
          <div className="col-span-2 text-right cursor-pointer hover:text-slate-800" onClick={() => handleSort('cost_price')}>Cost <ArrowUpDown size={12} className="inline" /></div>
          <div className="col-span-2 text-right cursor-pointer hover:text-slate-800" onClick={() => handleSort('sale_price')}>Price <ArrowUpDown size={12} className="inline" /></div>
          <div className="col-span-2 text-center cursor-pointer hover:text-slate-800" onClick={() => handleSort('quantity')}>Stock <ArrowUpDown size={12} className="inline" /></div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package size={48} className="opacity-20 mb-4" />
              <p>No items found matching "{search}"</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredItems.map((item) => (
                <div key={item.id} className="group hover:bg-slate-50 transition-colors">
                  {/* Desktop Row */}
                  <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center">
                    <div className="col-span-1 font-mono text-xs font-bold text-slate-500">{item.code || '--'}</div>
                    <div className="col-span-4 font-bold text-slate-900">{item.bale_type}</div>
                    <div className="col-span-2 text-right font-mono text-slate-600 text-sm">{item.cost_price}</div>
                    <div className="col-span-2 text-right font-mono font-bold text-emerald-600 text-sm">{item.sale_price}</div>
                    <div className="col-span-2 flex justify-center">
                      <div className={cn("px-2.5 py-1 rounded-full text-xs font-black min-w-[3rem] text-center", item.quantity > 5 ? "bg-slate-100 text-slate-600" : item.quantity > 0 ? "bg-yellow-100 text-yellow-700" : "bg-rose-100 text-rose-600")}>
                        {item.quantity}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEditModal(item)}><Edit size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
                    </div>
                  </div>

                  {/* Mobile Row */}
                  <div className="md:hidden p-4 flex justify-between items-center active:bg-slate-100" onClick={() => openEditModal(item)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-500 border-slate-200">{item.code || 'NA'}</Badge>
                        {item.quantity < 3 && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">LOW</Badge>}
                      </div>
                      <div className="font-bold text-slate-900 line-clamp-1">{item.bale_type}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">RM {item.sale_price} / unit</div>
                    </div>
                    <div className="flex flex-col items-center ml-4">
                      <div className={cn("text-xl font-black", item.quantity > 0 ? "text-emerald-600" : "text-rose-500")}>{item.quantity}</div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Stock</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item' : 'New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item Name" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Code</label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SKU Code" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Supplier</label>
              <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier Name" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Cost (RM)</label>
                <Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Price (RM)</label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Qty</label>
                <div className="flex items-center">
                  <Button variant="outline" size="icon" className="h-10 w-8 rounded-r-none border-r-0" onClick={() => setForm({ ...form, qty: Math.max(0, form.qty - 1) })}>-</Button>
                  <div className="h-10 flex-1 flex items-center justify-center border-y border-input font-bold">{form.qty}</div>
                  <Button variant="outline" size="icon" className="h-10 w-8 rounded-l-none border-l-0" onClick={() => setForm({ ...form, qty: form.qty + 1 })}>+</Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}