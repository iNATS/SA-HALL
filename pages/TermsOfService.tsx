import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { ArrowRight, FileText } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'terms_of_service')
          .maybeSingle();

        if (error) throw error;

        if (data?.value?.content) {
          setContent(data.value.content);
        } else {
          setContent(`
            <h2>شروط الاستخدام</h2>
            <p>مرحباً بك في منصة SA Hall. هذه الشروط والأحكام تحكم استخدامك لمنصتنا.</p>

            <h3>1. قبول الشروط</h3>
            <p>باستخدام منصة SA Hall، أنت توافق على الالتزام بهذه الشروط والأحكام.</p>

            <h3>2. استخدام المنصة</h3>
            <p>يجب أن تستخدم المنصة بطريقة قانونية ومسؤولة.</p>

            <h3>3. حقوق الملكية الفكرية</h3>
            <p>جميع المحتويات والعلامات التجارية محمية بحقوق الطبع والنشر.</p>

            <h3>4. إخلاء المسؤولية</h3>
            <p>المنصة لا تتحمل مسؤولية أي أضرار غير مباشرة.</p>

            <h3>5. التعديلات</h3>
            <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت.</p>
          `);
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
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
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">شروط الاستخدام</h1>
                <p className="text-gray-500 font-bold mt-1">يرجى قراءة الشروط بعناية قبل استخدام المنصة</p>
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