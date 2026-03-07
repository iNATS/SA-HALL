/**
 * دوال مساعدة للتعامل مع المدخلات في التطبيق
 * - منع الأرقام السالبة
 * - منع الكتابة بالعربية وتحويلها للإنجليزية
 */

/**
 * منع الأرقام السالبة
 * @param value - القيمة المدخلة
 * @returns رقم بدون إشارة سالبة
 */
export const preventNegativeNumber = (value: string): string => {
  // إزالة أي إشارة سالبة
  return value.replace(/^-/, '');
};

/**
 * تحويل الأرقام العربية إلى الإنجليزية
 * @param value - النص المدخل
 * @returns نص بأرقام إنجليزية فقط
 */
export const convertArabicToEnglishNumbers = (value: string): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return value.split('').map(char => {
    const index = arabicNumbers.indexOf(char);
    return index !== -1 ? englishNumbers[index] : char;
  }).join('');
};

/**
 * منع الأحرف العربية وتحويلها للإنجليزية
 * @param value - النص المدخل
 * @returns نص بالإنجليزية فقط
 */
export const preventArabicChars = (value: string): string => {
  // إزالة الأحرف العربية
  const arabicPattern = /[\u0600-\u06FF]/;
  
  return value.split('').filter(char => !arabicPattern.test(char)).join('');
};

/**
 * معالجة المدخلات - منع السالب + تحويل الأرقام
 * @param value - القيمة المدخلة
 * @param options - خيارات المعالجة
 * @returns قيمة معالجة
 */
export const handleInputChange = (
  value: string,
  options: {
    preventNegative?: boolean;
    convertNumbers?: boolean;
    preventArabic?: boolean;
    onlyNumbers?: boolean;
  } = {}
): string => {
  let result = value;
  
  const {
    preventNegative = false,
    convertNumbers = true,
    preventArabic = false,
    onlyNumbers = false
  } = options;
  
  // تحويل الأرقام العربية إلى الإنجليزية
  if (convertNumbers) {
    result = convertArabicToEnglishNumbers(result);
  }
  
  // منع الأرقام السالبة
  if (preventNegative) {
    result = preventNegativeNumber(result);
  }
  
  // منع الأحرف العربية
  if (preventArabic) {
    result = preventArabicChars(result);
  }
  
  // السماح بالأرقام فقط
  if (onlyNumbers) {
    result = result.replace(/[^0-9]/g, '');
  }
  
  return result;
};

/**
 * معالجة حدث تغيير القيمة للمدخلات
 * @param e - حدث التغيير
 * @param onChange - دالة التغيير الأصلية
 * @param options - خيارات المعالجة
 */
export const handleInputKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  options: {
    preventNegative?: boolean;
    onlyNumbers?: boolean;
  } = {}
) => {
  const { preventNegative = false, onlyNumbers = false } = options;
  
  // منع إشارة السالب
  if (preventNegative && e.key === '-') {
    e.preventDefault();
    return;
  }
  
  // منع الأحرف غير الرقمية
  if (onlyNumbers && !/^[0-9\b]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
    e.preventDefault();
    return;
  }
};

/**
 * Component Wrapper للتعامل مع المدخلات
 */
export interface InputHandlerOptions {
  preventNegative?: boolean;
  convertNumbers?: boolean;
  preventArabic?: boolean;
  onlyNumbers?: boolean;
  onlyEnglish?: boolean;
}

/**
 * إنشاء props للمدخلات مع المعالجة
 * @param options - خيارات المعالجة
 * @returns props للمدخلات
 */
export const createInputHandlers = (options: InputHandlerOptions = {}) => {
  return {
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      handleInputKeyDown(e, {
        preventNegative: options.preventNegative,
        onlyNumbers: options.onlyNumbers
      });
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const originalValue = target.value;
      const processedValue = handleInputChange(originalValue, {
        preventNegative: options.preventNegative,
        convertNumbers: options.convertNumbers !== false,
        preventArabic: options.preventArabic || options.onlyEnglish,
        onlyNumbers: options.onlyNumbers
      });
      
      // تحديث القيمة
      target.value = processedValue;
      
      // استدعاء onChange الأصلي إذا وجد
      if (e.target.onChange) {
        e.target.onChange(e);
      }
    }
  };
};

/**
 * التحقق من أن النص لا يحتوي على أحرف عربية
 * @param text - النص للتحقق
 * @returns true إذا كان النص لا يحتوي على أحرف عربية
 */
export const isEnglishOnly = (text: string): boolean => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return !arabicPattern.test(text);
};

/**
 * التحقق من أن الرقم ليس سالباً
 * @param num - الرقم للتحقق
 * @returns true إذا كان الرقم غير سالب
 */
export const isNonNegative = (num: number | string): boolean => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  return !isNaN(value) && value >= 0;
};
