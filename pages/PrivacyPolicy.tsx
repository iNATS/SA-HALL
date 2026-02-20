import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { ArrowRight, Shield } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'privacy_policy')
          .maybeSingle();

        if (error) throw error;

        if (data?.value?.content) {
          setContent(data.value.content);
        } else {
          setContent(`
            <h2>سياسة الخصوصية</h2>
            <p>نحن في منصة SA Hall نقدر خصوصيتك ونلتزم بحماية معلوماتك الشخصية.</p>

            <h3>1. جمع المعلومات</h3>
            <p>نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل أو استخدام المنصة.</p>

            <h3>2. استخدام المعلومات</h3>
            <p>نستخدم معلوماتك لتقديم الخدمات، تحسين المنصة، والتواصل معك.</p>

            <h3>3. مشاركة المعلومات</h3>
            <p>نحن لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة.</p>

            <h3>4. أمان البيانات</h3>
            <p>نتخذ تدابير أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به.</p>

            <h3>5. حقوقك</h3>
            <p>لديك الحق في الوصول إلى معلوماتك، تصحيحها، أو حذفها.</p>

            <h3>6. التغييرات على السياسة</h3>
            <p>قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر.</p>
          `);
        }
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
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
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">سياسة الخصوصية</h1>
                <p className="text-gray-500 font-bold mt-1">كيف نحمي ونستخدم معلوماتك الشخصية</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
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