import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LayoutDashboard, ShoppingBag, Package, PieChart, FileText } from 'lucide-react';
import PointOfSale from './pages/PointOfSale';
import InventoryManager from './pages/InventoryManager';
import Reports from './pages/Reports';
import Accounting from './pages/Accounting';

export default function App() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'POS', icon: ShoppingBag },
    { path: '/inventory', label: 'Stock', icon: Package },
    { path: '/accounting', label: 'Ledger', icon: FileText },
    { path: '/reports', label: 'Reports', icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* --- GLOBAL HEADER --- */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between min-h-[80px] md:h-20 gap-4 md:gap-0">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                <LayoutDashboard size={24} className="text-slate-950"/>
              </div>
              <div className="leading-tight text-center md:text-left">
                {/* 👇 FIXED LINE BELOW: Self-closing <br /> */}
                <h1 className="font-black text-xl tracking-tight text-white block">
                  STOR BUNDLE<br />WIRA DAMAI
                </h1>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] block">Management System</span>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex justify-center overflow-x-auto pb-1 md:pb-0">
              <div className="flex gap-1 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800/50">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                        isActive 
                          ? 'bg-slate-800 text-emerald-400 shadow-md transform scale-105' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* --- PAGE CONTENT --- */}
      <div className="flex-1 bg-slate-950 relative">
        <Routes>
          <Route path="/" element={<PointOfSale />} />
          <Route path="/inventory" element={<InventoryManager />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>

      <Toaster position="top-center" theme="dark" />
    </div>
  );
}