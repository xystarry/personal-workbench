import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import Header from '../components/Header'
import { todayStr, getRecentDays } from '../utils/date'

export default function ProfilePage() {
  const stats = useLiveQuery(async () => {
    const [tasks, notes, projects, habits, goals, reviews, bookmarks] = await Promise.all([
      db.tasks.count(),
      db.notes.count(),
      db.projects.count(),
      db.habits.count(),
      db.goals.count(),
      db.stockReviews.count(),
      db.bookmarks.count()
    ])
    const doneTasks = await db.tasks.where('status').equals('done').count()
    return { tasks, doneTasks, notes, projects, habits, goals, reviews, bookmarks }
  }, [], null)

  const habits = useLiveQuery(() => db.habits.toArray(), [], [])
  const today = todayStr()
  const weekDays = getRecentDays(7)

  const totalHabitRecords = habits.reduce((sum, h) => sum + h.records.length, 0)
  const todayHabitDone = habits.filter(h => h.records.includes(today)).length

  const menuItems = [
    { to: '/tasks', icon: '📋', label: '任务管理', count: stats?.tasks },
    { to: '/knowledge', icon: '📚', label: '知识库', count: stats?.notes },
    { to: '/projects', icon: '🎯', label: '项目跟踪', count: stats?.projects },
    { to: '/habits', icon: '✅', label: '习惯打卡', count: stats?.habits },
    { to: '/goals', icon: '🏆', label: '目标追踪', count: stats?.goals },
    { to: '/stock', icon: '📈', label: '股票复盘', count: stats?.reviews },
    { to: '/tools', icon: '🧰', label: '工具箱' },
    { to: '/dashboard', icon: '📊', label: '数据看板' },
  ]

  return (
    <div className="page-enter min-h-screen">
      <Header title="我的" gradient />

      <div className="px-4 py-3 space-y-4">
        {/* 个人信息卡片 */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-header flex items-center justify-center text-2xl text-white font-bold">
              我
            </div>
            <div>
              <h2 className="text-lg font-bold text-warm-800">欢迎回来 👋</h2>
              <p className="text-sm text-gray-400">今天又是美好的一天</p>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold text-warm-600">{stats?.tasks || 0}</p>
              <p className="text-xs text-gray-400">任务</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-sage-400">{stats?.notes || 0}</p>
              <p className="text-xs text-gray-400">笔记</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-lavender-300">{totalHabitRecords}</p>
              <p className="text-xs text-gray-400">打卡</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-warm-500">{stats?.reviews || 0}</p>
              <p className="text-xs text-gray-400">复盘</p>
            </div>
          </div>
        </div>

        {/* 今日概览 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-warm-600 mb-3">📊 今日概览</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-700">完成任务</span>
              <span className="text-sm font-medium text-warm-600">{stats?.doneTasks || 0} / {stats?.tasks || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-700">今日习惯</span>
              <span className="text-sm font-medium text-warm-600">{todayHabitDone} / {habits.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-700">活跃项目</span>
              <span className="text-sm font-medium text-warm-600">{stats?.projects || 0}</span>
            </div>
          </div>
        </div>

        {/* 功能菜单 */}
        <div className="card overflow-hidden">
          {menuItems.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-warm-50' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-sm text-warm-700">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-xs text-gray-400">{item.count}</span>
              )}
              <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* 设置 */}
        <Link to="/settings" className="card flex items-center gap-3 px-4 py-3.5">
          <span className="text-xl">⚙️</span>
          <span className="flex-1 text-sm text-warm-700">设置</span>
          <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>

        <p className="text-center text-xs text-gray-400 py-2">个人工作台 v1.0 · 数据本地存储</p>
      </div>
    </div>
  )
}
