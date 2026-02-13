import { Package } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface ProductCardProps {
    item: any;
    onClick: (item: any) => void;
}

export function ProductCard({ item, onClick }: ProductCardProps) {
    const isSoldOut = item.quantity === 0;

    return (
        <button
            onClick={() => !isSoldOut && onClick(item)}
            disabled={isSoldOut}
            className={cn(
                "group relative flex flex-col items-start text-left w-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                "bg-white border hover:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md",
                isSoldOut && "opacity-60 bg-slate-50"
            )}
        >
            <div className="absolute top-2 right-2 z-10">
                {isSoldOut ? (
                    <Badge variant="destructive" className="font-bold">SOLD OUT</Badge>
                ) : (
                    <Badge variant="secondary" className="font-bold text-emerald-700 bg-emerald-50 border-emerald-100">{item.quantity} LEFT</Badge>
                )}
            </div>

            <div className="p-4 w-full h-full flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-black text-slate-500 bg-slate-100 border-slate-200">
                        {item.code || 'ITEM'}
                    </Badge>
                </div>

                <div className="flex-1 min-h-[40px]">
                    <h3 className="font-bold text-sm leading-tight text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {item.bale_type}
                    </h3>
                </div>

                <div className="mt-2 flex items-baseline justify-between w-full border-t pt-2 border-dashed border-slate-200">
                    <span className="text-xs text-slate-400 font-medium">Price</span>
                    <span className="font-mono text-lg font-black text-slate-900">
                        <span className="text-xs text-slate-400 mr-1 font-sans font-normal">RM</span>
                        {item.sale_price}
                    </span>
                </div>
            </div>

            {/* Decorative Industrial Strip */}
            <div className="h-1 w-full bg-slate-100 group-hover:bg-emerald-500 transition-colors" />
        </button>
    );
}
