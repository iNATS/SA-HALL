import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { ArrowRight, Award } from 'lucide-react';

interface ServiceLevelAgreementProps {
  onBack: () => void;
}

export const ServiceLevelAgreement: React.FC<ServiceLevelAgreementProps> = ({ onBack }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'service_level_agreement')
          .maybeSingle();

        if (error) throw error;

        if (data?.value?.content) {
          setContent(data.value.content);
        } else {
          setContent(`
            <h2>اتفاقية مستوى الخدمة</h2>
            <p>هذه الاتفاقية تحدد مستوى الخدمة الذي نقدمه لعملائنا في منصة SA Hall.</p>

            <h3>1. توفر الخدمة</h3>
            <p>نسعى للحفاظ على توفر المنصة بنسبة 99.5% خلال ساعات العمل الرسمية.</p>

            <h3>2. دعم العملاء</h3>
            <p>نقدم دعماً فنياً للعملاء خلال أيام العمل من الساعة 9 صباحاً حتى 6 مساءً.</p>

            <h3>3. أوقات الاستجابة</h3>
            <p>نرد على استفسارات العملاء خلال 24 ساعة من وقت الاستلام.</p>

            <h3>4. جودة الخدمة</h3>
            <p>نضمن جودة عالية في جميع الخدمات المقدمة من خلال المنصة.</p>

            <h3>5. التعويضات</h3>
            <p>في حال عدم الالتزام بمستوى الخدمة، قد نقدم تعويضات مناسبة.</p>

            <h3>6. التعديلات</h3>
            <p>نحتفظ بالحق في تعديل هذه الاتفاقية مع إشعار مسبق للعملاء.</p>
          `);
        }
      } catch (error) {
        console.error('Error fetching SLA:', error);
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
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">اتفاقية مستوى الخدمة</h1>
                <p className="text-gray-500 font-bold mt-1">معايير الجودة والتوفر لخدماتنا</p>
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