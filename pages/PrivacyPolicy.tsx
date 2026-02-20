import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { PublicNavbar } from '../components/Layout/PublicNavbar';
import { Footer } from '../components/Layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, Shield } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
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
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-tajawal">
      <PublicNavbar />
      
      {/* Header Section */}
      <section className="relative w-full pt-32 pb-16 bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-1.5 rounded-full border border-green-100 mb-6">
            <Shield className="w-4 h-4 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">سياسة الخصوصية</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
            سياسة <span className="text-transparent bg-clip-text bg-gradient-to-l from-green-600 to-green-500">الخصوصية</span>
          </h1>

          <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. تعرف على كيفية جمع واستخدام وحماية معلوماتك.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 lg:p-12">
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-headings:font-black prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-ul:space-y-2"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};