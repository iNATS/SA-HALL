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
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-tajawal">
      {/* Header Section */}
      <section className="relative w-full pt-32 pb-16 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <div className="inline-flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100 mb-6">
            <HelpCircle className="w-4 h-4 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">مركز المساعدة</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
            مركز <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-600 to-orange-500">المساعدة</span>
          </h1>

          <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            نحن هنا لمساعدتك! ابحث عن الإجابات أو تواصل مع فريق الدعم لدينا.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 lg:p-12 mb-12">
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-headings:font-black prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2 prose-p:mb-4 prose-ul:space-y-2"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-black text-gray-900 mb-2 text-lg">الدردشة المباشرة</h3>
              <p className="text-sm text-gray-600 font-bold leading-relaxed">تحدث معنا مباشرة للحصول على مساعدة فورية</p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <Phone className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-black text-gray-900 mb-2 text-lg">اتصل بنا</h3>
              <p className="text-sm text-gray-600 font-bold leading-relaxed">920012345 - متوفر من 9 ص إلى 6 م</p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <Mail className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-black text-gray-900 mb-2 text-lg">البريد الإلكتروني</h3>
              <p className="text-sm text-gray-600 font-bold leading-relaxed">support@hall.sa</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={onBack} variant="outline" className="px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 gap-3 transition-all">
              <ArrowRight className="w-5 h-5" />
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};