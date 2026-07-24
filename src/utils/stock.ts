// 股票行情数据获取工具
// 使用新浪财经公开接口

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

// 新浪接口返回格式：var hq_str_sh600519="贵州茅台,开盘价,昨日收盘,当前价格,最高,最低,..."
function parseSinaData(text: string, code: string): StockData | null {
  try {
    const match = text.match(/"(.+)"/)
    if (!match) return null
    const parts = match[1].split(',')
    if (parts.length < 10) return null

    const name = parts[0]
    const open = parseFloat(parts[1])
    const yesterdayClose = parseFloat(parts[2])
    const current = parseFloat(parts[3])
    const high = parseFloat(parts[4])
    const low = parseFloat(parts[5])
    const volume = parseFloat(parts[8])
    const amount = parseFloat(parts[9])
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

// 转换股票代码为新浪格式
// 沪市: sh + 6位代码, 深市: sz + 6位代码
export function toSinaCode(code: string): string {
  const c = code.trim()
  if (c.startsWith('6') || c.startsWith('5') || c.startsWith('11') || c.startsWith('13')) {
    return 'sh' + c
  } else {
    return 'sz' + c
  }
}

// 获取单只股票实时行情
export async function fetchStockData(code: string): Promise<StockData | null> {
  try {
    const sinaCode = toSinaCode(code)
    const url = `https://hq.sinajs.cn/list=${sinaCode}`
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn'
      }
    })

    if (!response.ok) return null
    const text = await response.text()
    return parseSinaData(text, code)
  } catch (error) {
    console.error('获取股票数据失败:', error)
    return null
  }
}

// 批量获取多只股票行情
export async function fetchMultipleStocks(codes: string[]): Promise<StockData[]> {
  try {
    const sinaCodes = codes.map(toSinaCode)
    const url = `https://hq.sinajs.cn/list=${sinaCodes.join(',')}`
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn'
      }
    })

    if (!response.ok) return []
    const text = await response.text()
    const lines = text.split('\n').filter(l => l.trim())

    const results: StockData[] = []
    for (let i = 0; i < lines.length; i++) {
      const data = parseSinaData(lines[i], codes[i])
      if (data) results.push(data)
    }
    return results
  } catch (error) {
    console.error('批量获取股票数据失败:', error)
    return []
  }
}

// 搜索股票（通过东方财富接口）
export async function searchStock(keyword: string): Promise<{ code: string; name: string }[]> {
  try {
    const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(keyword)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&count=10`
    const response = await fetch(url)
    if (!response.ok) return []
    const data = await response.json()
    if (!data.QuotationCodeTable) return []

    return data.QuotationCodeTable
      .filter((item: any) => item.MktNum === '0' || item.MktNum === '1') // 只取沪深
      .map((item: any) => ({
        code: item.Code,
        name: item.Name
      }))
  } catch {
    return []
  }
}

// 获取 K 线数据（通过东方财富接口）
export async function fetchKLineData(code: string, days: number = 30): Promise<{
  dates: string[]
  opens: number[]
  closes: number[]
  highs: number[]
  lows: number[]
  volumes: number[]
}> {
  try {
    // 判断市场
    const market = code.startsWith('6') ? 1 : 0
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${market}.${code}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57&klt=101&fqt=1&end=20500101&lmt=${days}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('获取K线失败')

    const data = await response.json()
    const klines = data.data?.klines || []

    const dates: string[] = []
    const opens: number[] = []
    const closes: number[] = []
    const highs: number[] = []
    const lows: number[] = []
    const volumes: number[] = []

    klines.forEach((line: string) => {
      const parts = line.split(',')
      dates.push(parts[0])
      opens.push(parseFloat(parts[1]))
      closes.push(parseFloat(parts[2]))
      highs.push(parseFloat(parts[3]))
      lows.push(parseFloat(parts[4]))
      volumes.push(parseFloat(parts[5]))
    })

    return { dates, opens, closes, highs, lows, volumes }
  } catch (error) {
    console.error('获取K线数据失败:', error)
    return { dates: [], opens: [], closes: [], highs: [], lows: [], volumes: [] }
  }
}

export type { StockData }
