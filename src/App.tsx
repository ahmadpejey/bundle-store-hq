import { useEffect, useState } from 'react';
import { InventoryAPI } from './api/inventory';
import type { TransactionPayload } from './api/inventory';
import { Package, TrendingUp, PlusCircle, MinusCircle, User, History, RefreshCw, Box } from 'lucide-react';

// --- UI COMPONENTS ---

const StatCard = ({ title, value, sub, color, icon: Icon }: any) => (
  <div className={`relative overflow-hidden p-6 rounded-2xl text-white shadow-xl ${color}`}>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-sm font-medium opacity-90 mb-1 tracking-wide uppercase">{title}</p>
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
      </div>
      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
        <Icon size={28} />
      </div>
    </div>
    <p className="relative z-10 text-xs mt-4 opacity-80 font-medium bg-black/10 inline-block px-2 py-1 rounded">{sub}</p>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
  </div>
);

// --- MAIN DASHBOARD ---

function App() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [operator, setOperator] = useState<any>('Ramadan');
  const [baleList, setBaleList] = useState<string[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await InventoryAPI.getDashboardStats();
      if (statsData?.data) setStats(statsData.data);
      
      const balesData = await InventoryAPI.getBaleTypes();
      setBaleList(balesData?.data || []);
    } catch (e) {
      console.error("Connection Error:", e);
    }
    setLoading(false);
  };

  const handleTransaction = async (type: 'IN' | 'OUT' | 'SALE', bale: string, qty: number, price: number) => {
    if (submitting) return;
    if (qty <= 0) return alert("Qty must be positive");
    if (type === 'SALE' && price <= 0) return alert("Please enter price");

    if (!confirm(`Confirm ${type} for ${qty}x ${bale}?`)) return;

    setSubmitting(true);
    const payload: TransactionPayload = {
      actionType: type,
      baleType: bale,
      qty: qty,
      price: price,
      operator: operator,
      remarks: "Dashboard Entry"
    };

    await InventoryAPI.logTransaction(payload);
    alert('Success!');
    setSubmitting(false);
    loadData();
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="animate-pulse text-emerald-400 font-mono">CONNECTING TO HQ...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <nav className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Box size={20} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">BUNDLE HQ</h1>
              <span className="text-xs text-slate-500">Inventory System v1.0</span>
            </div>
          </div>
          <button onClick={loadData} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 active:rotate-180 transition-all">
            <RefreshCw size={18} className="text-emerald-400" />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="bg-slate-900 rounded-xl p-1 flex border border-slate-800">
          {['Ramadan', 'Saiful', 'Syamsul'].map((name) => (
            <button
              key={name}
              onClick={() => setOperator(name)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                operator === name ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <User size={14} /> {name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Balance" value={stats?.balance || 0} sub="In Warehouse" color="bg-blue-600" icon={Package} />
          <StatCard title="Sales" value={`RM ${stats?.salesToday || 0}`} sub="Today's Rev" color="bg-emerald-600" icon={TrendingUp} />
          <StatCard title="Stock In" value={stats?.inToday || 0} sub="New Arrivals" color="bg-violet-600" icon={PlusCircle} />
          <StatCard title="Stock Out" value={stats?.outToday || 0} sub="Sold/Disposed" color="bg-rose-600" icon={MinusCircle} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" /> Record Transaction
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Item</label>
              <select id="baleSelect" className="w-full bg-slate-950 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg">
                {baleList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Qty</label>
                <input id="qtyInput" type="number" defaultValue={1} className="w-full bg-slate-950 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-bold text-center" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total RM</label>
                <input id="priceInput" type="number" placeholder="0" className="w-full bg-slate-950 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-bold text-center" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                disabled={submitting}
                onClick={() => {
                   const b = (document.getElementById('baleSelect') as HTMLSelectElement).value;
                   const q = Number((document.getElementById('qtyInput') as HTMLInputElement).value);
                   const p = Number((document.getElementById('priceInput') as HTMLInputElement).value);
                   handleTransaction('SALE', b, q, p);
                }}
                className="col-span-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                 Make Sale (RM)
              </button>
              
              <button 
                disabled={submitting}
                onClick={() => {
                   const b = (document.getElementById('baleSelect') as HTMLSelectElement).value;
                   const q = Number((document.getElementById('qtyInput') as HTMLInputElement).value);
                   handleTransaction('IN', b, q, 0);
                }}
                className="bg-slate-800 hover:bg-blue-600 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform"
              >
                + Stock In
              </button>

              <button 
                disabled={submitting}
                onClick={() => {
                   const b = (document.getElementById('baleSelect') as HTMLSelectElement).value;
                   const q = Number((document.getElementById('qtyInput') as HTMLInputElement).value);
                   handleTransaction('OUT', b, q, 0);
                }}
                className="bg-slate-800 hover:bg-rose-600 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform"
              >
                - Dispose/Out
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-600 mt-2">
              Action logged as: <span className="text-emerald-400 font-bold">{operator}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;