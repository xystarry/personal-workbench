import { NavLink, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Task } from '../db'

const tabs = [
  { path: '/', label: '首页', icon: HomeIcon },
  { path: '/tasks', label: '任务', icon: TaskIcon },
  { path: '/knowledge', label: '知识', icon: BookIcon },
  { path: '/stock', label: '股票', icon: StockIcon },
  { path: '/profile', label: '我的', icon: UserIcon },
]

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={active ? '#E08868' : '#B0A090'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
    </svg>
  )
}
function TaskIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={active ? '#E08868' : '#B0A090'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 10l2 2 4-4" />
      <path d="M8 16h8" />
    </svg>
  )
}
function BookIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={active ? '#E08868' : '#B0A090'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z" />
      <path d="M4 19.5A2.5 2.5 0 016.5 22H20" />
    </svg>
  )
}
function StockIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={active ? '#E08868' : '#B0A090'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 5-6" />
    </svg>
  )
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={active ? '#E08868' : '#B0A090'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

export default function BottomNav() {
  const location = useLocation()
  const pendingTasks = useLiveQuery(async () => {
    return db.tasks.where('status').notEqual('done').count()
  }, [], 0)

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1.5">
        {tabs.map((tab) => {
          const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path)
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center py-1 px-3 relative"
            >
              <div className="relative">
                <Icon active={active} />
                {tab.path === '/tasks' && pendingTasks > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-400 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                    {pendingTasks}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${active ? 'text-warm-600 font-medium' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
