import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'

export default function SettingsPage() {
  const [showClear, setShowClear] = useState(false)
  const [exporting, setExporting] = useState(false)

  const settings = useLiveQuery(() => db.settings.toArray(), [], [])

  const getSetting = (key: string, defaultVal: string = '') => {
    const s = settings.find(s => s.key === key)
    return s ? String(s.value) : defaultVal
  }

  const updateSetting = async (key: string, value: any) => {
    const existing = settings.find(s => s.key === key)
    if (existing) {
      await db.settings.update(key, { value })
    } else {
      await db.settings.add({ key, value })
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const data: Record<string, any> = {}
      const tables = ['tasks', 'notes', 'folders', 'projects', 'habits', 'goals', 'stockReviews', 'watchlist', 'bookmarks', 'settings']
      for (const t of tables) {
        data[t] = await (db as any)[t].toArray()
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workbench-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
    setExporting(false)
  }

  const handleClear = async () => {
    const tables = ['tasks', 'notes', 'folders', 'projects', 'habits', 'goals', 'stockReviews', 'watchlist', 'bookmarks']
    for (const t of tables) {
      await (db as any)[t].clear()
    }
    location.reload()
  }

  const settingItems: { key: string; label: string; icon: string; type: 'text' | 'select'; placeholder?: string; options?: { value: string; label: string }[] }[] = [
    { key: 'userName', label: '昵称', icon: '👤', type: 'text', placeholder: '输入昵称' },
    { key: 'firstDayOfWeek', label: '每周第一天', icon: '📅', type: 'select', options: [{ value: '0', label: '周日' }, { value: '1', label: '周一' }] },
  ]

  return (
    <div className="page-enter min-h-screen">
      <Header title="设置" showBack gradient />

      <div className="px-4 py-3 space-y-4">
        {/* 基本设置 */}
        <div className="card overflow-hidden">
          {settingItems.map((item, i) => (
            <div key={item.key} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-warm-50' : ''}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-warm-700 flex-shrink-0">{item.label}</span>
              {item.type === 'text' && (
                <input
                  type="text"
                  value={getSetting(item.key, '')}
                  onChange={e => updateSetting(item.key, e.target.value)}
                  placeholder={item.placeholder}
                  className="flex-1 text-right text-sm text-warm-600 bg-transparent"
                />
              )}
              {item.type === 'select' && (
                <select
                  value={getSetting(item.key, '1')}
                  onChange={e => updateSetting(item.key, parseInt(e.target.value))}
                  className="flex-1 text-right text-sm text-warm-600 bg-transparent"
                >
                  {item.options?.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* 数据管理 */}
        <div>
          <h3 className="text-sm font-semibold text-warm-600 mb-2 px-1">数据管理</h3>
          <div className="card overflow-hidden">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-xl">📥</span>
              <span className="flex-1 text-sm text-warm-700">
                {exporting ? '导出中...' : '导出数据'}
              </span>
              <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <button
              onClick={() => setShowClear(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-t border-warm-50"
            >
              <span className="text-xl">🗑️</span>
              <span className="flex-1 text-sm text-red-400">清空所有数据</span>
              <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 关于 */}
        <div>
          <h3 className="text-sm font-semibold text-warm-600 mb-2 px-1">关于</h3>
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-xl">ℹ️</span>
              <span className="flex-1 text-sm text-warm-700">版本</span>
              <span className="text-sm text-gray-400">v1.0.0</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5 border-t border-warm-50">
              <span className="text-xl">💾</span>
              <span className="flex-1 text-sm text-warm-700">数据存储</span>
              <span className="text-sm text-gray-400">本地 IndexedDB</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5 border-t border-warm-50">
              <span className="text-xl">📱</span>
              <span className="flex-1 text-sm text-warm-700">应用类型</span>
              <span className="text-sm text-gray-400">PWA 离线应用</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 py-4">
          个人工作台 · 数据完全存储在本地设备
        </p>
      </div>

      <ConfirmDialog
        open={showClear}
        onClose={() => setShowClear(false)}
        onConfirm={handleClear}
        title="清空所有数据"
        message="这将删除所有任务、笔记、项目、习惯、复盘等数据，且不可恢复。建议先导出备份。确定继续吗？"
      />
    </div>
  )
}
