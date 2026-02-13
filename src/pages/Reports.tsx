import { useEffect, useState } from 'react';
import { InventoryAPI } from '../api/inventory';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Calendar, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Reports() {
  const [data, setData] = useState<any[]>([]);

  // Set default to last 7 days
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(lastWeek);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => { loadStats(); }, [startDate, endDate]);

  const loadStats = async () => {
    try {
      const res = await InventoryAPI.getProfitAnalytics(startDate, endDate);
      setData(res || []);
    } catch (e) {
      toast.error("Failed to load analytics");
    }
  };

  const totalRevenue = data.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalProfit = data.reduce((acc, curr) => acc + (curr.profit || 0), 0);

  return (
    <div className="flex flex-col h-full space-y-4">

      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ANALYTICS</h1>
          <p className="text-slate-500 text-sm font-medium">Business performance & insights</p>
        </div>

        <Card className="p-2 flex items-center gap-2 bg-white border-slate-200 shadow-sm">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="h-9 w-32 pl-8 text-xs border-none bg-transparent focus-visible:ring-0"
            />
          </div>
          <div className="text-slate-300 font-bold">-</div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <Input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="h-9 w-32 pl-8 text-xs border-none bg-transparent focus-visible:ring-0"
            />
          </div>
        </Card>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900 text-white border-none shadow-lg">
          <div className="flex items-center gap-2 mb-1 opacity-70">
            <DollarSign size={14} />
            <span className="text-[10px] font-bold uppercase">Total Revenue</span>
          </div>
          <div className="text-2xl font-black">RM {totalRevenue.toLocaleString()}</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-emerald-600">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase">Net Profit</span>
          </div>
          <div className="text-2xl font-black text-slate-900">RM {totalProfit.toLocaleString()}</div>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <Card className="col-span-1 lg:col-span-3 bg-white border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <BarChart3 size={16} /> Revenue vs Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `RM${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0f172a" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}