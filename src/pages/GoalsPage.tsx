import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Goal } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'
import { formatDate } from '../utils/date'

const typeLabels: Record<string, string> = { weekly: '周目标', monthly: '月目标', yearly: '年目标' }
const typeColors: Record<string, string> = { weekly: 'tag-warm', monthly: 'tag-sage', yearly: 'tag-lavender' }

export default function GoalsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const goals = useLiveQuery(() => db.goals.reverse().sortBy('createdAt'), [], [])

  const filteredGoals = filter === 'all' ? goals : goals.filter(g => g.type === filter)

  const updateProgress = async (goal: Goal, delta: number) => {
    if (!goal.id) return
    const current = Math.max(0, Math.min(goal.target, goal.current + delta))
    await db.goals.update(goal.id, { current })
  }

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="目标追踪"
        subtitle={`${goals.length} 个目标`}
        rightAction={
          <button onClick={() => setShowAdd(true)} className="text-white bg-white/20 rounded-lg p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
        gradient
      />

      {/* 筛选 */}
      <div className="px-4 py-3 flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'weekly', label: '周目标' },
          { key: 'monthly', label: '月目标' },
          { key: 'yearly', label: '年目标' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              filter === f.key ? 'bg-warm-500 text-white' : 'bg-white text-warm-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🏆</p>
            <p className="text-gray-400 mb-3">还没有设定目标</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary">设定第一个目标</button>
          </div>
        ) : (
          filteredGoals.map(goal => {
            const progress = Math.round(goal.current / goal.target * 100)
            const isComplete = goal.current >= goal.target
            return (
              <div key={goal.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-warm-800">{goal.title}</h3>
                      <span className={`tag ${typeColors[goal.type]}`}>{typeLabels[goal.type]}</span>
                      {isComplete && <span className="text-sm">✅</span>}
                    </div>
                    {goal.description && (
                      <p className="text-xs text-gray-400">{goal.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => goal.id && setDeleteId(goal.id)}
                    className="text-gray-300 hover:text-red-400 p-1"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                </div>

                {/* 进度条 */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-warm-600 font-medium">{goal.current} / {goal.target} {goal.unit}</span>
                    <span className="text-gray-400">{progress}%</span>
                  </div>
                  <div className="h-2.5 bg-warm-50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-sage-300' : 'bg-warm-500'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 进度调整 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateProgress(goal, -1)}
                    className="w-9 h-9 rounded-lg bg-warm-50 text-warm-500 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <button
                    onClick={() => updateProgress(goal, 1)}
                    className="flex-1 py-2 rounded-lg bg-warm-100 text-warm-600 text-sm font-medium"
                  >
                    +1 {goal.unit}
                  </button>
                  <button
                    onClick={() => updateProgress(goal, 5)}
                    className="flex-1 py-2 rounded-lg bg-warm-100 text-warm-600 text-sm font-medium"
                  >
                    +5 {goal.unit}
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-2 text-center">
                  {formatDate(goal.startDate)} ~ {formatDate(goal.endDate)}
                </p>
              </div>
            )
          })
        )}
      </div>

      {showAdd && <GoalCreateModal onClose={() => setShowAdd(false)} />}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) db.goals.delete(deleteId) }}
        title="删除目标"
        message="确定要删除这个目标吗？"
      />
    </div>
  )
}

function GoalCreateModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Goal['type']>('weekly')
  const [target, setTarget] = useState(1)
  const [unit, setUnit] = useState('次')

  const handleSave = async () => {
    if (!title.trim()) return
    const now = new Date()
    let startDate = new Date(now)
    let endDate = new Date(now)

    if (type === 'weekly') {
      const day = now.getDay() || 7
      startDate.setDate(now.getDate() - day + 1)
      endDate.setDate(startDate.getDate() + 6)
    } else if (type === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else {
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31)
    }

    await db.goals.add({
      title: title.trim(),
      description: description.trim(),
      type,
      target,
      current: 0,
      unit,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      createdAt: now.toISOString()
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="新建目标">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-warm-500 mb-1 block">目标名称</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="如：本周读完一本书"
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-1 block">描述</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="目标详情..."
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-1 block">目标类型</label>
          <div className="flex gap-2">
            {(['weekly', 'monthly', 'yearly'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm ${type === t ? 'bg-warm-500 text-white' : 'bg-warm-50 text-warm-400'}`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-warm-500 mb-1 block">目标值</label>
            <input
              type="number"
              value={target}
              onChange={e => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
            />
          </div>
          <div>
            <label className="text-sm text-warm-500 mb-1 block">单位</label>
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="次/本/公里..."
              className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
            />
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary w-full" disabled={!title.trim()}>
          创建
        </button>
      </div>
    </Modal>
  )
}
