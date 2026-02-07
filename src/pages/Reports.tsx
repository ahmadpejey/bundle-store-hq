import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState<any[]>([]);
  
  // Set default to last 7 days
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(lastWeek);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => { loadStats(); }, [startDate, endDate]);

  const loadStats = async () => {
    const res = await InventoryAPI.getProfitAnalytics(startDate, endDate);
    setData(res || []);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
      <div className="p-4 border-b border-slate-800 bg-slate-900 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp /> Business Analytics</h1>
        
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <Calendar size={16} className="text-slate-500 ml-2" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs text-white outline-none p-1" />
          <span className="text-slate-600">-</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs text-white outline-none p-1" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 flex items-center gap-2">
              <DollarSign size={16}/> Revenue vs Profit Overview
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `RM${val}`}/>
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color:'#fff'}} cursor={{stroke: '#64748b', strokeWidth: 1}} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}