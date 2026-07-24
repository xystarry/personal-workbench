import { Link } from 'react-router-dom'

interface QuickLink {
  to: string
  icon: string
  label: string
  color: string
}

const quickLinks: QuickLink[] = [
  { to: '/tasks', icon: '📋', label: '任务', color: 'bg-warm-100' },
  { to: '/knowledge', icon: '📚', label: '知识库', color: 'bg-sage-100' },
  { to: '/dashboard', icon: '📊', label: '看板', color: 'bg-lavender-100' },
  { to: '/projects', icon: '🎯', label: '项目', color: 'bg-warm-100' },
  { to: '/stock', icon: '📈', label: '股票', color: 'bg-sage-100' },
  { to: '/habits', icon: '✅', label: '习惯', color: 'bg-lavender-100' },
  { to: '/goals', icon: '🏆', label: '目标', color: 'bg-warm-100' },
  { to: '/tools', icon: '🧰', label: '工具', color: 'bg-sage-100' },
]

export default function QuickGrid() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {quickLinks.map(link => (
        <Link
          key={link.to}
          to={link.to}
          className="flex flex-col items-center gap-1.5"
        >
          <div className={`w-14 h-14 rounded-2xl ${link.color} flex items-center justify-center text-2xl shadow-sm`}>
            {link.icon}
          </div>
          <span className="text-xs text-warm-700">{link.label}</span>
        </Link>
      ))}
    </div>
  )
}
