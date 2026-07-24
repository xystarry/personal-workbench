import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Bookmark } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'

export default function BookmarksPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const bookmarks = useLiveQuery(() => db.bookmarks.orderBy('order').toArray(), [], [])

  const categories = [...new Set((bookmarks || []).map(b => b.category))]
  const filtered = filter === 'all' ? bookmarks : bookmarks.filter(b => b.category === filter)

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="链接收藏"
        subtitle={`${bookmarks.length} 个链接`}
        showBack
        rightAction={
          <button onClick={() => setShowAdd(true)} className="text-white bg-white/20 rounded-lg p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
        gradient
      />

      {/* 分类筛选 */}
      {categories.length > 0 && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-warm-500 text-white' : 'bg-white text-warm-500'}`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filter === cat ? 'bg-warm-500 text-white' : 'bg-white text-warm-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 链接列表 */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🔖</p>
            <p className="text-gray-400 mb-3">还没有收藏链接</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary">添加链接</button>
          </div>
        ) : (
          filtered.map(bm => (
            <div key={bm.id} className="card p-3 flex items-center gap-3">
              <a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-3 min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center text-lg flex-shrink-0">
                  {bm.icon || '🔗'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-warm-800 truncate">{bm.title}</p>
                  <p className="text-xs text-gray-400 truncate">{bm.url}</p>
                </div>
                <span className="tag tag-warm flex-shrink-0">{bm.category}</span>
              </a>
              <button
                onClick={() => setEditingBookmark(bm)}
                className="text-gray-300 hover:text-warm-400 p-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => bm.id && setDeleteId(bm.id)}
                className="text-gray-300 hover:text-red-400 p-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {showAdd && <BookmarkEditor onClose={() => setShowAdd(false)} />}
      {editingBookmark && <BookmarkEditor bookmark={editingBookmark} onClose={() => setEditingBookmark(null)} />}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) db.bookmarks.delete(deleteId) }}
        title="删除链接"
        message="确定要删除这个链接吗？"
      />
    </div>
  )
}

function BookmarkEditor({ bookmark, onClose }: { bookmark?: Bookmark; onClose: () => void }) {
  const [title, setTitle] = useState(bookmark?.title || '')
  const [url, setUrl] = useState(bookmark?.url || '')
  const [category, setCategory] = useState(bookmark?.category || '常用')
  const [icon, setIcon] = useState(bookmark?.icon || '🔗')

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return
    if (bookmark?.id) {
      await db.bookmarks.update(bookmark.id, { title, url, category, icon })
    } else {
      const order = await db.bookmarks.count()
      await db.bookmarks.add({
        title, url, category, icon, order,
        createdAt: new Date().toISOString()
      })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={bookmark ? '编辑链接' : '添加链接'}>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-warm-500 mb-1 block">名称</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="链接名称"
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-1 block">网址</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-1 block">分类</label>
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="如：股票、常用、工具"
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
          />
        </div>
        <div>
          <label className="text-sm text-warm-500 mb-1 block">图标（Emoji）</label>
          <input
            type="text"
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
          />
        </div>
        <button onClick={handleSave} className="btn-primary w-full" disabled={!title.trim() || !url.trim()}>
          保存
        </button>
      </div>
    </Modal>
  )
}
