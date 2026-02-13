import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Store, ShoppingBag, Package, PieChart, FileText, Menu, X, User } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const navItems = [
        { path: '/', label: 'POS', icon: ShoppingBag },
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/accounting', label: 'Accounting', icon: FileText },
        { path: '/reports', label: 'Reports', icon: PieChart },
    ];

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex w-64 flex-col border-r bg-white shadow-sm z-50">
                <div className="h-16 flex items-center px-6 border-b">
                    <Store className="h-6 w-6 text-slate-900 mr-2" />
                    <span className="font-bold text-lg tracking-tight">BUNDLE HQ</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <Icon size={18} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <User size={16} className="text-slate-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900">Operator</span>
                            <span className="text-[10px] text-slate-500">Wira Damai</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col h-full min-h-0 relative">

                {/* MOBILE HEADER */}
                <header className="md:hidden h-16 bg-white border-b flex items-center justify-between px-4 shrink-0 z-40">
                    <div className="flex items-center gap-2">
                        <Store className="h-6 w-6 text-slate-900" />
                        <span className="font-bold text-lg tracking-tight">BUNDLE HQ</span>
                    </div>

                    {/* Hamburger - Only if we really need a drawer, but we have bottom nav now. 
               Let's keep it for "More" options or User profile later. */}
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </header>

                {/* CONTENT SCROLLABLE */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 pb-24 md:pb-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>

                {/* --- MOBILE BOTTOM NAV --- */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t h-16 z-50 flex items-center justify-around px-2 pb-safe">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform",
                                    isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <div className={cn("p-1.5 rounded-full transition-colors", isActive && "bg-slate-100")}>
                                    <Icon size={20} className={cn(isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Mobile Menu Drawer (Optional/Extra) */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-[60] md:hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                        <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right">
                            <div className="flex justify-between items-center mb-8">
                                <span className="font-bold text-lg">Menu</span>
                                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}><X /></Button>
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Additional menu items can go here (Settings, Profile, Logout, etc)</p>
                                <Button variant="outline" className="w-full justify-start">Settings</Button>
                                <Button variant="destructive" className="w-full justify-start">Logout</Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
