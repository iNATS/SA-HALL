import React from 'react';
import { handleInputChange, handleInputKeyDown, InputHandlerOptions } from '../../utils/inputHandlers';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  preventNegative?: boolean;
  preventArabic?: boolean;
  onlyNumbers?: boolean;
  onlyEnglish?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  preventNegative = false,
  preventArabic = false,
  onlyNumbers = false,
  onlyEnglish = false,
  type,
  onKeyDown,
  onChange,
  ...props
}) => {
  // تحديد نوع المعالجة بناءً على props
  const handlerOptions: InputHandlerOptions = {
    preventNegative,
    convertNumbers: true,
    preventArabic,
    onlyNumbers,
    onlyEnglish
  };

  // معالجة حدثKeyDown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleInputKeyDown(e, {
      preventNegative,
      onlyNumbers
    });
    
    // استدعاء onKeyDown الأصلي إذا وجد
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // معالجة حدث onChange
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const originalValue = target.value;
    
    // معالجة القيمة
    const processedValue = handleInputChange(originalValue, handlerOptions);
    
    // تحديث القيمة
    target.value = processedValue;
    
    // إنشاء حدث جديد بالقيمة المعالجة
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: processedValue
      }
    };
    
    // استدعاء onChange الأصلي إذا وجد
    if (onChange) {
      onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // تحديد نوع الإدخال
  const inputType = onlyNumbers ? 'text' : type;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          inputMode={onlyNumbers ? 'numeric' : undefined}
          pattern={onlyNumbers ? '[0-9]*' : undefined}
          className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${icon ? 'pr-10' : ''} ${className}`}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          {...props}
        />
      </div>
      {error && <p className="text-[0.8rem] text-destructive">{error}</p>}
    </div>
  );
};
