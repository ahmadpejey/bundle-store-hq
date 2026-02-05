import { useEffect, useState } from 'react';
import { InventoryAPI } from './api/inventory';
import type { TransactionPayload } from './api/inventory';
import { Package, TrendingUp, PlusCircle, MinusCircle, User, RefreshCw, Box, PieChart } from 'lucide-react';
// IMPORT RECHARTS
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, Legend } from 'recharts';

// --- COLORS ---
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#64748b'];

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

// --- MAIN APP ---
function App() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null); // New State for Charts
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [operator, setOperator] = useState<any>('Ramadan');
  const [baleList, setBaleList] = useState<string[]>([]);
  
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Parallel Fetching for Speed
      const [statsData, balesData, analyticsData] = await Promise.all([
        InventoryAPI.getDashboardStats(),
        InventoryAPI.getBaleTypes(),
        InventoryAPI.getAnalytics()
      ]);

      if (statsData?.data) setStats(statsData.data);
      setBaleList(balesData?.data || []);
      if (analyticsData?.data) setAnalytics(analyticsData.data);
      
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
      actionType: type, baleType: bale, qty: qty, price: price, operator: operator, remarks: "Dashboard V2"
    };

    await InventoryAPI.logTransaction(payload);
    alert('Success!');
    setSubmitting(false);
    loadData();
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="animate-pulse text-emerald-400 font-mono">LOADING WAR ROOM...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <nav className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg"><Box size={20} className="text-slate-900" /></div>
            <div><h1 className="text-lg font-bold leading-none">BUNDLE HQ</h1><span className="text-xs text-slate-500">War Room v2.0</span></div>
          </div>
          <button onClick={loadData} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 active:rotate-180 transition-all"><RefreshCw size={18} className="text-emerald-400" /></button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        
        {/* OPERATOR & STATS */}
        <div className="bg-slate-900 rounded-xl p-1 flex border border-slate-800">
          {['Ramadan', 'Saiful', 'Syamsul'].map((name) => (
            <button key={name} onClick={() => setOperator(name)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${operator === name ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
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

        {/* --- CHARTS SECTION (NEW) --- */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sales Trend Chart */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
               <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase"><TrendingUp size={16}/> 7-Day Revenue Trend</h3>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={analytics.sales}>
                     <defs>
                       <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `RM${value}`} />
                     <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color:'#fff'}} />
                     <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Inventory Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
               <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase"><PieChart size={16}/> Stock Breakdown</h3>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <RePie>
                     <Pie data={analytics.stock} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       {analytics.stock.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color:'#fff'}} />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize:'12px'}}/>
                   </RePie>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}

        {/* ACTION CENTER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <RefreshCw className="text-emerald-400" /> Control Panel
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
              <button disabled={submitting} onClick={() => { const b = (document.getElementById('baleSelect') as HTMLSelectElement).value; const q = Number((document.getElementById('qtyInput') as HTMLInputElement).value); const p = Number((document.getElementById('priceInput') as HTMLInputElement).value); handleTransaction('SALE', b, q, p); }} className="col-span-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">Make Sale (RM)</button>
              <button disabled={submitting} onClick={() => { const b = (document.getElementById('baleSelect') as HTMLSelectElement).value; const q = Number((document.getElementById('qtyInput') as HTMLInputElement).value); handleTransaction('IN', b, q, 0); }} className="bg-slate-800 hover:bg-blue-600 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform">+ Stock In</button>
              <button disabled={submitting} onClick={() => { const b = (document.getElementById('baleSelect') as HTMLSelectElement).value; const q = Number((document.getElementById('qtyInput') as HTMLInputElement).value); handleTransaction('OUT', b, q, 0); }} className="bg-slate-800 hover:bg-rose-600 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform">- Dispose/Out</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;