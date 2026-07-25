// 股票行情数据获取工具
// 使用腾讯财经接口（支持 CORS）

interface StockData {
  code: string
  name: string
  open: number
  yesterdayClose: number
  current: number
  high: number
  low: number
  volume: number
  amount: number
  change: number
  changePercent: number
  timestamp: string
}

// 腾讯接口代码格式：sh600519 / sz000001
function toTencentCode(code: string): string {
  const c = code.trim()
  if (c.startsWith('6') || c.startsWith('5') || c.startsWith('11') || c.startsWith('13')) {
    return 'sh' + c
  } else {
    return 'sz' + c
  }
}

// 解析腾讯接口返回数据
// 格式: v_sh600519="1~贵州茅台~600519~1805.00~1790.00~1798.88~..."
function parseTencentData(text: string, code: string): StockData | null {
  try {
    const match = text.match(/"(.+?)"/)
    if (!match) return null
    const parts = match[1].split('~')
    if (parts.length < 35) return null

    const name = parts[1]
    const current = parseFloat(parts[3])
    const yesterdayClose = parseFloat(parts[4])
    const open = parseFloat(parts[5])
    const volume = parseFloat(parts[6]) * 100
    const high = parseFloat(parts[33])
    const low = parseFloat(parts[34])
    const amount = parseFloat(parts[37])
    const change = current - yesterdayClose
    const changePercent = yesterdayClose > 0 ? (change / yesterdayClose * 100) : 0

    return {
      code,
      name,
      open,
      yesterdayClose,
      current,
      high,
      low,
      volume,
      amount,
      change,
      changePercent,
      timestamp: new Date().toISOString()
    }
  } catch {
    return null
  }
}

// 获取单只股票实时行情（腾讯接口，支持 CORS）
export async function fetchStockData(code: string): Promise<StockData | null> {
  try {
    const tcCode = toTencentCode(code)
    const url = `https://qt.gtimg.cn/q=${tcCode}`
    const response = await fetch(url)
    if (!response.ok) return null
    const text = await response.text()
    return parseTencentData(text, code)
  } catch (error) {
    console.error('获取股票数据失败:', error)
    return null
  }
}

// 批量获取多只股票行情（腾讯接口，支持 CORS）
export async function fetchMultipleStocks(codes: string[]): Promise<StockData[]> {
  try {
    const tcCodes = codes.map(toTencentCode)
    const url = `https://qt.gtimg.cn/q=${tcCodes.join(',')}`
    const response = await fetch(url)
    if (!response.ok) return []
    const text = await response.text()
    const lines = text.split(';').filter(l => l.trim())

    const results: StockData[] = []
    for (let i = 0; i < lines.length; i++) {
      const data = parseTencentData(lines[i], codes[i])
      if (data) results.push(data)
    }
    return results
  } catch (error) {
    console.error('批量获取股票数据失败:', error)
    return []
  }
}

// 常见股票代码表（内置，不依赖外部搜索 API）
const STOCK_LIST: { code: string; name: string }[] = [
  // 你的持仓
  { code: '002185', name: '华天科技' },
  { code: '516640', name: '芯片ETF富国' },
  // 芯片半导体
  { code: '600519', name: '贵州茅台' },
  { code: '601318', name: '中国平安' },
  { code: '000001', name: '平安银行' },
  { code: '002475', name: '立讯精密' },
  { code: '300750', name: '宁德时代' },
  { code: '603986', name: '兆易创新' },
  { code: '688256', name: '寒武纪' },
  { code: '002371', name: '北方华创' },
  { code: '688008', name: '澜起科技' },
  { code: '688012', name: '中微公司' },
  { code: '688041', name: '海光信息' },
  { code: '688981', name: '中芯国际' },
  { code: '688525', name: '佰维存储' },
  { code: '301308', name: '江波龙' },
  { code: '688072', name: '拓荆科技' },
  { code: '002156', name: '通富微电' },
  { code: '600584', name: '长电科技' },
  { code: '000021', name: '深科技' },
  { code: '001309', name: '德明利' },
  { code: '603501', name: '韦尔股份' },
  { code: '603160', name: '汇顶科技' },
  { code: '300142', name: '沃森生物' },
  { code: '300059', name: '东方财富' },
  { code: '002594', name: '比亚迪' },
  { code: '300274', name: '阳光电源' },
  { code: '002129', name: 'TCL中环' },
  { code: '601012', name: '隆基绿能' },
  { code: '600036', name: '招商银行' },
  { code: '601398', name: '工商银行' },
  { code: '601166', name: '兴业银行' },
  { code: '000651', name: '格力电器' },
  { code: '000333', name: '美的集团' },
  { code: '600887', name: '伊利股份' },
  { code: '000858', name: '五粮液' },
  { code: '600276', name: '恒瑞医药' },
  { code: '603259', name: '药明康德' },
  { code: '300760', name: '迈瑞医疗' },
  { code: '002230', name: '科大讯飞' },
  { code: '002241', name: '歌尔股份' },
  { code: '002415', name: '海康威视' },
  { code: '300124', name: '汇川技术' },
  // ETF
  { code: '159995', name: '芯片ETF' },
  { code: '512760', name: '半导体ETF' },
  { code: '512480', name: '半导体ETF' },
  { code: '515050', name: '5GETF' },
  { code: '515790', name: '光伏ETF' },
  { code: '516160', name: '新能源车ETF' },
  { code: '510300', name: '沪深300ETF' },
  { code: '510500', name: '中证500ETF' },
  { code: '159915', name: '创业板ETF' },
  { code: '588000', name: '科创50ETF' },
]

// 搜索股票（本地内置列表 + 模糊匹配）
export async function searchStock(keyword: string): Promise<{ code: string; name: string }[]> {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return []

  // 先从内置列表搜索
  const local = STOCK_LIST.filter(s =>
    s.code.includes(kw) ||
    s.name.toLowerCase().includes(kw) ||
    s.code.startsWith(kw)
  )

  // 如果是纯数字且6位，直接作为代码返回
  if (/^\d{6}$/.test(kw)) {
    const exists = local.find(s => s.code === kw)
    if (!exists) {
      return [{ code: kw, name: kw }]
    }
  }

  return local.length > 0 ? local : ( /^\d{6}$/.test(kw) ? [{ code: kw, name: kw }] : [] )
}

// 获取 K 线数据（腾讯接口，支持 CORS）
export async function fetchKLineData(code: string, days: number = 30): Promise<{
  dates: string[]
  opens: number[]
  closes: number[]
  highs: number[]
  lows: number[]
  volumes: number[]
}> {
  try {
    const tcCode = toTencentCode(code)
    // 腾讯日K接口
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${tcCode},day,,,${days},qfq`
    const response = await fetch(url)
    if (!response.ok) throw new Error('获取K线失败')

    const data = await response.json()
    const klines = data.data?.[tcCode]?.day || data.data?.[tcCode]?.qfqday || []

    const dates: string[] = []
    const opens: number[] = []
    const closes: number[] = []
    const highs: number[] = []
    const lows: number[] = []
    const volumes: number[] = []

    klines.forEach((line: any[]) => {
      dates.push(line[0] as string)
      opens.push(parseFloat(line[1] as string))
      closes.push(parseFloat(line[2] as string))
      highs.push(parseFloat(line[3] as string))
      lows.push(parseFloat(line[4] as string))
      volumes.push(parseFloat(line[5] as string))
    })

    return { dates, opens, closes, highs, lows, volumes }
  } catch (error) {
    console.error('获取K线数据失败:', error)
    return { dates: [], opens: [], closes: [], highs: [], lows: [], volumes: [] }
  }
}

export type { StockData }
