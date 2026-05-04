import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 text-slate-900 bg-white appearance-none cursor-pointer
              focus:outline-none focus:ring-0
              ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-sky-500 hover:border-slate-300'}
              ${className}`}
            {...props}
          >
            {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';