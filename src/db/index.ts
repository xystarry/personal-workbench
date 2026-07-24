import Dexie, { Table } from 'dexie'

// ====== 类型定义 ======

export interface Task {
  id?: number
  title: string
  description?: string
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  tags: string[]
  projectId?: number
  createdAt: string
  updatedAt: string
  order: number
}

export interface Note {
  id?: number
  title: string
  content: string
  tags: string[]
  folderId?: number
  type: 'note' | 'diary'
  mood?: 'happy' | 'calm' | 'neutral' | 'sad' | 'angry'
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy'
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id?: number
  name: string
  parentId?: number
  icon?: string
  order: number
}

export interface Project {
  id?: number
  name: string
  description?: string
  color: string
  status: 'planning' | 'active' | 'paused' | 'completed'
  progress: number
  startDate?: string
  endDate?: string
  milestones?: Milestone[]
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  title: string
  done: boolean
  dueDate?: string
}

export interface Habit {
  id?: number
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly'
  target: number
  records: string[] // ISO date strings 'YYYY-MM-DD'
  createdAt: string
}

export interface Goal {
  id?: number
  title: string
  description?: string
  type: 'weekly' | 'monthly' | 'yearly'
  target: number
  current: number
  unit: string
  startDate: string
  endDate: string
  createdAt: string
}

export interface StockReview {
  id?: number
  stockCode: string
  stockName: string
  reviewDate: string
  content: string
  action: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface WatchlistItem {
  id?: number
  stockCode: string
  stockName: string
  order: number
  addedAt: string
}

export interface Bookmark {
  id?: number
  title: string
  url: string
  category: string
  icon?: string
  order: number
  createdAt: string
}

export interface Setting {
  key: string
  value: any
}

// ====== Dexie 数据库 ======

export class WorkbenchDB extends Dexie {
  tasks!: Table<Task, number>
  notes!: Table<Note, number>
  folders!: Table<Folder, number>
  projects!: Table<Project, number>
  habits!: Table<Habit, number>
  goals!: Table<Goal, number>
  stockReviews!: Table<StockReview, number>
  watchlist!: Table<WatchlistItem, number>
  bookmarks!: Table<Bookmark, number>
  settings!: Table<Setting, string>

  constructor() {
    super('PersonalWorkbenchDB')
    this.version(1).stores({
      tasks: '++id, status, priority, dueDate, projectId, order, createdAt',
      notes: '++id, type, folderId, createdAt, updatedAt, *tags',
      folders: '++id, parentId, order',
      projects: '++id, status, createdAt',
      habits: '++id, createdAt',
      goals: '++id, type, startDate, endDate',
      stockReviews: '++id, stockCode, reviewDate, createdAt, *tags',
      watchlist: '++id, stockCode, order',
      bookmarks: '++id, category, order, createdAt',
      settings: 'key'
    })
  }
}

export const db = new WorkbenchDB()

// ====== 通用 CRUD 辅助 ======

export async function addItem<T extends { id?: number }>(
  table: Table<T, number>,
  item: T
): Promise<number> {
  return (await table.add(item)) as number
}

export async function updateItem<T extends { id?: number }>(
  table: Table<T, number>,
  id: number,
  changes: Partial<T>
): Promise<number> {
  return table.update(id, changes as any)
}

export async function deleteItem<T>(
  table: Table<T, number>,
  id: number
): Promise<void> {
  await table.delete(id)
}

// ====== 初始化默认数据 ======

export async function initDefaultData() {
  const count = await db.bookmarks.count()
  if (count > 0) return

  const now = new Date().toISOString()

  // 默认书签
  await db.bookmarks.bulkAdd([
    { title: '东方财富网', url: 'https://www.eastmoney.com', category: '股票', order: 0, createdAt: now },
    { title: '同花顺', url: 'https://www.10jqka.com.cn', category: '股票', order: 1, createdAt: now },
    { title: '雪球', url: 'https://xueqiu.com', category: '股票', order: 2, createdAt: now },
    { title: 'Google', url: 'https://www.google.com', category: '常用', order: 3, createdAt: now },
    { title: 'GitHub', url: 'https://github.com', category: '常用', order: 4, createdAt: now },
    { title: '豆瓣', url: 'https://www.douban.com', category: '生活', order: 5, createdAt: now },
  ])

  // 默认习惯
  await db.habits.bulkAdd([
    { name: '喝水', icon: '💧', color: '#60A5FA', frequency: 'daily', target: 8, records: [], createdAt: now },
    { name: '运动', icon: '🏃', color: '#34D399', frequency: 'daily', target: 1, records: [], createdAt: now },
    { name: '阅读', icon: '📖', color: '#FBBF24', frequency: 'daily', target: 1, records: [], createdAt: now },
    { name: '复盘', icon: '📊', color: '#F5A88B', frequency: 'daily', target: 1, records: [], createdAt: now },
  ])

  // 默认设置
  await db.settings.bulkAdd([
    { key: 'userName', value: '我' },
    { key: 'theme', value: 'warm' },
    { key: 'firstDayOfWeek', value: 1 },
  ])
}
