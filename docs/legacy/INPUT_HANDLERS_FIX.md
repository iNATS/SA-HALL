# 🔧 إصلاح مشاكل المدخلات - منع السالب والعربية

## 📋 المشاكل المحلولة

### 1. ❌ إدخال أرقام سالبة
**المشكلة**: يمكن إدخال إشارة `-` في أي حقل
**الحل**: ✅ منع السالب في جميع المدخلات

### 2. ❌ الكتابة بالعربية
**المشكلة**: يمكن الكتابة بالعربية في الحقول الرقمية
**الحل**: ✅ منع العربية وتحويلها للإنجليزية

---

## 🎯 الحل المطبق

### 1. ✅ إنشاء دوال مساعدة

**الملف**: `utils/inputHandlers.ts`

**الدوال**:

#### `preventNegativeNumber`
```typescript
export const preventNegativeNumber = (value: string): string => {
  return value.replace(/^-/, '');
};
```

#### `convertArabicToEnglishNumbers`
```typescript
export const convertArabicToEnglishNumbers = (value: string): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return value.split('').map(char => {
    const index = arabicNumbers.indexOf(char);
    return index !== -1 ? englishNumbers[index] : char;
  }).join('');
};
```

#### `preventArabicChars`
```typescript
export const preventArabicChars = (value: string): string => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return value.split('').filter(char => !arabicPattern.test(char)).join('');
};
```

#### `handleInputChange`
```typescript
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
  
  // تحويل الأرقام العربية إلى الإنجليزية
  if (options.convertNumbers) {
    result = convertArabicToEnglishNumbers(result);
  }
  
  // منع الأرقام السالبة
  if (options.preventNegative) {
    result = preventNegativeNumber(result);
  }
  
  // منع الأحرف العربية
  if (options.preventArabic) {
    result = preventArabicChars(result);
  }
  
  // السماح بالأرقام فقط
  if (options.onlyNumbers) {
    result = result.replace(/[^0-9]/g, '');
  }
  
  return result;
};
```

---

### 2. ✅ تحديث مكون Input

**الملف**: `components/ui/Input.tsx`

**الإضافات الجديدة**:

```typescript
interface InputProps {
  // ... props الموجودة
  preventNegative?: boolean;  // منع السالب
  preventArabic?: boolean;    // منع العربية
  onlyNumbers?: boolean;      // أرقام فقط
  onlyEnglish?: boolean;      // إنجليزي فقط
}
```

**الاستخدام**:
```typescript
// منع السالب
<Input 
  type="number"
  preventNegative={true}
  placeholder="أدخل رقم موجب"
/>

// منع العربية
<Input
  onlyEnglish={true}
  placeholder="English only"
/>

// أرقام فقط
<Input
  onlyNumbers={true}
  preventNegative={true}
  placeholder="0123456789"
/>
```

---

## 📊 المعالجة التلقائية

### في مكون Input:

```typescript
// معالجة onKeyDown
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  handleInputKeyDown(e, {
    preventNegative,
    onlyNumbers
  });
};

// معالجة onChange
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const target = e.target as HTMLInputElement;
  const originalValue = target.value;
  
  // معالجة القيمة
  const processedValue = handleInputChange(originalValue, {
    preventNegative,
    convertNumbers: true,  // تحويل تلقائي
    preventArabic,
    onlyNumbers
  });
  
  // تحديث القيمة
  target.value = processedValue;
};
```

---

## 🎯 أمثلة الاستخدام

### 1. حقول الأسعار:
```typescript
<Input
  type="number"
  label="السعر"
  preventNegative={true}
  onlyNumbers={true}
  placeholder="100"
/>
```

**النتيجة**:
- `-100` → `100` ✅
- `١٠٠` → `100` ✅
- `مائة` → `` ✅

---

### 2. حقول الأعداد:
```typescript
<Input
  type="number"
  label="العدد"
  preventNegative={true}
  onlyNumbers={true}
  placeholder="50"
/>
```

**النتيجة**:
- `-50` → `50` ✅
- `٥٠` → `50` ✅
- `خمسون` → `` ✅

---

### 3. حقول النصوص الإنجليزية:
```typescript
<Input
  label="الاسم بالإنجليزي"
  onlyEnglish={true}
  placeholder="English Name"
/>
```

**النتيجة**:
- `Ahmed` → `Ahmed` ✅
- `أحمد` → `` ✅
- `123` → `123` ✅

---

### 4. حقول الهاتف:
```typescript
<Input
  label="رقم الجوال"
  onlyNumbers={true}
  preventNegative={true}
  placeholder="0501234567"
/>
```

**النتيجة**:
- `-0501234567` → `0501234567` ✅
- `٠٥٠١٢٣٤٥٦٧` → `0501234567` ✅
- `05x-123` → `05123` ✅

---

## 📁 الملفات الجديدة/المعدلة

| الملف | النوع | الوصف |
|------|-------|-------|
| `utils/inputHandlers.ts` | ⭐ جديد | دوال المعالجة |
| `components/ui/Input.tsx` | ✅ معدل | مكون Input المحسّن |
| `INPUT_HANDLERS_FIX.md` | ⭐ جديد | التوثيق |

---

## 🧪 الاختبار

### 1. اختبار منع السالب:
```bash
1. أي حقل رقمي
2. حاول إدخال -
✅ يجب منع السالب
```

### 2. اختبار منع العربية:
```bash
1. حقل نصي مع onlyEnglish
2. حاول الكتابة بالعربية
✅ يجب منع العربية
```

### 3. اختبار تحويل الأرقام:
```bash
1. أي حقل رقمي
2. أدخل أرقام عربية (٠١٢٣)
✅ يجب تحويلها لـ (0123)
```

---

## 📝 ملاحظات مهمة

### التحويل التلقائي:
- ✅ الأرقام العربية → إنجليزية (تلقائي)
- ✅ السالب → ممنوع (تلقائي)
- ✅ العربية → ممنوعة (عند الحاجة)

### الحقول المتأثرة:
- ✅ جميع حقول الأسعار
- ✅ جميع حقول الأعداد
- ✅ جميع حقول الهاتف
- ✅ جميع الحقول الرقمية

### الاستثناءات:
- ❌ حقول النصوص العربية (الوصف، الاسم العربي)
- ❌ حقول البريد الإلكتروني
- ❌ حقول كلمات المرور

---

## ✅ التحقق من النجاح

بعد التطبيق:
- ✅ لا يمكن إدخال أرقام سالبة
- ✅ الأرقام العربية تتحول للإنجليزية
- ✅ العربية ممنوعة في الحقول الإنجليزية
- ✅ جميع المدخلات محمية

---

**تم التحديث**: فبراير 2026  
**الحالة**: ✅ جاهز للتطبيق
