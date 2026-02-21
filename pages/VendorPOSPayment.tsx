import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowRight, CheckCircle2, Printer } from 'lucide-react';

interface VendorPOSPaymentProps {
  cart: any[];
  total: number;
  receiptData: any;
  user: any;
  onConfirm: () => void;
  onBack: () => void;
}

export const VendorPOSPayment: React.FC<VendorPOSPaymentProps> = ({
  cart,
  total,
  receiptData,
  user,
  onConfirm,
  onBack
}) => {
  const confirmPayment = () => {
    onConfirm();
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-tajawal">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button onClick={onBack} variant="ghost" className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            العودة
          </Button>
          <h1 className="text-xl font-black">إتمام العملية</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
          <div className="text-center space-y-6">
            <div className="bg-green-50 text-green-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in border-4 border-green-100">
               <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-gray-900">إصدار الفاتورة</h3>
               <p className="text-gray-500 text-sm font-bold">سيتم تسجيل الدفع وتحديث المخزون تلقائياً</p>
            </div>

            {/* Receipt Preview */}
            <div id="receipt-print" className="bg-white border p-6 w-80 mx-auto text-center font-mono text-xs shadow-none border-gray-100 rounded-none hidden print:block">
               <div className="font-bold text-sm mb-2 border-b pb-2">{user.business_name || 'اسم المتجر'}</div>
               {user.pos_config?.receipt_header && <div className="mb-2 whitespace-pre-wrap">{user.pos_config.receipt_header}</div>}
               <div className="flex justify-between text-[10px] text-gray-500 mb-2">
                  <span>{new Date().toLocaleDateString()}</span>
                  <span>{receiptData?.orderId}</span>
               </div>
               <div className="border-t border-b border-dashed py-2 space-y-1 text-left">
                  {cart.map((c, i) => (
                     <div key={i} className="flex justify-between">
                        <span>{c.item.name} x{c.qty}</span>
                        <span>{(c.item.price * c.qty).toFixed(2)}</span>
                     </div>
                  ))}
               </div>
               <div className="pt-2 space-y-1 font-bold">
                  <div className="flex justify-between"><span>Total</span><span>{total.toFixed(2)}</span></div>
               </div>
               <div className="mt-4 pt-2 border-t text-[10px] whitespace-pre-wrap">{user.pos_config?.receipt_footer}</div>
               {user.pos_config?.tax_id && <div className="text-[9px] mt-1">Tax ID: {user.pos_config.tax_id}</div>}
            </div>

            <div className="flex gap-3 pt-6">
               <Button variant="outline" onClick={() => { window.print(); confirmPayment(); }} className="flex-1 h-14 rounded-2xl font-bold gap-2 border-2 border-gray-100 hover:border-gray-200"><Printer className="w-5 h-5" /> طباعة وإنهاء</Button>
               <Button onClick={confirmPayment} className="flex-1 h-14 rounded-2xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-none">تأكيد بدون طباعة</Button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } #receipt-print, #receipt-print * { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  );
};