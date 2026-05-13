interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'neutral'
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  error: 'bg-red-50 text-red-700 border-red-100',
  neutral: 'bg-gray-50 text-gray-700 border-gray-100',
}

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span className={[
      'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border',
      variantStyles[variant],
      className,
    ].join(' ')}>
      {children}
    </span>
  )
}