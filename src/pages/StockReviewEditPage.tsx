import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, StockReview } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'
import { searchStock, fetchStockData } from '../utils/stock'
import { todayStr } from '../utils/date'

const sentiments = [
  { key: 'bullish', label: '看多', emoji: '📈', color: 'bg-red-100 text-red-500' },
  { key: 'neutral', label: '中性', emoji: '➡️', color: 'bg-gray-100 text-gray-500' },
  { key: 'bearish', label: '看空', emoji: '📉', color: 'bg-green-100 text-green-500' },
]

export default function StockReviewEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [stockCode, setStockCode] = useState('')
  const [stockName, setStockName] = useState('')
  const [reviewDate, setReviewDate] = useState(todayStr())
  const [content, setContent] = useState('')
  const [action, setAction] = useState('')
  const [sentiment, setSentiment] = useState<StockReview['sentiment']>('neutral')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [realtimePrice, setRealtimePrice] = useState<string>('')

  const watchlist = useLiveQuery(() => db.watchlist.toArray(), [], [])

  // 加载已有复盘
  useEffect(() => {
    if (!isNew && id) {
      db.stockReviews.get(parseInt(id)).then(r => {
        if (r) {
          setStockCode(r.stockCode)
          setStockName(r.stockName)
          setReviewDate(r.reviewDate)
          setContent(r.content)
          setAction(r.action || '')
          setSentiment(r.sentiment)
          setTags(r.tags)
        }
      })
    }
  }, [id, isNew])

  // 获取实时价格
  useEffect(() => {
    if (stockCode) {
      fetchStockData(stockCode).then(data => {
        if (data) {
          setStockName(data.name)
          setRealtimePrice(`${data.current.toFixed(2)} ${data.change >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%`)
        }
      })
    }
  }, [stockCode])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const handleSave = async () => {
    if (!stockCode || !content.trim()) return
    const now = new Date().toISOString()

    if (isNew) {
      await db.stockReviews.add({
        stockCode,
        stockName: stockName || stockCode,
        reviewDate,
        content,
        action,
        sentiment,
        tags,
        createdAt: now,
        updatedAt: now
      })
    } else if (id) {
      await db.stockReviews.update(parseInt(id), {
        stockCode,
        stockName: stockName || stockCode,
        reviewDate,
        content,
        action,
        sentiment,
        tags,
        updatedAt: now
      })
    }

    // 如果不在自选列表，自动添加
    const inWatchlist = watchlist.find(w => w.stockCode === stockCode)
    if (!inWatchlist) {
      const order = await db.watchlist.count()
      await db.watchlist.add({
        stockCode,
        stockName: stockName || stockCode,
        order,
        addedAt: now
      })
    }

    navigate('/stock')
  }

  const handleDelete = async () => {
    if (!isNew && id) {
      await db.stockReviews.delete(parseInt(id))
      navigate('/stock')
    }
  }

  return (
    <div className="page-enter min-h-screen">
      <Header
        title={isNew ? '新建复盘' : '编辑复盘'}
        showBack
        rightAction={
          !isNew ? (
            <button onClick={() => setShowDelete(true)} className="text-white bg-white/20 rounded-lg p-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6" />
              </svg>
            </button>
          ) : undefined
        }
        gradient
      />

      <div className="px-4 py-4 space-y-4">
        {/* 选股 */}
        <div className="card p-4">
          <label className="text-sm text-warm-500 mb-2 block">选择股票</label>
          {stockCode ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-warm-800">{stockName}</span>
                <span className="text-xs text-gray-400 ml-2">{stockCode}</span>
                {realtimePrice && (
                  <p className="text-xs text-warm-400 mt-1">当前: {realtimePrice}</p>
                )}
              </div>
              <button onClick={() => setShowSearch(true)} className="text-xs text-warm-500">更换</button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full py-3 rounded-lg bg-warm-50 text-warm-400 text-sm"
            >
              🔍 点击选择股票
            </button>
          )}

          {/* 快速从自选选择 */}
          {watchlist.length > 0 && !stockCode && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {watchlist.slice(0, 6).map(w => (
                <button
                  key={w.id}
                  onClick={() => setStockCode(w.stockCode)}
                  className="tag tag-warm"
                >
                  {w.stockName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 日期 */}
        <div>
          <label className="text-sm text-warm-500 mb-1 block">复盘日期</label>
          <input
            type="date"
            value={reviewDate}
            onChange={e => setReviewDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-white border border-warm-100 text-warm-800"
          />
        </div>

        {/* 观点 */}
        <div>
          <label className="text-sm text-warm-500 mb-2 block">今日观点</label>
          <div className="flex gap-2">
            {sentiments.map(s => (
              <button
                key={s.key}
                onClick={() => setSentiment(s.key as any)}
                className={`flex-1 py-2.5 rounded-lg text-sm flex items-center justify-center gap-1 ${
                  sentiment === s.key ? s.color : 'bg-warm-50 text-warm-400'
                }`}
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 复盘内容 */}
        <div>
          <label className="text-sm text-warm-500 mb-1 block">复盘内容</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="今日走势分析、资金流向、技术指标、情绪面..."
            rows={6}
            className="w-full px-3 py-2.5 rounded-lg bg-white border border-warm-100 text-warm-700 resize-none text-sm"
          />
        </div>

        {/* 操作计划 */}
        <div>
          <label className="text-sm text-warm-500 mb-1 block">操作计划</label>
          <input
            type="text"
            value={action}
            onChange={e => setAction(e.target.value)}
            placeholder="如：明天关注XX支撑位，跌破则止损"
            className="w-full px-3 py-2.5 rounded-lg bg-white border border-warm-100 text-warm-700"
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="text-sm text-warm-500 mb-1 block">标签</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="如：止损、加仓、趋势..."
              className="flex-1 px-3 py-2 rounded-lg bg-white border border-warm-100 text-warm-700"
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

        <button onClick={handleSave} className="btn-primary w-full" disabled={!stockCode || !content.trim()}>
          保存复盘
        </button>
      </div>

      {/* 股票搜索弹窗 */}
      {showSearch && (
        <StockSearchModal
          onClose={() => setShowSearch(false)}
          onSelect={(code, name) => {
            setStockCode(code)
            setStockName(name)
            setShowSearch(false)
          }}
        />
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="删除复盘"
        message="确定要删除这篇复盘笔记吗？"
      />
    </div>
  )
}

function StockSearchModal({ onClose, onSelect }: {
  onClose: () => void
  onSelect: (code: string, name: string) => void
}) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<{ code: string; name: string }[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!keyword.trim()) return
    setSearching(true)
    const data = await searchStock(keyword.trim())
    setResults(data)
    setSearching(false)
  }

  return (
    <Modal open onClose={onClose} title="搜索股票">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="输入股票代码或名称..."
            className="flex-1 px-3 py-2.5 rounded-lg bg-warm-50 border border-warm-200 text-warm-800"
            autoFocus
          />
          <button onClick={handleSearch} className="btn-primary">搜索</button>
        </div>

        {searching && <p className="text-center text-sm text-gray-400 py-4">搜索中...</p>}

        {!searching && results.length > 0 && (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.code}
                onClick={() => onSelect(r.code, r.name)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-warm-50 hover:bg-warm-100 text-left"
              >
                <div>
                  <span className="text-sm font-medium text-warm-800">{r.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{r.code}</span>
                </div>
                <span className="text-xs text-warm-500">选择</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
