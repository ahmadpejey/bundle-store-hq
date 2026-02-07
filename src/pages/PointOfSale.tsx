// ... (imports remain the same)
import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { Search, ShoppingCart, Trash, Plus, Minus, CreditCard, ChevronDown, User, Package, QrCode, Banknote, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function PointOfSale() {
  const [items, setItems] = useState<any[]>([]);
  // ... (state lainnya sama)
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [operator, setOperator] = useState('SAIFUL');
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => { loadInventory(); }, []);

  const loadInventory = async () => {
    try {
      const data = await InventoryAPI.getFullInventory();
      setItems(data);
    } catch (e) { toast.error("Connection failed"); }
  };

  // ... (fungsi addToCart, checkout, dll sama)
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      toast.success(`Added ${item.bale_type}`);
      return [...prev, { ...item, qty: 1, customPrice: item.sale_price }];
    });
  };

  const removeFromCart = (id: number) => { setCart(prev => prev.filter(i => i.id !== id)); };
  const updateQty = (id: number, delta: number) => { setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)); };
  const handleChargeClick = () => { if (cart.length === 0) return toast.error("Cart is empty"); setIsPaymentModalOpen(true); };

  const processCheckout = async (paymentMethod: string) => {
    setIsPaymentModalOpen(false);
    const loadingToast = toast.loading(`Processing ${paymentMethod}...`);
    try {
      for (const item of cart) {
        await InventoryAPI.logTransaction({
          actionType: 'SALE', baleType: item.bale_type, qty: item.qty, salePrice: item.customPrice * item.qty,
          operator: operator, remarks: 'POS Checkout', paymentMethod: paymentMethod
        });
      }
      toast.dismiss(loadingToast);
      toast.success('Transaction Complete!');
      setCart([]); setShowCartMobile(false); loadInventory(); 
    } catch (e) { toast.dismiss(loadingToast); toast.error('Checkout Failed'); }
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.customPrice * item.qty), 0);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  // UPDATED SORTING LOGIC
  const sortedAndFilteredItems = items
    .filter(i => (i.bale_type || '').toLowerCase().includes(search.toLowerCase()) || (i.code || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // 1. Move out-of-stock (0 qty) to the bottom
      if (a.quantity === 0 && b.quantity > 0) return 1;
      if (a.quantity > 0 && b.quantity === 0) return -1;
      
      // 2. Sort by highest quantity first (High Stock -> Low Stock)
      return b.quantity - a.quantity;
    });

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-950 text-white relative font-sans">
      
      {/* LEFT SECTION */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        <div className="p-3 md:p-4 border-b border-slate-800 flex flex-col gap-3 bg-slate-900/50 z-10 shrink-0">
          {/* Operator & Search UI (Sama seperti sebelumnya) */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-3 w-full md:w-fit cursor-pointer">
            <div className="bg-emerald-500/10 p-1.5 rounded-lg"><User size={16} className="text-emerald-400" /></div>
            <div className="flex flex-col"><span className="text-[10px] uppercase font-bold text-slate-500 leading-none mb-0.5">Cashier</span><span className="font-bold text-white text-sm leading-none">{operator}</span></div>
            <ChevronDown size={14} className="ml-auto text-slate-500" />
            <select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" value={operator} onChange={(e) => setOperator(e.target.value)}>
              {['MADAN', 'SAIFUL', 'SAMSUL'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Search item..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pb-24 md:pb-4 md:p-4 bg-slate-950">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
            {sortedAndFilteredItems.map(item => (
              <button key={item.id} onClick={() => addToCart(item)} className={`bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 active:bg-slate-800 p-3 md:p-4 rounded-xl flex flex-col items-start text-left transition-all active:scale-[0.98] group relative overflow-hidden ${item.quantity === 0 ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex justify-between w-full mb-2">
                  <span className="text-[10px] font-black text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded tracking-wider uppercase">{item.code || 'ITEM'}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.quantity > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{item.quantity > 0 ? `${item.quantity} LEFT` : 'SOLD OUT'}</span>
                </div>
                <h3 className="font-bold text-sm leading-tight text-slate-200 group-hover:text-emerald-400 mb-6 line-clamp-2">{item.bale_type}</h3>
                <div className="mt-auto absolute bottom-3 right-3 md:bottom-4 md:right-4 font-mono text-lg font-bold text-white"><span className="text-xs text-slate-500 mr-1">RM</span>{item.sale_price}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE TRIGGER & CART DRAWER (Sama seperti sebelumnya) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-3 z-40 safe-area-bottom">
        <button onClick={() => setShowCartMobile(true)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl p-1 flex items-center justify-between shadow-lg active:scale-[0.99]">
          <div className="bg-slate-950/20 rounded-lg px-4 py-3 flex items-center gap-2"><ShoppingCart size={20} className="text-slate-900" /><span className="font-black text-lg">{totalQty}</span></div>
          <span className="font-black text-xl pr-6">RM {totalAmount}</span>
        </button>
      </div>

      <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col transition-transform duration-300 ease-out md:relative md:inset-auto md:w-[380px] md:translate-y-0 md:border-l md:border-slate-800 md:shadow-2xl ${showCartMobile ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <h2 className="font-bold flex items-center gap-2 text-lg text-white"><ShoppingCart size={20} className="text-emerald-400"/> Current Bill</h2>
          <button onClick={() => setShowCartMobile(false)} className="md:hidden p-2 bg-slate-800 rounded-full text-slate-400"><ChevronDown size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950 min-h-0">
          {cart.map(item => (
            <div key={item.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 flex gap-3">
              <div className="flex flex-col items-center justify-between bg-slate-800 rounded-lg w-10 py-1">
                <button onClick={() => updateQty(item.id, 1)} className="p-1 text-emerald-400 hover:bg-slate-700 rounded"><Plus size={16}/></button>
                <span className="font-bold text-sm">{item.qty}</span>
                <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-400 hover:bg-slate-700 rounded"><Minus size={16}/></button>
              </div>
              <div className="flex-1 py-1"><div className="font-bold text-sm text-slate-200 line-clamp-1">{item.bale_type}</div><div className="text-xs text-slate-500 mt-1">RM {item.customPrice} / unit</div></div>
              <div className="flex flex-col items-end justify-between py-1"><div className="font-mono font-bold text-emerald-400">RM {item.customPrice * item.qty}</div><button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-rose-400"><Trash size={16}/></button></div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-900 border-t border-slate-800 safe-area-bottom shrink-0">
          <div className="flex justify-between items-end mb-4 px-1"><span className="text-slate-400 font-medium">Total Payable</span><span className="text-3xl font-black text-white">RM {totalAmount}</span></div>
          <button onClick={handleChargeClick} disabled={cart.length === 0} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"><CreditCard size={20} /> CHARGE</button>
        </div>
      </div>

      {/* PAYMENT MODAL (Sama) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-6">
            <div className="text-center"><h2 className="text-2xl font-black text-white">Select Payment</h2><p className="text-slate-400 text-sm mt-1">How is the customer paying?</p></div>
            <div className="grid gap-3">
              <button onClick={() => processCheckout('CASH')} className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 group hover:border-emerald-500/50"><div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400"><Banknote size={24} /></div><span className="font-bold text-lg">Cash</span></button>
              <button onClick={() => processCheckout('QR_PAY')} className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 group hover:border-pink-500/50"><div className="bg-pink-500/10 p-3 rounded-lg text-pink-400"><QrCode size={24} /></div><span className="font-bold text-lg">QR Pay</span></button>
              <button onClick={() => processCheckout('TRANSFER')} className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 group hover:border-blue-500/50"><div className="bg-blue-500/10 p-3 rounded-lg text-blue-400"><Smartphone size={24} /></div><span className="font-bold text-lg">Transfer</span></button>
            </div>
            <button onClick={() => setIsPaymentModalOpen(false)} className="w-full py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}