import { Search, User } from "lucide-react";
import { Input } from "./ui/input";

interface POSHeaderProps {
    search: string;
    setSearch: (val: string) => void;
    operator: string;
    setOperator: (val: string) => void;
}

export function POSHeader({ search, setSearch, operator, setOperator }: POSHeaderProps) {
    return (
        <div className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex flex-col gap-3 shadow-sm">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 rounded-xl"
                        placeholder="Search code or name..."
                    />
                </div>

                <div className="relative shrink-0">
                    <div className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="bg-slate-200 p-1.5 rounded-full">
                            <User size={14} className="text-slate-600" />
                        </div>
                        <div className="flex flex-col items-start mr-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase leading-none">Cashier</span>
                            <span className="text-xs font-bold text-slate-900 leading-none mt-0.5">{operator}</span>
                        </div>
                    </div>
                    <select
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={operator}
                        onChange={(e) => setOperator(e.target.value)}
                    >
                        {['MADAN', 'SAIFUL', 'SAMSUL', 'ADMIN'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}
