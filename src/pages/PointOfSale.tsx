import { useEffect, useState, useRef } from 'react';
import { InventoryAPI } from '../api/inventory';
import { PrintableReceipt } from '../components/PrintableReceipt';
import { ShoppingCart, Package, ChevronUp, Printer, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCard } from '../components/ProductCard';
import { CartItem } from '../components/CartItem';
import { POSHeader } from '../components/POSHeader';
import { PaymentModal } from '../components/PaymentModal';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

export default function PointOfSale() {
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [operator, setOperator] = useState('SAIFUL');
  const [showCartMobile, setShowCartMobile] = useState(false);

  // Payment States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [debtorList, setDebtorList] = useState<string[]>([]);

  // Print State
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadInventory(); loadDebtors(); }, []);

  const loadInventory = async () => { try { const data = await InventoryAPI.getFullInventory(); setItems(data); } catch (e) { toast.error("Connection failed"); } };
  const loadDebtors = async () => { const names = await InventoryAPI.getDebtors(); setDebtorList(names as string[]); };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) { return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i); }
      toast.success(`ADDEED: ${item.bale_type}`, { duration: 1000, position: 'top-center' });
      return [...prev, { ...item, qty: 1, customPrice: item.sale_price }];
    });
  };
  const removeFromCart = (id: number) => { setCart(prev => prev.filter(i => i.id !== id)); };
  const updateQty = (id: number, delta: number) => { setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)); };

  const totalAmountOriginal = cart.reduce((acc, item) => acc + (item.customPrice * item.qty), 0);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  const handleChargeClick = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setIsPaymentModalOpen(true);
  };

  const triggerPrint = () => { if (printRef.current) { window.print(); } };

  const processCheckout = async (paymentMethod: string, details: any) => {
    const { transactionMode, clientName, depositAmount, adjustedTotal, isDelivery, deliveryInfo } = details;

    if (isDelivery && (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address)) return toast.error("Please fill all Delivery details");
    if (transactionMode !== 'PAY' && !clientName && transactionMode !== 'SALE_DETAILS' && !isDelivery) return toast.error("Please enter Client Name!");

    setIsPaymentModalOpen(false);

    const receiptId = await InventoryAPI.getNewReceiptID();
    const loadingToast = toast.loading('Processing...');

    try {
      const finalPayable = Number(adjustedTotal) || totalAmountOriginal;
      const discountRatio = totalAmountOriginal > 0 ? (finalPayable / totalAmountOriginal) : 1;
      const cartToSave = [];

      // Construct Remarks
      let baseRemark = 'POS Sale';
      if (transactionMode === 'RESERVE') baseRemark = `Booking: ${clientName}`;
      else if (transactionMode === 'DEBT') baseRemark = `Hutang: ${clientName}`;
      else if (clientName) baseRemark = `Sale: ${clientName}`;

      if (isDelivery) {
        baseRemark = `Delivery: ${deliveryInfo.name}, ${deliveryInfo.phone}, ${deliveryInfo.address}`;
      }

      for (const item of cart) {
        const dbActionType = (transactionMode === 'SALE_DETAILS' || transactionMode === 'PAY') ? 'SALE' : transactionMode;

        let actualItemSalePrice = item.customPrice * item.qty;
        if (transactionMode === 'SALE_DETAILS' || transactionMode === 'PAY') {
          actualItemSalePrice = actualItemSalePrice * discountRatio;
        } else {
          actualItemSalePrice = (Number(depositAmount) / cart.length);
        }

        const savedItem = { ...item, price: actualItemSalePrice };
        cartToSave.push(savedItem);

        await InventoryAPI.logTransaction({
          actionType: dbActionType,
          baleType: item.bale_type,
          qty: item.qty,
          salePrice: actualItemSalePrice,
          operator: operator,
          remarks: baseRemark,
          paymentMethod: paymentMethod,
          receiptNo: receiptId
        });
      }

      setLastReceipt({
        receiptNo: receiptId,
        date: new Date().toISOString(),
        cashier: operator,
        items: cartToSave,
        total: (transactionMode === 'RESERVE' || transactionMode === 'DEBT') ? Number(depositAmount) : finalPayable,
        paymentMethod: paymentMethod,
        customerName: isDelivery ? deliveryInfo.name : clientName,
        type: 'THERMAL'
      });

      toast.dismiss(loadingToast);
      toast.success('Success!', { description: `Receipt: ${receiptId}` });
      setCart([]);
      setShowCartMobile(false);
      loadInventory();
      loadDebtors();
      setTimeout(() => { if (confirm("Print Receipt?")) { triggerPrint(); } }, 500);

    } catch (e) { toast.dismiss(loadingToast); toast.error('Failed to process transaction'); }
  };

  const sortedAndFilteredItems = items.filter(i => (i.bale_type || '').toLowerCase().includes(search.toLowerCase()) || (i.code || '').toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    if (a.quantity === 0 && b.quantity > 0) return 1;
    if (a.quantity > 0 && b.quantity === 0) return -1;
    return b.quantity - a.quantity;
  });

  return (
    <div className="flex h-full flex-col md:flex-row gap-6 relative">
      <div id="print-root">{lastReceipt && <PrintableReceipt ref={printRef} {...lastReceipt} />}</div>

      {/* --- LEFT: PRODUCTS GRID --- */}
      <div className="flex-1 flex flex-col min-h-0">
        <POSHeader
          search={search}
          setSearch={setSearch}
          operator={operator}
          setOperator={setOperator}
        />

        <div className="flex-1 overflow-y-auto pt-4 pb-20 md:pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {sortedAndFilteredItems.map(item => (
              <ProductCard key={item.id} item={item} onClick={addToCart} />
            ))}
            {sortedAndFilteredItems.length === 0 && (
              <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-400">
                <Package size={40} className="mb-2 opacity-50" />
                <p>No items found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- RIGHT: CART SIDEBAR (DESKTOP) & DRAWER (MOBILE) --- */}

      {/* 1. Mobile Cart Trigger */}
      <div className="md:hidden fixed bottom-16 left-4 right-4 z-40">
        <Button
          onClick={() => setShowCartMobile(true)}
          className="w-full h-14 rounded-full shadow-2xl bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 text-white flex justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-emerald-400" />
            <span className="font-bold">{totalQty} Items</span>
          </div>
          <span className="font-mono font-black text-lg">RM {totalAmountOriginal}</span>
          <ChevronUp size={20} className="animate-bounce" />
        </Button>
      </div>

      {/* 2. Cart Container */}
      <div className={cn(
        "fixed inset-0 z-50 bg-white flex flex-col transition-transform duration-300 ease-out md:relative md:inset-auto md:w-[400px] md:translate-y-0 md:rounded-2xl md:bg-white md:border md:shadow-sm md:h-full md:flex md:flex-col",
        showCartMobile ? "translate-y-0" : "translate-y-full md:translate-y-0"
      )}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 md:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-2 rounded-lg text-white">
              <ShoppingCart size={18} />
            </div>
            <h2 className="font-black text-lg text-slate-900 tracking-tight">Current Bill</h2>
          </div>
          {/* Mobile Close */}
          <Button variant="ghost" size="sm" onClick={() => setShowCartMobile(false)} className="md:hidden">Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <div className="bg-slate-100 p-6 rounded-full"><Package size={48} className="opacity-30" /></div>
              <p className="font-medium text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <CartItem key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeFromCart} />
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t md:rounded-b-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-10">
          <div className="flex justify-between items-end mb-4 px-1">
            <span className="text-slate-500 font-bold text-sm uppercase">Total Payable</span>
            <span className="text-3xl font-black text-slate-900 tracking-tight">RM {totalAmountOriginal}</span>
          </div>

          <div className="grid gap-3">
            {lastReceipt && (
              <Button variant="outline" onClick={triggerPrint} className="w-full gap-2 border-slate-200 hover:bg-slate-50 text-slate-600">
                <Printer size={16} /> Reprint Last
              </Button>
            )}
            <Button
              onClick={handleChargeClick}
              disabled={cart.length === 0}
              className="w-full h-14 text-lg font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 rounded-xl"
            >
              <CreditCard size={20} className="mr-2" />
              CHARGE
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmountOriginal={totalAmountOriginal}
        onProcessCheckout={processCheckout}
        initialClientName=""
        debtorList={debtorList}
      />
    </div>
  );
}