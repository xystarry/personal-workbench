import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Project, Milestone } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'

const statusOptions = [
  { key: 'planning', label: '规划中' },
  { key: 'active', label: '进行中' },
  { key: 'paused', label: '已暂停' },
  { key: 'completed', label: '已完成' },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [newMilestone, setNewMilestone] = useState('')

  const project = useLiveQuery(() => db.projects.get(parseInt(id || '0')), [id], null)

  if (!project) return null

  const updateProject = async (changes: Partial<Project>) => {
    if (!project.id) return
    await db.projects.update(project.id, { ...changes, updatedAt: new Date().toISOString() })
  }

  const addMilestone = async () => {
    if (!newMilestone.trim() || !project.id) return
    const milestone: Milestone = {
      id: Date.now().toString(),
      title: newMilestone.trim(),
      done: false
    }
    const milestones = [...(project.milestones || []), milestone]
    await updateProject({ milestones })
    setNewMilestone('')
  }

  const toggleMilestone = async (mid: string) => {
    const milestones = (project.milestones || []).map(m =>
      m.id === mid ? { ...m, done: !m.done } : m
    )
    const progress = Math.round(milestones.filter(m => m.done).length / milestones.length * 100)
    await updateProject({ milestones, progress })
  }

  const deleteMilestone = async (mid: string) => {
    const milestones = (project.milestones || []).filter(m => m.id !== mid)
    const progress = milestones.length > 0
      ? Math.round(milestones.filter(m => m.done).length / milestones.length * 100)
      : 0
    await updateProject({ milestones, progress })
  }

  const handleDelete = async () => {
    if (project.id) {
      await db.projects.delete(project.id)
      navigate('/projects')
    }
  }

  const doneMilestones = (project.milestones || []).filter(m => m.done).length
  const totalMilestones = (project.milestones || []).length

  return (
    <div className="page-enter min-h-screen">
      <Header
        title={project.name}
        showBack
        rightAction={
          <button onClick={() => setShowEdit(true)} className="text-white bg-white/20 rounded-lg p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        }
        gradient
      />

      <div className="px-4 py-4 space-y-4">
        {/* 项目信息 */}
        <div className="card p-4">
          {project.description && (
            <p className="text-sm text-warm-600 mb-3">{project.description}</p>
          )}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400">状态：</span>
            <div className="flex gap-1">
              {statusOptions.map(s => (
                <button
                  key={s.key}
                  onClick={() => updateProject({ status: s.key as any })}
                  className={`px-2 py-1 rounded-md text-xs ${
                    project.status === s.key ? 'bg-warm-500 text-white' : 'bg-warm-50 text-warm-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">日期：</span>
            <input
              type="date"
              value={project.startDate || ''}
              onChange={e => updateProject({ startDate: e.target.value })}
              className="text-xs bg-warm-50 px-2 py-1 rounded-md text-warm-600"
            />
            <span className="text-xs text-gray-400">~</span>
            <input
              type="date"
              value={project.endDate || ''}
              onChange={e => updateProject({ endDate: e.target.value })}
              className="text-xs bg-warm-50 px-2 py-1 rounded-md text-warm-600"
            />
          </div>
        </div>

        {/* 进度 */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-warm-600">项目进度</h3>
            <span className="text-2xl font-bold text-warm-700">{project.progress}%</span>
          </div>
          <div className="h-3 bg-warm-50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%`, background: project.color }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {doneMilestones}/{totalMilestones} 个里程碑已完成
          </p>
        </div>

        {/* 里程碑 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-warm-600 mb-3">里程碑</h3>

          {/* 添加里程碑 */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newMilestone}
              onChange={e => setNewMilestone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMilestone()}
              placeholder="添加里程碑..."
              className="flex-1 px-3 py-2 rounded-lg bg-warm-50 border border-warm-200 text-sm text-warm-800"
            />
            <button onClick={addMilestone} className="btn-ghost">添加</button>
          </div>

          {/* 里程碑列表 */}
          {totalMilestones === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">还没有里程碑</p>
          ) : (
            <div className="space-y-2">
              {(project.milestones || []).map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-warm-50/50">
                  <button
                    onClick={() => toggleMilestone(m.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      m.done ? 'bg-sage-300 border-sage-300' : 'border-gray-300'
                    }`}
                  >
                    {m.done && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${m.done ? 'line-through text-gray-400' : 'text-warm-700'}`}>
                    {m.title}
                  </span>
                  <button onClick={() => deleteMilestone(m.id)} className="text-gray-300 hover:text-red-400 p-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowDelete(true)} className="text-red-400 text-sm w-full text-center py-2">
          删除项目
        </button>
      </div>

      {showEdit && (
        <ProjectEditModal project={project} onClose={() => setShowEdit(false)} onSave={updateProject} />
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="删除项目"
        message="确定要删除这个项目吗？所有里程碑数据将丢失。"
      />
    </div>
  )
}

function ProjectEditModal({ project, onClose, onSave }: {
  project: Project
  onClose: () => void
  onSave: (changes: Partial<Project>) => void
}) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')

  return (
    <Modal open onClose={onClose} title="编辑项目">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-warm-500 mb-1 block">项目名称</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-1 block">描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800 resize-none"
          />
        </div>
        <button
          onClick={() => { onSave({ name, description }); onClose() }}
          className="btn-primary w-full"
        >
          保存
        </button>
      </div>
    </Modal>
  )
}
