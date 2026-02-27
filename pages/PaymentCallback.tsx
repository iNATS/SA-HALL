import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PaymentCallback: React.FC = () => {
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentResult = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const status = params.get('status'); // SUCCESS, CANCEL, ERROR
      const merchantTransactionId = params.get('merchantTransactionId');

      console.log('Payment Callback:', { id, status, merchantTransactionId });

      if (!id || !status) {
        setSuccess(false);
        setProcessing(false);
        return;
      }

      try {
        // Extract booking ID from merchantTransactionId (format: BOOKING_{id}_{timestamp})
        const bookingIdFromTransaction = merchantTransactionId?.split('_')[1];
        
        if (status === 'SUCCESS' || status === 'OK') {
          // Update booking status to confirmed
          const { error } = await supabase
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_status: 'paid'
            })
            .eq('id', bookingIdFromTransaction || id);

          if (error) {
            console.error('Error updating booking:', error);
            setSuccess(false);
          } else {
            setSuccess(true);
            setBookingId(bookingIdFromTransaction || id);
          }
        } else if (status === 'CANCEL' || status === 'ERROR') {
          // Update booking status to cancelled
          const { error } = await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              payment_status: 'failed'
            })
            .eq('id', bookingIdFromTransaction || id);

          if (error) console.error('Error cancelling booking:', error);
          setSuccess(false);
        }
      } catch (err) {
        console.error('Payment callback error:', err);
        setSuccess(false);
      } finally {
        setProcessing(false);
      }
    };

    handlePaymentResult();
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">جاري معالجة الدفع...</h2>
          <p className="text-sm text-gray-500 font-bold">يرجى الانتظار لحظة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
        {success ? (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-100">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">تم الدفع بنجاح!</h2>
            <p className="text-sm text-gray-500 font-bold mb-6">
              شكراً لك، تم تأكيد الحجز بنجاح. تم إرسال تفاصيل الحجز إلى بريدك الإلكتروني.
            </p>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mb-6">
              <p className="text-xs font-bold text-green-700">رقم الحجز: #{bookingId?.substring(0, 8)}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigateTo('bookings')} className="w-full h-12 rounded-2xl font-bold">
                عرض حجوزاتي
              </Button>
              <Button onClick={() => navigateTo('home')} variant="outline" className="w-full h-12 rounded-2xl font-bold border-gray-200">
                العودة للرئيسية
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">لم يتم الدفع</h2>
            <p className="text-sm text-gray-500 font-bold mb-6">
              عذراً، لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى أو التواصل مع الدعم.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigateTo('bookings')} className="w-full h-12 rounded-2xl font-bold">
                عرض حجوزاتي
              </Button>
              <Button onClick={() => navigateTo('home')} variant="outline" className="w-full h-12 rounded-2xl font-bold border-gray-200">
                العودة للرئيسية
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
