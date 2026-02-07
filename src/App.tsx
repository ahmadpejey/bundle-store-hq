import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Store, ShoppingBag, Package, PieChart, FileText, Menu, X } from 'lucide-react'; 
import PointOfSale from './pages/PointOfSale';
import InventoryManager from './pages/InventoryManager';
import Reports from './pages/Reports';
import Accounting from './pages/Accounting';

export default function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { path: '/', label: 'POS', icon: ShoppingBag },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/accounting', label: 'Accounting', icon: FileText },
    { path: '/reports', label: 'Reports', icon: PieChart },
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      
      {/* --- GLOBAL HEADER (Fixed 80px) --- */}
      <nav className="h-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 shrink-0 z-50 shadow-2xl relative">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
            
            {/* LOGO */}
            <div className="flex items-center gap-3 group cursor-default">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 transform group-hover:scale-105">
                <Store size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
              
              <div className="leading-none">
                <h1 className="font-black text-lg md:text-xl tracking-tight text-white block">
                  STOR BUNDLE<span className="text-emerald-400"></span>
                </h1>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] group-hover:text-emerald-500/70 transition-colors">
                  Wira Damai
                </span>
              </div>
            </div>
            
            {/* DESKTOP NAV (Hidden on Mobile) */}
            <div className="hidden md:flex gap-1 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800/50">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* MOBILE MENU BUTTON (Visible on Mobile) */}
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu size={28} />
            </button>

        </div>
      </nav>

      {/* --- MOBILE MENU DRAWER --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeMenu}></div>
          
          {/* Menu Content */}
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-slate-900 border-l border-slate-800 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center mb-8">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Menu</span>
              <button onClick={closeMenu} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>

            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="mt-auto text-center">
              <p className="text-[10px] text-slate-600 font-regular tracking-[0.1em]">Siregar Family Bundle</p>
              <p className="text-[12px] text-slate-600 font-bold uppercase">Stor Bundle Wira Damai</p>
              <p className="text-[08px] text-slate-600 font-medium">Lorong Berlian 9, Kampung Melayu Wira Damai, 68100 Batu Caves, Selangor.</p>
              <p className="text-[7px] text-slate-600 font-mono italic tracking-[0.05em]">powered by szalted</p>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE CONTENT --- */}
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