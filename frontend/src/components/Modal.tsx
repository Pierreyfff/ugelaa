import { ReactNode, useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  icon?: ReactNode;
}

const colorClasses = [
  { bg: 'from-sky-400 to-sky-600', glow: 'shadow-sky-500/25' },
  { bg: 'from-emerald-400 to-emerald-600', glow: 'shadow-emerald-500/25' },
  { bg: 'from-violet-400 to-violet-600', glow: 'shadow-violet-500/25' },
  { bg: 'from-amber-400 to-amber-600', glow: 'shadow-amber-500/25' },
  { bg: 'from-rose-400 to-rose-600', glow: 'shadow-rose-500/25' },
];

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', icon }: ModalProps) {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setColorIndex(Math.floor(Math.random() * colorClasses.length));
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const colors = colorClasses[colorIndex];
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-[95vw]' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-all duration-300" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden animate-scaleIn`}>
        <div className="relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.bg} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
          <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br ${colors.bg} opacity-10 rounded-full translate-y-1/2 -translate-x-1/2`} />
          
          <div className="relative flex items-center justify-between px-8 py-6 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/80 to-white/80">
            <div className="flex items-center gap-4">
              {icon ? (
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg ${colors.glow}`}>
                  <span className="text-white">{icon}</span>
                </div>
              ) : (
                <div className={`w-1.5 h-10 rounded-full bg-gradient-to-b ${colors.bg}`} />
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Completa los datos requeridos</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="group p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}