import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  rightAction?: React.ReactNode
  gradient?: boolean
}

export default function Header({ title, subtitle, showBack, rightAction, gradient }: HeaderProps) {
  const navigate = useNavigate()
  return (
    <div className={`${gradient ? 'gradient-header text-white' : 'text-warm-800'} px-4 pt-3 pb-4 safe-top`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className={`p-1 -ml-1 ${gradient ? 'text-white' : 'text-warm-600'}`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <div>
            <h1 className={`text-xl font-bold ${gradient ? 'text-white' : 'text-warm-800'}`}>{title}</h1>
            {subtitle && <p className={`text-xs ${gradient ? 'text-white/70' : 'text-warm-400'}`}>{subtitle}</p>}
          </div>
        </div>
        {rightAction}
      </div>
    </div>
  )
}
