import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { todayStr, relativeTime, getWeekRange, formatDate } from '../utils/date'
import QuickGrid from '../components/QuickGrid'

const moodMap: Record<string, string> = {
  happy: '😊', calm: '😌', neutral: '😐', sad: '😢', angry: '😠'
}

export default function HomePage() {
  const today = todayStr()

  const todayTasks = useLiveQuery(async () => {
    return db.tasks.where('status').notEqual('done').toArray()
  }, [], [])

  const todayHabits = useLiveQuery(async () => {
    return db.habits.toArray()
  }, [], [])

  const recentDiary = useLiveQuery(async () => {
    return db.notes.where('type').equals('diary').reverse().sortBy('createdAt').then(arr => arr.slice(0, 1))
  }, [], [])

  const pendingReviews = useLiveQuery(async () => {
    const items = await db.watchlist.toArray()
    return items.length
  }, [], 0)

  const pendingTasksCount = todayTasks?.filter(t => {
    if (!t.dueDate) return true
    return t.dueDate <= today
  }).length || 0

  const habitsDoneToday = todayHabits?.filter(h => h.records.includes(today)).length || 0
  const habitsTotal = todayHabits?.length || 0

  const now = new Date()
  const hour = now.getHours()
  let greeting = '晚上好'
  if (hour < 6) greeting = '凌晨好'
  else if (hour < 12) greeting = '早上好'
  else if (hour < 14) greeting = '中午好'
  else if (hour < 18) greeting = '下午好'

  const weekRange = getWeekRange()
  const weekProgress = Math.round(((now.getTime() - weekRange.start.getTime()) / (weekRange.end.getTime() - weekRange.start.getTime())) * 100)

  return (
    <div className="page-enter min-h-screen">
      {/* 顶部问候 */}
      <div className="gradient-header px-4 pt-12 pb-8 rounded-b-3xl safe-top">
        <p className="text-white/70 text-sm">{formatDate(now, 'YYYY年MM月DD日')}</p>
        <h1 className="text-2xl font-bold text-white mt-1">{greeting} 👋</h1>
        <p className="text-white/70 text-sm mt-2">
          今日还有 <span className="text-white font-bold">{pendingTasksCount}</span> 个待办，
          习惯完成 <span className="text-white font-bold">{habitsDoneToday}/{habitsTotal}</span>
        </p>
        {/* 本周进度条 */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>本周进度</span>
            <span>{weekProgress}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${weekProgress}%` }} />
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="px-4 -mt-4">
        <div className="card p-4">
          <QuickGrid />
        </div>
      </div>

      {/* 今日待办 */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-warm-800">📋 今日待办</h2>
          <Link to="/tasks" className="text-sm text-warm-500">全部 →</Link>
        </div>
        <div className="card p-3">
          {pendingTasksCount === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">今日无待办，享受轻松时光 🎉</p>
          ) : (
            <div className="space-y-2">
              {todayTasks?.filter(t => !t.dueDate || t.dueDate <= today).slice(0, 5).map(task => (
                <Link key={task.id} to="/tasks" className="flex items-center gap-2 py-1.5">
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-warm-400' : 'bg-sage-300'}`} />
                  <span className="text-sm text-warm-700 flex-1 truncate">{task.title}</span>
                  {task.dueDate && <span className="text-xs text-gray-400">{task.dueDate}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 习惯概览 */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-warm-800">✅ 今日习惯</h2>
          <Link to="/habits" className="text-sm text-warm-500">详情 →</Link>
        </div>
        <div className="card p-3">
          {habitsTotal === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">还没有添加习惯</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {todayHabits?.map(habit => (
                <div key={habit.id} className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${habit.records.includes(today) ? '' : 'opacity-40'}`}
                    style={{ background: habit.records.includes(today) ? habit.color + '30' : '#F5F0EB' }}
                  >
                    {habit.icon}
                  </div>
                  <span className="text-[10px] text-warm-600">{habit.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 股票自选 */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-warm-800">📈 自选股</h2>
          <Link to="/stock" className="text-sm text-warm-500">查看 →</Link>
        </div>
        <div className="card p-3">
          {pendingReviews === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">还没有添加自选股</p>
          ) : (
            <p className="text-sm text-warm-600 py-2">关注 {pendingReviews} 只股票，点击查看详情</p>
          )}
        </div>
      </div>

      {/* 最近日记 */}
      <div className="px-4 mt-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-warm-800">📔 最近日记</h2>
          <Link to="/knowledge/diary" className="text-sm text-warm-500">写日记 →</Link>
        </div>
        <div className="card p-3">
          {recentDiary && recentDiary.length > 0 ? (
            <Link to={`/knowledge/notes/${recentDiary[0].id}`} className="block">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{moodMap[recentDiary[0].mood || 'neutral']}</span>
                <span className="text-sm font-medium text-warm-700">{recentDiary[0].title}</span>
              </div>
              <p className="text-xs text-gray-400">{relativeTime(recentDiary[0].createdAt)}</p>
            </Link>
          ) : (
            <p className="text-center text-gray-400 text-sm py-6">还没有写日记，记录今天吧 ✨</p>
          )}
        </div>
      </div>
    </div>
  )
}
