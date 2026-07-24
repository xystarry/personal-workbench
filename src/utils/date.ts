// 日期工具函数

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

export function todayStr(): string {
  return formatDate(new Date(), 'YYYY-MM-DD')
}

export function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(d)
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return due < today
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  const start = new Date(d)
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function getDaysArray(start: Date, end: Date): string[] {
  const arr: string[] = []
  const d = new Date(start)
  while (d <= end) {
    arr.push(formatDate(d))
    d.setDate(d.getDate() + 1)
  }
  return arr
}

// 获取最近 N 天的日期数组
export function getRecentDays(n: number): string[] {
  const arr: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    arr.push(formatDate(d))
  }
  return arr
}

// 获取最近 N 周的日期数组（每周一作为代表）
export function getRecentWeeks(n: number): string[] {
  const arr: string[] = []
  const { start } = getWeekRange()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(start)
    d.setDate(d.getDate() - i * 7)
    arr.push(formatDate(d))
  }
  return arr
}
