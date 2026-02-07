import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

export default function Reports() {
  const [range, setRange] = useState<'day'|'week'|'month'|'year'>('week');
  const [data, setData] = useState<any[]>([]);

  useEffect(() => { loadStats(); }, [range]);

  const loadStats = async () => {
    const res = await InventoryAPI.getProfitAnalytics(range);
    setData(res || []); // Ensure it never crashes on null
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
      <div className="p-4 border-b border-slate-800 bg-slate-900 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp /> Business Analytics</h1>
        <div className="flex gap-2 bg-slate-950 w-fit p-1 rounded-lg border border-slate-800 mt-2">
          {['day', 'week', 'month', 'year'].map((r) => (
            <button key={r} onClick={() => setRange(r as any)} className={`px-4 py-1 rounded-md text-xs font-bold capitalize transition-all ${range === r ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 flex items-center gap-2"><DollarSign size={16}/> Revenue vs Profit vs Cost</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `RM${val}`}/>
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color:'#fff'}} cursor={{fill: '#334155', opacity: 0.4}} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="cost" name="Cost (Modal)" fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}