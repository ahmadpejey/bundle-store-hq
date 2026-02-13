import { Minus, Plus, Trash } from "lucide-react";

interface CartItemProps {
    item: any;
    onUpdateQty: (id: number, delta: number) => void;
    onRemove: (id: number) => void;
}

export function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
    return (
        <div className="flex gap-3 p-3 bg-white border rounded-xl shadow-sm group">

            {/* Qty Controls */}
            <div className="flex flex-col items-center justify-between bg-slate-50 border rounded-lg w-10 py-1 shrink-0">
                <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                >
                    <Plus size={14} strokeWidth={3} />
                </button>

                <span className="font-mono font-bold text-sm text-slate-900">{item.qty}</span>

                <button
                    onClick={() => onUpdateQty(item.id, -1)}
                    className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                >
                    <Minus size={14} strokeWidth={3} />
                </button>
            </div>

            {/* Info */}
            <div className="flex-1 py-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight mb-1">
                    {item.bale_type}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                    RM {item.customPrice} / unit
                </div>
            </div>

            {/* Total & Action */}
            <div className="flex flex-col items-end justify-between py-1">
                <div className="font-mono font-black text-slate-900">
                    RM {item.customPrice * item.qty}
                </div>
                <button
                    onClick={() => onRemove(item.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                >
                    <Trash size={16} />
                </button>
            </div>
        </div>
    );
}
