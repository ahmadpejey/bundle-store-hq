import { forwardRef } from 'react';

interface ReceiptProps {
  receiptNo: string;
  date: string;
  cashier: string;
  items: any[];
  total: number;
  paymentMethod: string;
  customerName?: string;
  type: 'THERMAL' | 'A4';
}

export const PrintableReceipt = forwardRef<HTMLDivElement, ReceiptProps>((props, ref) => {
  const { receiptNo, date, cashier, items, total, paymentMethod, customerName, type } = props;

  // Optimized styles for Thermal Printer
  // Uses 58mm width content centered in 80mm container for safety
  const containerClass = type === 'THERMAL' 
    ? "w-[80mm] p-4 font-mono text-[10px] leading-tight text-black bg-white mx-auto" 
    : "w-[210mm] min-h-[297mm] p-12 font-sans text-sm text-black bg-white mx-auto";

  return (
    <div className="hidden print:block absolute top-0 left-0 z-[9999] bg-white w-full h-full">
      <div ref={ref} className={containerClass}>
        
        {/* --- HEADER --- */}
        <div className="text-center mb-3">
          <h1 className="font-bold text-sm mb-1 uppercase tracking-wider">STOR BUNDLE WIRA DAMAI</h1>
          <p>Lorong Berlian 9, Kg Melayu Wira Damai</p>
          <p>68100 Batu Caves, Selangor</p>
          <p>Tel: +60 12-906 2268</p>
        </div>

        <div className="border-b border-black border-dashed my-2"></div>

        {/* --- META INFO --- */}
        <div className="flex justify-between mb-1">
          <span>Date: {new Date(date).toLocaleDateString()}</span>
          <span>Time: {new Date(date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>No: {receiptNo}</span>
          <span>Staff: {cashier}</span>
        </div>
        {customerName && (
           <div className="mb-1 font-bold uppercase">Cust: {customerName}</div>
        )}

        <div className="border-b border-black border-dashed my-2"></div>

        {/* --- ITEMS TABLE --- */}
        <table className="w-full text-left mb-2">
          <thead>
            <tr>
              <th className="py-1 w-[50%]">Item</th>
              <th className="py-1 text-center w-[20%]">Qty</th>
              <th className="py-1 text-right w-[30%]">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="py-1 pr-1 align-top">{item.bale_type}</td>
                <td className="py-1 text-center align-top">{item.qty}</td>
                <td className="py-1 text-right align-top">{(item.price || item.salePrice || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-b border-black border-dashed my-2"></div>

        {/* --- TOTAL --- */}
        <div className="flex justify-between items-center text-sm font-bold mb-1">
          <span>TOTAL</span>
          <span>RM {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span>Payment:</span>
          <span className="uppercase">{paymentMethod}</span>
        </div>

        <div className="border-b border-black border-dashed my-4"></div>

        {/* --- FOOTER --- */}
        <div className="text-center">
          <p className="font-bold mb-1">TERIMA KASIH!</p>
          <p>Barang yang dijual tidak boleh dikembalikan.</p>
          <p className="mt-4 text-[6px] text-gray-500 tracking-[0.3em]">System by szalted</p>
        </div>
      </div>
    </div>
  );
});