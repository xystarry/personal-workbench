import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, Note } from '../db'
import Header from '../components/Header'
import { relativeTime } from '../utils/date'

export default function KnowledgePage() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const navigate = useNavigate()

  const notes = useLiveQuery(async () => {
    return db.notes.where('type').equals('note').reverse().sortBy('updatedAt')
  }, [], [])

  const allTags = [...new Set((notes || []).flatMap(n => n.tags))]

  const filteredNotes = (notes || []).filter(n => {
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    const matchTag = !activeTag || n.tags.includes(activeTag)
    return matchSearch && matchTag
  })

  const createNote = async () => {
    const now = new Date().toISOString()
    const id = await db.notes.add({
      title: '',
      content: '',
      tags: [],
      type: 'note',
      createdAt: now,
      updatedAt: now
    })
    navigate(`/knowledge/notes/${id}`)
  }

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="知识库"
        subtitle={`${notes?.length || 0} 篇笔记`}
        rightAction={
          <button onClick={createNote} className="text-white bg-white/20 rounded-lg p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
        gradient
      />

      {/* 搜索栏 */}
      <div className="px-4 py-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索笔记..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-warm-100 text-sm text-warm-800"
          />
        </div>
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${!activeTag ? 'bg-warm-500 text-white' : 'bg-white text-warm-500'}`}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${activeTag === tag ? 'bg-warm-500 text-white' : 'bg-white text-warm-500'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 笔记列表 */}
      <div className="px-4 pt-2 space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📖</p>
            <p className="text-gray-400 mb-3">{search ? '没有找到匹配的笔记' : '还没有笔记'}</p>
            {!search && (
              <button onClick={createNote} className="btn-primary">写第一篇笔记</button>
            )}
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => navigate(`/knowledge/notes/${note.id}`)}
              className="card p-3.5"
            >
              <h3 className="font-medium text-warm-800 mb-1 truncate">
                {note.title || '无标题'}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                {note.content.replace(/[#*`>\-]/g, '').slice(0, 100) || '空笔记'}
              </p>
              <div className="flex items-center gap-2">
                {note.tags.map(tag => (
                  <span key={tag} className="tag tag-sage">{tag}</span>
                ))}
                <span className="text-xs text-gray-400 ml-auto">{relativeTime(note.updatedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
