import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Search, ShoppingCart, Trash, Plus, Minus, CreditCard, ChevronDown, User, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function PointOfSale() {
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [operator, setOperator] = useState('SAIFUL');
  const [showCartMobile, setShowCartMobile] = useState(false);

  useEffect(() => { loadInventory(); }, []);

  const loadInventory = async () => {
    try {
      const data = await InventoryAPI.getFullInventory();
      setItems(data);
    } catch (e) { toast.error("Connection failed"); }
  };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      toast.success(`Added ${item.bale_type}`);
      return [...prev, { ...item, qty: 1, customPrice: item.sale_price }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    }));
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    if (!confirm(`Confirm Sale: RM ${cart.reduce((a, b) => a + (b.customPrice * b.qty), 0)}?`)) return;

    try {
      for (const item of cart) {
        await InventoryAPI.logTransaction({
          actionType: 'SALE',
          baleType: item.bale_type,
          qty: item.qty,
          salePrice: item.customPrice * item.qty,
          operator: operator,
          remarks: 'POS Checkout'
        });
      }
      toast.success('Transaction Complete!');
      setCart([]);
      setShowCartMobile(false);
      loadInventory(); 
    } catch (e) {
      toast.error('Checkout Failed');
    }
  };

  const filteredItems = items.filter(i => 
    i.bale_type.toLowerCase().includes(search.toLowerCase()) || 
    i.code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = cart.reduce((acc, item) => acc + (item.customPrice * item.qty), 0);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden relative font-sans">
      
      {/* --- LEFT SECTION: ITEMS GRID --- */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header / Search */}
        <div className="p-3 md:p-4 border-b border-slate-800 flex flex-col gap-3 bg-slate-950 z-10">
          
          {/* 1. OPERATOR SELECTION (Touch-Friendly Bar) */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-3 w-full md:w-fit hover:border-emerald-500/50 transition-colors cursor-pointer">
            {/* Visual Icon */}
            <div className="bg-emerald-500/10 p-1.5 rounded-lg pointer-events-none">
              <User size={16} className="text-emerald-400" />
            </div>
            
            {/* Visual Labels */}
            <div className="flex flex-col pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-500 leading-none mb-0.5">Cashier</span>
              <span className="font-bold text-white text-sm leading-none">{operator}</span>
            </div>
            
            {/* Visual Arrow */}
            <ChevronDown size={14} className="ml-auto text-slate-500 pointer-events-none" />

            {/* THE INVISIBLE OVERLAY (Tap Anywhere Logic) */}
            <select 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none z-10"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            >
              {['MADAN', 'SAIFUL', 'SAMSUL'].map(u => (
                <option key={u} value={u} className="bg-slate-900 text-white">{u}</option>
              ))}
            </select>
          </div>

          {/* 2. SEARCH BAR */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-600 transition-all" 
              placeholder="Search item code or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-3 pb-24 md:pb-4 md:p-4 bg-slate-950">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
            {filteredItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 active:bg-slate-800 p-3 md:p-4 rounded-xl flex flex-col items-start text-left transition-all active:scale-[0.98] group relative overflow-hidden"
              >
                <div className="flex justify-between w-full mb-2">
                  <span className="text-[10px] font-black text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded tracking-wider uppercase">{item.code || 'ITEM'}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.quantity > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {item.quantity} LEFT
                  </span>
                </div>
                
                <h3 className="font-bold text-sm leading-tight text-slate-200 group-hover:text-emerald-400 mb-6 line-clamp-2">{item.bale_type}</h3>
                <div className="mt-auto absolute bottom-3 right-3 md:bottom-4 md:right-4 font-mono text-lg font-bold text-white">
                  <span className="text-xs text-slate-500 mr-1">RM</span>{item.sale_price}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- MOBILE: BOTTOM BAR (Triggers Drawer) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-3 z-40 safe-area-bottom">
        <button 
          onClick={() => setShowCartMobile(true)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl p-1 flex items-center justify-between shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-transform"
        >
          <div className="bg-slate-950/20 rounded-lg px-4 py-3 flex items-center gap-2">
            <ShoppingCart size={20} className="text-slate-900" />
            <span className="font-black text-lg">{totalQty}</span>
          </div>
          <span className="font-black text-xl pr-6">RM {totalAmount}</span>
        </button>
      </div>

      {/* --- RIGHT SECTION: CART DRAWER --- */}
      <div className={`
        fixed inset-0 z-50 bg-slate-950 flex flex-col transition-transform duration-300 ease-out
        md:relative md:inset-auto md:w-[380px] md:translate-y-0 md:border-l md:border-slate-800 md:shadow-2xl
        ${showCartMobile ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
      `}>
        
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="font-bold flex items-center gap-2 text-lg text-white"><ShoppingCart size={20} className="text-emerald-400"/> Current Bill</h2>
          <button onClick={() => setShowCartMobile(false)} className="md:hidden p-2 bg-slate-800 rounded-full hover:bg-slate-700 active:bg-slate-600 text-slate-400">
            <ChevronDown size={24} />
          </button>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
              <Package size={48} className="opacity-20" />
              <p className="font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex flex-col items-center justify-between bg-slate-800 rounded-lg w-10 py-1">
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 text-emerald-400 hover:bg-slate-700 rounded"><Plus size={16}/></button>
                  <span className="font-bold text-sm">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-400 hover:bg-slate-700 rounded"><Minus size={16}/></button>
                </div>
                <div className="flex-1 py-1">
                  <div className="font-bold text-sm text-slate-200 line-clamp-1">{item.bale_type}</div>
                  <div className="text-xs text-slate-500 mt-1">RM {item.customPrice} / unit</div>
                </div>
                <div className="flex flex-col items-end justify-between py-1">
                  <div className="font-mono font-bold text-emerald-400">RM {item.customPrice * item.qty}</div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-rose-400 transition-colors"><Trash size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 safe-area-bottom">
          <div className="flex justify-between items-end mb-4 px-1">
            <span className="text-slate-400 font-medium">Total Payable</span>
            <span className="text-3xl font-black text-white">RM {totalAmount}</span>
          </div>
          <button 
            onClick={checkout}
            disabled={cart.length === 0}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <CreditCard size={20} /> CHARGE
          </button>
        </div>
      </div>
    </div>
  );
}