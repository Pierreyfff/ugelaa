import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            {label}
            {props.required && <span className="text-red-400 text-xs">*</span>}
          </label>
        )}
        <div className="relative group">
          <select
            ref={ref}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-slate-900 bg-white appearance-none cursor-pointer text-sm
              focus:outline-none focus:ring-0
              ${error 
                ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                : 'border-slate-200 focus:border-sky-500 hover:border-slate-300 bg-white'
              }
              ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="py-2">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs font-semibold text-red-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';