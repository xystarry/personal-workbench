import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import Header from '../components/Header'

export default function ToolsPage() {
  const bookmarkCount = useLiveQuery(() => db.bookmarks.count(), [], 0)

  const tools = [
    { to: '/tools/bookmarks', icon: '🔖', label: '链接收藏', desc: '管理常用链接', color: 'bg-warm-100', count: bookmarkCount },
    { to: '/tools/calculator', icon: '🧮', label: '计算器', desc: '实用计算工具', color: 'bg-sage-100' },
  ]

  const quickLinks = [
    { icon: '📈', label: '东方财富', url: 'https://www.eastmoney.com', color: 'bg-warm-100' },
    { icon: '💹', label: '同花顺', url: 'https://www.10jqka.com.cn', color: 'bg-sage-100' },
    { icon: '❄️', label: '雪球', url: 'https://xueqiu.com', color: 'bg-lavender-100' },
    { icon: '🔍', label: 'Google', url: 'https://www.google.com', color: 'bg-warm-100' },
    { icon: '💻', label: 'GitHub', url: 'https://github.com', color: 'bg-sage-100' },
    { icon: '📅', label: '日历', url: 'https://calendar.google.com', color: 'bg-lavender-100' },
  ]

  return (
    <div className="page-enter min-h-screen">
      <Header title="工具箱" subtitle="实用小工具集合" gradient />

      <div className="px-4 py-3 space-y-5">
        {/* 实用工具 */}
        <div>
          <h3 className="text-sm font-semibold text-warm-600 mb-2">🧰 实用工具</h3>
          <div className="grid grid-cols-2 gap-3">
            {tools.map(tool => (
              <Link
                key={tool.to}
                to={tool.to}
                className="card p-4 flex flex-col items-start"
              >
                <div className={`w-12 h-12 rounded-2xl ${tool.color} flex items-center justify-center text-2xl mb-2`}>
                  {tool.icon}
                </div>
                <span className="font-semibold text-warm-800">{tool.label}</span>
                <span className="text-xs text-gray-400">{tool.desc}</span>
                {tool.count !== undefined && tool.count > 0 && (
                  <span className="text-xs text-warm-400 mt-1">{tool.count} 个</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* 快捷入口 */}
        <div>
          <h3 className="text-sm font-semibold text-warm-600 mb-2">⚡ 快捷入口</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickLinks.map(link => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-12 h-12 rounded-2xl ${link.color} flex items-center justify-center text-xl`}>
                  {link.icon}
                </div>
                <span className="text-xs text-warm-700">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* 内嵌网页 */}
        <div>
          <h3 className="text-sm font-semibold text-warm-600 mb-2">🌐 常用网站</h3>
          <div className="card p-2">
            <iframe
              src="https://www.eastmoney.com"
              className="w-full h-64 rounded-xl"
              title="东方财富"
              sandbox="allow-scripts allow-same-origin"
            />
            <p className="text-xs text-gray-400 text-center mt-1">* 内嵌网页需联网访问</p>
          </div>
        </div>
      </div>
    </div>
  )
}
