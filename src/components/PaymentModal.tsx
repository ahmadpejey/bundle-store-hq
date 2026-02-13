import { useState, useEffect } from "react";
import { Banknote, BookUser, Calculator, Clock, QrCode, Smartphone, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmountOriginal: number;
    onProcessCheckout: (paymentMethod: string, details: any) => void;
    initialClientName: string;
    debtorList: string[];
}

export function PaymentModal({ isOpen, onClose, totalAmountOriginal, onProcessCheckout, initialClientName, debtorList }: PaymentModalProps) {
    const [transactionMode, setTransactionMode] = useState<'PAY' | 'RESERVE' | 'DEBT' | 'SALE_DETAILS'>('PAY');
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [clientName, setClientName] = useState(initialClientName);
    const [depositAmount, setDepositAmount] = useState('');
    const [adjustedTotal, setAdjustedTotal] = useState<string>('');
    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryInfo, setDeliveryInfo] = useState({ name: '', phone: '', address: '' });
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setTransactionMode('PAY');
            setSelectedMethod('');
            setClientName(initialClientName);
            setDepositAmount('');
            setIsDelivery(false);
            setDeliveryInfo({ name: '', phone: '', address: '' });
            setAdjustedTotal(totalAmountOriginal.toString());
        }
    }, [isOpen, totalAmountOriginal, initialClientName]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setClientName(val);
        if (val.length > 0) {
            setFilteredSuggestions(debtorList.filter(name => name.toLowerCase().includes(val.toLowerCase())));
        } else {
            setFilteredSuggestions([]);
        }
    };

    const selectSuggestion = (name: string) => { setClientName(name); setFilteredSuggestions([]); };

    const handlePaymentMethodSelect = (method: string) => {
        setSelectedMethod(method);
        setTransactionMode('SALE_DETAILS');
    };

    const handleSubmit = () => {
        onProcessCheckout(selectedMethod || 'DEPOSIT', {
            transactionMode,
            clientName,
            depositAmount,
            adjustedTotal,
            isDelivery,
            deliveryInfo
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-50 border-b">
                    <DialogTitle className="text-xl font-black text-slate-900 text-center uppercase tracking-tight">
                        {transactionMode === 'PAY' ? 'Select Payment' : transactionMode === 'SALE_DETAILS' ? 'Checkout' : transactionMode === 'RESERVE' ? 'Booking' : 'Hutang'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {transactionMode === 'PAY' ? (
                        <div className="grid gap-3">
                            <button onClick={() => handlePaymentMethodSelect('CASH')} className="flex items-center gap-4 bg-white hover:bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 transition-all group">
                                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Banknote size={24} /></div>
                                <span className="font-bold text-lg text-slate-700 group-hover:text-slate-900">Cash</span>
                            </button>
                            <button onClick={() => handlePaymentMethodSelect('QR_PAY')} className="flex items-center gap-4 bg-white hover:bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-pink-500 transition-all group">
                                <div className="bg-pink-100 p-3 rounded-lg text-pink-600 group-hover:bg-pink-500 group-hover:text-white transition-colors"><QrCode size={24} /></div>
                                <span className="font-bold text-lg text-slate-700 group-hover:text-slate-900">QR Pay</span>
                            </button>
                            <button onClick={() => handlePaymentMethodSelect('TRANSFER')} className="flex items-center gap-4 bg-white hover:bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 transition-all group">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors"><Smartphone size={24} /></div>
                                <span className="font-bold text-lg text-slate-700 group-hover:text-slate-900">Transfer</span>
                            </button>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <button onClick={() => setTransactionMode('RESERVE')} className="bg-white p-3 rounded-xl border-2 border-slate-100 hover:border-yellow-400 hover:bg-yellow-50 transition-all flex flex-col items-center gap-1 group">
                                    <Clock size={20} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold text-slate-600">Booking</span>
                                </button>
                                <button onClick={() => setTransactionMode('DEBT')} className="bg-white p-3 rounded-xl border-2 border-slate-100 hover:border-rose-400 hover:bg-rose-50 transition-all flex flex-col items-center gap-1 group">
                                    <BookUser size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold text-slate-600">Hutang</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Delivery Option */}
                            <div onClick={() => setIsDelivery(!isDelivery)} className={cn("p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-colors", isDelivery ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100')}>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Truck size={18} className={isDelivery ? 'text-blue-500' : 'text-slate-400'} /> Delivery Order
                                </div>
                                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", isDelivery ? 'bg-blue-500 border-blue-500' : 'border-slate-300')}>
                                    {isDelivery && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                </div>
                            </div>

                            {isDelivery ? (
                                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <Input value={deliveryInfo.name} onChange={e => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })} placeholder="Recipient Name" className="bg-white" />
                                    <Input value={deliveryInfo.phone} onChange={e => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })} placeholder="Phone Number" className="bg-white" />
                                    <textarea value={deliveryInfo.address} onChange={e => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })} className="w-full bg-white border border-input rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-20" placeholder="Full Address" />
                                </div>
                            ) : (
                                <div className="relative">
                                    <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Customer (Optional)</label>
                                    <Input autoFocus value={clientName} onChange={handleNameChange} placeholder="Name..." />
                                    {filteredSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-32 overflow-y-auto">
                                            {filteredSuggestions.map((name, idx) => (
                                                <button key={idx} onClick={() => selectSuggestion(name)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-900">{name}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {transactionMode === 'SALE_DETAILS' ? (
                                <div className="bg-slate-900 p-4 rounded-xl text-white">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs uppercase font-bold text-slate-400">Total Amount</label>
                                        <span className="text-xs text-slate-500 line-through">RM {totalAmountOriginal}</span>
                                    </div>
                                    <div className="relative flex items-center gap-2">
                                        <span className="text-emerald-400 font-black text-xl">RM</span>
                                        <input
                                            type="number"
                                            value={adjustedTotal}
                                            onChange={(e) => setAdjustedTotal(e.target.value)}
                                            className="flex-1 bg-transparent text-3xl font-black text-white outline-none placeholder:text-slate-600 focus:text-emerald-400 transition-colors"
                                            placeholder={totalAmountOriginal.toString()}
                                        />
                                        <Calculator size={20} className="text-slate-500" />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Deposit / Paid (RM)</label>
                                    <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0" className="text-lg font-bold" />
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                className={cn(
                                    "w-full font-black py-6 rounded-xl mt-2 text-lg shadow-lg hover:bg-opacity-90",
                                    transactionMode === 'RESERVE' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                                        transactionMode === 'DEBT' ? 'bg-rose-500 text-white hover:bg-rose-600' :
                                            'bg-emerald-600 text-white hover:bg-emerald-700'
                                )}
                            >
                                Confirm & Print
                            </Button>

                            <Button variant="ghost" onClick={() => setTransactionMode('PAY')} className="w-full text-slate-400">Back to Payment</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
