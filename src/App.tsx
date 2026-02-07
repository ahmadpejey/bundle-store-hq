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
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/accounting', label: 'Accounting', icon: FileText },
    { path: '/reports', label: 'Reports', icon: PieChart },
  ];

  return (
    // 👇 FIXED: h-screen + overflow-hidden prevents the page from growing too long
    <div className="h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      
      {/* Header */}
      <nav className="h-20 bg-slate-900 border-b border-slate-800 shrink-0 z-50 shadow-2xl relative">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                <LayoutDashboard size={24} className="text-slate-950"/>
              </div>
              <div className="leading-tight">
                <h1 className="font-black text-lg md:text-xl tracking-tight text-white block leading-none">
                  STOR BUNDLE<br/><span className="text-emerald-400">WIRA DAMAI</span>
                </h1>
              </div>
            </div>
            <div className="flex gap-1 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800/50 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-slate-800 text-emerald-400 shadow-md transform scale-105' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className={isActive ? 'inline' : 'hidden md:inline'}>{item.label}</span>
                  </Link>
                )
              })}
            </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="flex-1 overflow-hidden relative bg-slate-950">
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