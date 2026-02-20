import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { ArrowRight, HelpCircle, MessageCircle, Phone, Mail } from 'lucide-react';

interface HelpCenterProps {
  onBack: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onBack }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'help_center')
          .maybeSingle();

        if (error) throw error;

        if (data?.value?.content) {
          setContent(data.value.content);
        } else {
          setContent(`
            <h2>مركز المساعدة</h2>
            <p>نحن هنا لمساعدتك! إذا كان لديك أي أسئلة أو تحتاج إلى دعم، لا تتردد في التواصل معنا.</p>

            <h3>الأسئلة الشائعة</h3>

            <h4>كيف أقوم بحجز قاعة؟</h4>
            <p>يمكنك تصفح القاعات المتاحة من الصفحة الرئيسية، ثم اختيار القاعة المناسبة وإكمال عملية الحجز.</p>

            <h4>كيف أدفع مقابل الحجز؟</h4>
            <p>ندعم عدة طرق دفع آمنة بما في ذلك البطاقات الائتمانية والمحافظ الإلكترونية.</p>

            <h4>ما هي سياسة الإلغاء؟</h4>
            <p>يمكن إلغاء الحجز مجاناً قبل 48 ساعة من موعد المناسبة. للمزيد من التفاصيل، راجع شروط الاستخدام.</p>

            <h4>كيف أصبح شريكاً في المنصة؟</h4>
            <p>يمكنك التسجيل كشريك من خلال صفحة التسجيل وتقديم المستندات المطلوبة.</p>

            <h3>تواصل معنا</h3>
            <p>إذا لم تجد إجابة لسؤالك، يمكنك التواصل مع فريق الدعم الفني لدينا.</p>
          `);
        }
      } catch (error) {
        console.error('Error fetching help center:', error);
        setContent('<p>حدث خطأ في تحميل المحتوى. يرجى المحاولة لاحقاً.</p>');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-tajawal text-right" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-2 font-bold text-sm">
              <ArrowRight className="w-4 h-4" /> العودة
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">مركز المساعدة</h1>
                <p className="text-gray-500 font-bold mt-1">كيف يمكننا مساعدتك اليوم؟</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-2xl text-center">
                <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-black text-gray-900 mb-2">الدردشة المباشرة</h3>
                <p className="text-sm text-gray-600 font-bold">تحدث معنا مباشرة للحصول على مساعدة فورية</p>
              </div>

              <div className="bg-green-50 p-6 rounded-2xl text-center">
                <Phone className="w-8 h-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-black text-gray-900 mb-2">اتصل بنا</h3>
                <p className="text-sm text-gray-600 font-bold">920012345 - متوفر من 9 ص إلى 6 م</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-2xl text-center">
                <Mail className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-black text-gray-900 mb-2">البريد الإلكتروني</h3>
                <p className="text-sm text-gray-600 font-bold">support@hall.sa</p>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center">
              <Button onClick={onBack} variant="outline" className="px-8 py-3 rounded-xl font-bold">
                العودة للرئيسية
              </Button>
              <p className="text-xs text-gray-400 font-bold">
                آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};