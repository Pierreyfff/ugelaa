interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  highlight?: boolean
  className?: string
}

export default function StatCard({ label, value, subtitle, icon, highlight, className = '' }: StatCardProps) {
  return (
    <div className={[
      'bg-white rounded-2xl border p-5 transition-all duration-200',
      highlight ? 'border-red-200 ring-2 ring-red-500/10' : 'border-gray-100',
      'hover:shadow-lg hover:-translate-y-0.5',
      className,
    ].join(' ')}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1.5">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/15">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}