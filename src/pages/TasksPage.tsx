import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Task } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'
import { todayStr, isOverdue, formatDate } from '../utils/date'

type FilterType = 'all' | 'today' | 'overdue' | 'done'

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterType>('today')
  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const today = todayStr()

  const tasks = useLiveQuery(async () => {
    return db.tasks.orderBy('order').toArray()
  }, [], [])

  const filteredTasks = (tasks || []).filter(t => {
    switch (filter) {
      case 'today': return t.status !== 'done' && (!t.dueDate || t.dueDate <= today)
      case 'overdue': return t.status !== 'done' && isOverdue(t.dueDate)
      case 'done': return t.status === 'done'
      default: return true
    }
  })

  const todoTasks = filteredTasks.filter(t => t.status === 'todo')
  const doingTasks = filteredTasks.filter(t => t.status === 'doing')
  const doneTasks = filteredTasks.filter(t => t.status === 'done')

  const toggleStatus = async (task: Task) => {
    if (!task.id) return
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await db.tasks.update(task.id, { status: newStatus, updatedAt: new Date().toISOString() })
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'all', label: '全部' },
    { key: 'overdue', label: '逾期' },
    { key: 'done', label: '已完成' },
  ]

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="任务管理"
        subtitle={`${todoTasks.length + doingTasks.length} 个进行中`}
        rightAction={
          <button onClick={() => setShowAdd(true)} className="text-white bg-white/20 rounded-lg p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
        gradient
      />

      {/* 筛选标签 */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === f.key ? 'bg-warm-500 text-white' : 'bg-white text-warm-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      <div className="px-4 space-y-4">
        {todoTasks.length > 0 && (
          <TaskSection title="待办" tasks={todoTasks} onToggle={toggleStatus} onEdit={setEditingTask} onDelete={setDeleteId} />
        )}
        {doingTasks.length > 0 && (
          <TaskSection title="进行中" tasks={doingTasks} onToggle={toggleStatus} onEdit={setEditingTask} onDelete={setDeleteId} />
        )}
        {doneTasks.length > 0 && (
          <TaskSection title="已完成" tasks={doneTasks} onToggle={toggleStatus} onEdit={setEditingTask} onDelete={setDeleteId} />
        )}
        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🌿</p>
            <p className="text-gray-400">这里空空如也</p>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      {showAdd && (
        <TaskEditor onClose={() => setShowAdd(false)} />
      )}
      {editingTask && (
        <TaskEditor task={editingTask} onClose={() => setEditingTask(null)} />
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) db.tasks.delete(deleteId) }}
        title="删除任务"
        message="确定要删除这个任务吗？此操作不可撤销。"
      />
    </div>
  )
}

function TaskSection({ title, tasks, onToggle, onEdit, onDelete }: {
  title: string
  tasks: Task[]
  onToggle: (t: Task) => void
  onEdit: (t: Task) => void
  onDelete: (id: number) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-warm-400 mb-2 px-1">{title} ({tasks.length})</h3>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="card p-3 flex items-center gap-3 group">
            <button
              onClick={() => onToggle(task)}
              className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                task.status === 'done' ? 'bg-sage-300 border-sage-300' : 'border-gray-300'
              }`}
            >
              {task.status === 'done' && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
              <p className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-warm-700'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-warm-400' : 'bg-sage-300'}`} />
                {task.dueDate && (
                  <span className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-400' : 'text-gray-400'}`}>
                    {task.dueDate}
                  </span>
                )}
                {task.tags.map(tag => (
                  <span key={tag} className="tag tag-warm">{tag}</span>
                ))}
              </div>
            </div>
            <button onClick={() => task.id && onDelete(task.id)} className="text-gray-300 hover:text-red-400 p-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskEditor({ task, onClose }: { task?: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState<Task['status']>(task?.status || 'todo')
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(task?.tags || [])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    if (task?.id) {
      await db.tasks.update(task.id, {
        title: title.trim(),
        description,
        status,
        priority,
        dueDate: dueDate || undefined,
        tags,
        updatedAt: now
      })
    } else {
      const order = await db.tasks.count()
      await db.tasks.add({
        title: title.trim(),
        description,
        status,
        priority,
        dueDate: dueDate || undefined,
        tags,
        createdAt: now,
        updatedAt: now,
        order
      })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={task ? '编辑任务' : '新建任务'}>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-warm-500 mb-1 block">任务名称</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入任务名称..."
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm text-warm-500 mb-1 block">描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="任务详情..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-warm-500 mb-1 block">优先级</label>
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                    priority === p
                      ? p === 'high' ? 'bg-red-400 text-white' : p === 'medium' ? 'bg-warm-400 text-white' : 'bg-sage-300 text-white'
                      : 'bg-warm-50 text-warm-400'
                  }`}
                >
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-warm-500 mb-1 block">状态</label>
            <div className="flex gap-1.5">
              {(['todo', 'doing', 'done'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                    status === s ? 'bg-warm-500 text-white' : 'bg-warm-50 text-warm-400'
                  }`}
                >
                  {s === 'todo' ? '待办' : s === 'doing' ? '进行中' : '已完成'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-warm-500 mb-1 block">截止日期</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
          />
        </div>

        <div>
          <label className="text-sm text-warm-500 mb-1 block">标签</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="输入标签后回车..."
              className="flex-1 px-3 py-2 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
            />
            <button onClick={addTag} className="btn-ghost">添加</button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(tag => (
                <span key={tag} className="tag tag-warm flex items-center gap-1">
                  {tag}
                  <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-warm-400">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSave} className="btn-primary w-full">保存</button>
      </div>
    </Modal>
  )
}
