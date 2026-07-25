import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, WatchlistItem } from '../db'
import Header from '../components/Header'
import Modal, { ConfirmDialog } from '../components/Modal'
import { fetchStockData, fetchMultipleStocks, searchStock, fetchKLineData, fetchMinuteData, StockData, KLinePeriod, KLineResult } from '../utils/stock'
import { todayStr, relativeTime } from '../utils/date'
import ReactECharts from 'echarts-for-react'

export default function StockPage() {
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [stockData, setStockData] = useState<Record<string, StockData>>({})
  const [selectedStock, setSelectedStock] = useState<{ code: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const watchlist = useLiveQuery(() => db.watchlist.orderBy('order').toArray(), [], [])
  const reviews = useLiveQuery(() => db.stockReviews.reverse().sortBy('reviewDate'), [], [])

  // 加载自选股行情
  const loadStockData = useCallback(async () => {
    if (watchlist.length === 0) return
    setLoading(true)
    const codes = watchlist.map(w => w.stockCode)
    const data = await fetchMultipleStocks(codes)
    const map: Record<string, StockData> = {}
    data.forEach(d => { map[d.code] = d })
    setStockData(map)
    setLoading(false)
  }, [watchlist])

  useEffect(() => {
    loadStockData()
    // 每 30 秒刷新
    const timer = setInterval(loadStockData, 30000)
    return () => clearInterval(timer)
  }, [loadStockData])

  const addToWatchlist = async (code: string, name: string) => {
    const exists = watchlist.find(w => w.stockCode === code)
    if (exists) return
    const order = await db.watchlist.count()
    await db.watchlist.add({
      stockCode: code,
      stockName: name,
      order,
      addedAt: new Date().toISOString()
    })
    setShowSearch(false)
    loadStockData()
  }

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="股票复盘"
        subtitle={`自选 ${watchlist.length} 只 · 复盘 ${reviews.length} 篇`}
        rightAction={
          <button onClick={() => setShowSearch(true)} className="text-white bg-white/20 rounded-lg p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
          </button>
        }
        gradient
      />

      {/* 刷新按钮 */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {loading ? '刷新中...' : `更新于 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}
        </span>
        <button onClick={loadStockData} className="text-xs text-warm-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
          刷新
        </button>
      </div>

      {/* 自选股列表 */}
      <div className="px-4 space-y-2">
        {watchlist.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">📈</p>
            <p className="text-gray-400 mb-3">还没有添加自选股</p>
            <button onClick={() => setShowSearch(true)} className="btn-primary">搜索添加</button>
          </div>
        ) : (
          watchlist.map(item => {
            const data = stockData[item.stockCode]
            const isUp = data ? data.change >= 0 : false
            return (
              <div
                key={item.id}
                className="card p-3 flex items-center justify-between"
              >
                <div
                  className="flex-1"
                  onClick={() => setSelectedStock({ code: item.stockCode, name: data?.name || item.stockName })}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-warm-800">{data?.name || item.stockName}</span>
                    <span className="text-xs text-gray-400">{item.stockCode}</span>
                  </div>
                  {data ? (
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-lg font-bold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
                        {data.current.toFixed(2)}
                      </span>
                      <span className={`text-sm ${isUp ? 'text-red-500' : 'text-green-500'}`}>
                        {isUp ? '+' : ''}{data.change.toFixed(2)} ({isUp ? '+' : ''}{data.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 mt-1">加载中...</span>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/stock/review/new`)}
                  className="text-xs text-warm-500 bg-warm-50 px-2 py-1 rounded-md"
                >
                  复盘
                </button>
                <button
                  onClick={() => item.id && setDeleteId(item.id)}
                  className="text-gray-300 hover:text-red-400 p-1 ml-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* 最近复盘 */}
      {reviews.length > 0 && (
        <div className="px-4 mt-6">
          <h3 className="text-sm font-semibold text-warm-600 mb-2">📝 最近复盘</h3>
          <div className="space-y-2">
            {reviews.slice(0, 5).map(r => (
              <div
                key={r.id}
                onClick={() => navigate(`/stock/review/${r.id}`)}
                className="card p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-warm-700">{r.stockName}</span>
                    <span className="text-xs text-gray-400">{r.stockCode}</span>
                    <span className={`tag ${
                      r.sentiment === 'bullish' ? 'tag-warm' :
                      r.sentiment === 'bearish' ? 'tag-blue' : 'tag-sage'
                    }`}>
                      {r.sentiment === 'bullish' ? '看多' : r.sentiment === 'bearish' ? '看空' : '中性'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{r.reviewDate}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索弹窗 */}
      {showSearch && (
        <StockSearchModal onClose={() => setShowSearch(false)} onAdd={addToWatchlist} />
      )}

      {/* K 线详情弹窗 */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) db.watchlist.delete(deleteId) }}
        title="移出自选"
        message="确定要将这只股票移出自选列表吗？"
      />
    </div>
  )
}

function StockSearchModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (code: string, name: string) => void
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
                onClick={() => onAdd(r.code, r.name)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-warm-50 hover:bg-warm-100 text-left"
              >
                <div>
                  <span className="text-sm font-medium text-warm-800">{r.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{r.code}</span>
                </div>
                <span className="text-xs text-warm-500">+ 添加</span>
              </button>
            ))}
          </div>
        )}

        {!searching && keyword && results.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">没有找到相关股票</p>
        )}
      </div>
    </Modal>
  )
}

function StockDetailModal({ stock, onClose }: {
  stock: { code: string; name: string }
  onClose: () => void
}) {
  const [kline, setKline] = useState<KLineResult | null>(null)
  const [realtime, setRealtime] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<KLinePeriod>('day')

  const PERIODS: { key: KLinePeriod; label: string }[] = [
    { key: 'minute', label: '分时' },
    { key: 'day',    label: '日K' },
    { key: 'week',   label: '周K' },
    { key: 'month',  label: '月K' },
    { key: 'year',   label: '年K' },
  ]

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        if (period === 'minute') {
          const [rt, min] = await Promise.all([
            fetchStockData(stock.code),
            fetchMinuteData(stock.code),
          ])
          setRealtime(rt)
          setKline(min)
        } else {
          const [rt, kl] = await Promise.all([
            fetchStockData(stock.code),
            fetchKLineData(stock.code, period),
          ])
          setRealtime(rt)
          setKline(kl)
        }
      } catch (err) {
        console.error('加载图表数据失败:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [stock.code, period])

  // 构建 ECharts 配置
  const chartOption = (() => {
    if (!kline || kline.dates.length === 0) return {}

    // ========== 分时线配置 ==========
    if (period === 'minute') {
      return {
        grid: { left: 50, right: 15, top: 20, bottom: 30 },
        xAxis: {
          type: 'category',
          data: kline.dates,
          axisLine: { lineStyle: { color: '#E5D5C8' } },
          axisLabel: {
            color: '#A09080', fontSize: 9,
            interval: 29, // 每30分钟显示一个标签
          },
        },
        yAxis: {
          type: 'value',
          scale: true,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F5EDE5' } },
          axisLabel: { color: '#A09080', fontSize: 10 },
        },
        series: [
          {
            name: '价格',
            type: 'line',
            data: kline.closes,
            smooth: false,
            symbol: 'none',
            lineStyle: { color: '#F5A88B', width: 1.5 },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(245, 168, 139, 0.25)' },
                  { offset: 1, color: 'rgba(245, 168, 139, 0)' },
                ],
              },
            },
            markLine: kline.yesterdayClose ? {
              silent: true,
              symbol: 'none',
              lineStyle: { color: '#A09080', type: 'dashed', width: 1 },
              data: [{ yAxis: kline.yesterdayClose }],
              label: {
                show: true,
                position: 'end',
                formatter: `昨收 ${kline.yesterdayClose.toFixed(2)}`,
                color: '#A09080',
                fontSize: 10,
              },
            } : undefined,
          },
        ],
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const p = params[0]
            return `${p.axisValue}<br/>价格: ${Number(p.value).toFixed(2)}`
          },
        },
      }
    }

    // ========== K 线蜡烛图配置（日K/周K/月K/年K） ==========
    // ECharts candlestick data: [open, close, low, high]
    const candleData = kline.opens.map((o, i) => [o, kline.closes[i], kline.lows[i], kline.highs[i]])

    return {
      grid: [
        { left: 50, right: 15, top: 15, height: '52%' },        // 蜡烛图区域
        { left: 50, right: 15, top: '70%', height: '20%' },      // 成交量区域
      ],
      xAxis: [
        {
          type: 'category',
          data: kline.dates,
          gridIndex: 0,
          axisLine: { lineStyle: { color: '#E5D5C8' } },
          axisLabel: {
            color: '#A09080', fontSize: 9,
            rotate: period === 'year' ? 0 : 30,
          },
          axisTick: { alignWithLabel: true },
        },
        {
          type: 'category',
          data: kline.dates,
          gridIndex: 1,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
        },
      ],
      yAxis: [
        {
          type: 'value',
          scale: true,
          gridIndex: 0,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F5EDE5' } },
          axisLabel: { color: '#A09080', fontSize: 10 },
        },
        {
          type: 'value',
          gridIndex: 1,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
        },
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: candleData,
          itemStyle: {
            color: '#ef5350',            // 阳线（涨）红色
            color0: '#26a69a',           // 阴线（跌）绿色
            borderColor: '#ef5350',
            borderColor0: '#26a69a',
          },
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: kline.volumes.map((v, i) => ({
            value: v,
            itemStyle: {
              color: kline.closes[i] >= kline.opens[i]
                ? 'rgba(239, 83, 80, 0.5)'
                : 'rgba(38, 166, 154, 0.5)',
            },
          })),
        },
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const k = params.find((p: any) => p.seriesName === 'K线')
          const v = params.find((p: any) => p.seriesName === '成交量')
          if (!k) return ''
          const d = k.data // [open, close, low, high]
          const change = d[1] - d[0]
          const changePct = d[0] !== 0 ? (change / d[0] * 100) : 0
          const volStr = v ? `<br/>量: ${(v.value / 10000).toFixed(0)}万手` : ''
          return `${k.axisValue}<br/>开: ${d[0]}<br/>收: ${d[1]}<br/>低: ${d[2]}<br/>高: ${d[3]}<br/>涨跌: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct.toFixed(2)}%)${volStr}`
        },
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 50,
          end: 100,
        },
        {
          type: 'slider',
          xAxisIndex: [0, 1],
          start: 50,
          end: 100,
          bottom: 5,
          height: 18,
          borderColor: '#E5D5C8',
          fillerColor: 'rgba(245, 168, 139, 0.15)',
          handleStyle: { color: '#F5A88B' },
          textStyle: { color: '#A09080', fontSize: 9 },
        },
      ],
    }
  })()

  const chartHeight = period === 'minute' ? 260 : 360

  return (
    <Modal open onClose={onClose} title={`${stock.name} (${stock.code})`}>
      {loading ? (
        <p className="text-center text-sm text-gray-400 py-8">加载中...</p>
      ) : (
        <div className="space-y-3">
          {/* 实时数据 */}
          {realtime && (
            <div className="flex items-center gap-4 p-3 bg-warm-50 rounded-xl">
              <div>
                <p className={`text-2xl font-bold ${realtime.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {realtime.current.toFixed(2)}
                </p>
                <p className={`text-sm ${realtime.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {realtime.change >= 0 ? '+' : ''}{realtime.change.toFixed(2)}
                  ({realtime.change >= 0 ? '+' : ''}{realtime.changePercent.toFixed(2)}%)
                </p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-400">开盘: <span className="text-warm-700">{realtime.open.toFixed(2)}</span></span>
                <span className="text-gray-400">昨收: <span className="text-warm-700">{realtime.yesterdayClose.toFixed(2)}</span></span>
                <span className="text-gray-400">最高: <span className="text-red-400">{realtime.high.toFixed(2)}</span></span>
                <span className="text-gray-400">最低: <span className="text-green-500">{realtime.low.toFixed(2)}</span></span>
              </div>
            </div>
          )}

          {/* 周期切换 Tab */}
          <div className="flex bg-warm-50 rounded-xl p-1 gap-0.5">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p.key
                    ? 'bg-white text-warm-600 shadow-sm'
                    : 'text-warm-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 图表 */}
          {kline && kline.dates.length > 0 ? (
            <ReactECharts option={chartOption} style={{ height: chartHeight }} />
          ) : (
            <p className="text-center text-sm text-gray-400 py-4">
              {period === 'minute' ? '非交易时段，暂无分时数据' : '暂无K线数据'}
            </p>
          )}

          {/* 写复盘按钮 */}
          <button
            onClick={() => {
              onClose()
              window.location.hash = `/stock/review/new`
            }}
            className="btn-primary w-full"
          >
            ✍️ 写复盘笔记
          </button>
        </div>
      )}
    </Modal>
  )
}
