import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Habit } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'
import { todayStr, getRecentDays, formatDate } from '../utils/date'

const habitIcons = ['💧', '🏃', '📖', '📊', '🎯', '🧘', '✍️', '🍎', '😴', '💪', '🎨', '🎵']
const habitColors = ['#60A5FA', '#34D399', '#FBBF24', '#F5A88B', '#B8A8D0', '#F472B6', '#60A5FA', '#34D399']

export default function HabitsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const today = todayStr()
  const recentDays = getRecentDays(35) // 5周

  const habits = useLiveQuery(() => db.habits.toArray(), [], [])

  const toggleHabit = async (habit: Habit) => {
    if (!habit.id) return
    const records = habit.records.includes(today)
      ? habit.records.filter(r => r !== today)
      : [...habit.records, today]
    await db.habits.update(habit.id, { records })
  }

  // 计算连续天数
  const getStreak = (records: string[]): number => {
    const sorted = [...records].sort().reverse()
    let streak = 0
    const today = todayStr()
    const yesterday = formatDate(new Date(Date.now() - 86400000))
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0
    let checkDate = sorted[0] === today ? today : yesterday
    for (const r of sorted) {
      if (r === checkDate) {
        streak++
        const d = new Date(checkDate)
        d.setDate(d.getDate() - 1)
        checkDate = formatDate(d)
      } else if (r < checkDate) {
        break
      }
    }
    return streak
  }

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="习惯打卡"
        subtitle={`${habits.length} 个习惯`}
        rightAction={
          <button onClick={() => setShowAdd(true)} className="text-white bg-white/20 rounded-lg p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
        gradient
      />

      <div className="px-4 py-3 space-y-4">
        {habits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🌱</p>
            <p className="text-gray-400 mb-3">还没有添加习惯</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary">添加第一个习惯</button>
          </div>
        ) : (
          habits.map(habit => {
            const streak = getStreak(habit.records)
            const doneToday = habit.records.includes(today)
            const weekDone = habit.records.filter(r => getRecentDays(7).includes(r)).length
            return (
              <div key={habit.id} className="card p-4">
                {/* 习惯头部 */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                    style={{ background: habit.color + '20' }}
                  >
                    {habit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-warm-800">{habit.name}</h3>
                    <p className="text-xs text-gray-400">
                      连续 <span className="text-warm-500 font-medium">{streak}</span> 天 · 本周 {weekDone}/{habit.target * 7 > 7 ? 7 : habit.target}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleHabit(habit)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      doneToday ? 'scale-110' : 'bg-warm-50'
                    }`}
                    style={doneToday ? { background: habit.color } : {}}
                  >
                    {doneToday ? (
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* 热力图 */}
                <div className="grid grid-cols-7 gap-1">
                  {recentDays.map(day => {
                    const done = habit.records.includes(day)
                    const isToday = day === today
                    return (
                      <div
                        key={day}
                        className="heatmap-cell"
                        style={{
                          background: done ? habit.color : '#F5EDE5',
                          border: isToday ? '2px solid #E08868' : 'none'
                        }}
                        title={day}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>5周前</span>
                  <span>今天</span>
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={() => habit.id && setDeleteId(habit.id)}
                  className="text-xs text-gray-300 hover:text-red-400 mt-2"
                >
                  删除
                </button>
              </div>
            )
          })
        )}
      </div>

      {showAdd && <HabitCreateModal onClose={() => setShowAdd(false)} />}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) db.habits.delete(deleteId) }}
        title="删除习惯"
        message="确定要删除这个习惯吗？所有打卡记录将丢失。"
      />
    </div>
  )
}

function HabitCreateModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(habitIcons[0])
  const [color, setColor] = useState(habitColors[0])
  const [target, setTarget] = useState(1)

  const handleSave = async () => {
    if (!name.trim()) return
    await db.habits.add({
      name: name.trim(),
      icon,
      color,
      frequency: 'daily',
      target,
      records: [],
      createdAt: new Date().toISOString()
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="新建习惯">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-warm-500 mb-1 block">习惯名称</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="如：每日读书"
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-2 block">图标</label>
          <div className="grid grid-cols-6 gap-2">
            {habitIcons.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center ${
                  icon === ic ? 'bg-warm-200 ring-2 ring-warm-400' : 'bg-warm-50'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-2 block">颜色</label>
          <div className="flex gap-2">
            {habitColors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-warm-300' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-1 block">每日目标次数</label>
          <input
            type="number"
            value={target}
            onChange={e => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
          />
        </div>
        <button onClick={handleSave} className="btn-primary w-full" disabled={!name.trim()}>
          创建
        </button>
      </div>
    </Modal>
  )
}
