import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { ArrowRight, FileText, Home } from 'lucide-react';

export const TermsOfService: React.FC = () => {
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
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-tajawal flex flex-col">
      {/* Simple Header with Home Link */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 font-bold">
            <Home className="w-5 h-5" />
            <span>العودة للرئيسية</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header Section */}
        <section className="relative w-full py-24 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <div className="inline-flex items-center gap-2 text-primary bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 mb-6">
              <FileText className="w-4 h-4 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">شروط الاستخدام</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
              شروط <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-primary/80">الاستخدام</span>
            </h1>

            <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              يرجى قراءة شروط الاستخدام بعناية قبل استخدام منصة SA Hall. هذه الشروط تحمي حقوقك وحقوقنا.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24 px-6 lg:px-12 flex-1">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 lg:p-12">
              <div
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-headings:font-black prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-ul:space-y-2"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-8 mt-auto">
        <p className="text-sm text-gray-400">© 2024 SA Hall. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};