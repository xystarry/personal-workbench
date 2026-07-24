import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, Note } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'

export default function NotesEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!id) return
    db.notes.get(parseInt(id)).then(n => {
      if (n) {
        setNote(n)
        setTitle(n.title)
        setContent(n.content)
        setTags(n.tags)
      }
    })
  }, [id])

  // 自动保存
  const autoSave = () => {
    if (!note?.id) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await db.notes.update(note.id!, {
        title: title.trim() || '无标题',
        content,
        tags,
        updatedAt: new Date().toISOString()
      })
    }, 800)
  }

  useEffect(() => {
    autoSave()
  }, [title, content, tags])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const handleDelete = async () => {
    if (note?.id) {
      await db.notes.delete(note.id)
      navigate('/knowledge')
    }
  }

  // 简单 Markdown 预览
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-warm-800 mt-3 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-warm-800 mt-3 mb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-warm-800 mt-3 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-warm-800">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-warm-50 px-1.5 py-0.5 rounded text-warm-600 text-sm">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-3 border-warm-300 pl-3 text-gray-500 italic my-2">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-warm-700">$1</li>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="编辑笔记"
        showBack
        rightAction={
          <div className="flex gap-1">
            <button onClick={() => setShowPreview(!showPreview)} className="text-white bg-white/20 rounded-lg p-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button onClick={() => setShowDelete(true)} className="text-white bg-white/20 rounded-lg p-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6" />
              </svg>
            </button>
          </div>
        }
        gradient
      />

      <div className="px-4 py-3">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="标题..."
          className="w-full text-lg font-bold text-warm-800 bg-transparent border-none mb-3"
        />

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(tag => (
            <span key={tag} className="tag tag-sage flex items-center gap-1">
              {tag}
              <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-sage-400">×</button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="+标签"
            className="text-xs bg-warm-50 px-2 py-1 rounded-md text-warm-500 w-20"
          />
        </div>

        {showPreview ? (
          <div
            className="card p-4 min-h-[300px] prose-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<p class="text-gray-400">还没有内容</p>' }}
          />
        ) : (
          <textarea
            ref={contentRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="开始写作... 支持 Markdown 格式"
            className="w-full min-h-[400px] bg-white rounded-xl p-4 text-warm-700 border border-warm-100 resize-none text-sm leading-relaxed"
          />
        )}

        <p className="text-xs text-gray-400 mt-2 text-center">📝 支持Markdown · 自动保存</p>
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="删除笔记"
        message="确定要删除这篇笔记吗？此操作不可撤销。"
      />
    </div>
  )
}
