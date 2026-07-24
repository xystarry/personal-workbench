import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, Project } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'
import { relativeTime } from '../utils/date'

const colors = ['#F5A88B', '#9BB591', '#B8A8D0', '#60A5FA', '#FBBF24', '#F472B6']
const statusLabels: Record<string, string> = {
  planning: '规划中', active: '进行中', paused: '已暂停', completed: '已完成'
}
const statusColors: Record<string, string> = {
  planning: 'tag-lavender', active: 'tag-sage', paused: 'tag-warm', completed: 'tag-blue'
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const projects = useLiveQuery(() => db.projects.reverse().sortBy('updatedAt'), [], [])

  const filteredProjects = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  const createProject = async (name: string, description: string, color: string) => {
    const now = new Date().toISOString()
    const id = await db.projects.add({
      name,
      description,
      color,
      status: 'planning',
      progress: 0,
      milestones: [],
      createdAt: now,
      updatedAt: now
    })
    setShowAdd(false)
    navigate(`/projects/${id}`)
  }

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="项目跟踪"
        subtitle={`${projects.length} 个项目`}
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
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {[
          { key: 'all', label: '全部' },
          { key: 'planning', label: '规划中' },
          { key: 'active', label: '进行中' },
          { key: 'paused', label: '已暂停' },
          { key: 'completed', label: '已完成' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              filter === f.key ? 'bg-warm-500 text-white' : 'bg-white text-warm-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 项目列表 */}
      <div className="px-4 space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🎯</p>
            <p className="text-gray-400 mb-3">还没有项目</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary">创建第一个项目</button>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
                  <h3 className="font-semibold text-warm-800">{project.name}</h3>
                </div>
                <span className={`tag ${statusColors[project.status]}`}>{statusLabels[project.status]}</span>
              </div>

              {project.description && (
                <p className="text-sm text-gray-400 mb-2 line-clamp-2">{project.description}</p>
              )}

              {/* 进度条 */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>进度</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 bg-warm-50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${project.progress}%`, background: project.color }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{project.milestones?.filter(m => m.done).length || 0}/{project.milestones?.length || 0} 里程碑</span>
                <span>{relativeTime(project.updatedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && <ProjectCreateModal onClose={() => setShowAdd(false)} onCreate={createProject} />}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) db.projects.delete(deleteId) }}
        title="删除项目"
        message="确定要删除这个项目吗？所有相关数据将丢失。"
      />
    </div>
  )
}

function ProjectCreateModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string, desc: string, color: string) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(colors[0])

  return (
    <Modal open onClose={onClose} title="新建项目">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-warm-500 mb-1 block">项目名称</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入项目名称..."
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-1 block">描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="项目简介..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800 resize-none"
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-2 block">主题色</label>
          <div className="flex gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-warm-300' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() => name.trim() && onCreate(name.trim(), description.trim(), color)}
          className="btn-primary w-full"
          disabled={!name.trim()}
        >
          创建
        </button>
      </div>
    </Modal>
  )
}
