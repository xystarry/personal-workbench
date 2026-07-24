import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import Header from '../components/Header'
import ReactECharts from 'echarts-for-react'
import { getWeekRange, formatDate, getDaysArray } from '../utils/date'

export default function DashboardPage() {
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], [])
  const habits = useLiveQuery(() => db.habits.toArray(), [], [])
  const projects = useLiveQuery(() => db.projects.toArray(), [], [])
  const notes = useLiveQuery(() => db.notes.toArray(), [], [])
  const goals = useLiveQuery(() => db.goals.toArray(), [], [])

  // 任务统计
  const taskDone = tasks.filter(t => t.status === 'done').length
  const taskDoing = tasks.filter(t => t.status === 'doing').length
  const taskTodo = tasks.filter(t => t.status === 'todo').length
  const taskTotal = tasks.length

  // 本周任务完成趋势
  const weekRange = getWeekRange()
  const weekDays = getDaysArray(weekRange.start, weekRange.end)
  const weekTaskData = weekDays.map(day => {
    return tasks.filter(t => t.status === 'done' && t.updatedAt.startsWith(day)).length
  })

  // 习惯完成率
  const habitStats = habits.map(h => {
    const weekRecords = h.records.filter(r => weekDays.includes(r))
    return {
      name: h.name,
      icon: h.icon,
      color: h.color,
      done: weekRecords.length,
      target: 7
    }
  })

  // 项目进度
  const activeProjects = projects.filter(p => p.status === 'active')

  // 笔记统计
  const noteCount = notes.filter(n => n.type === 'note').length
  const diaryCount = notes.filter(n => n.type === 'diary').length

  const taskPieOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: taskDone, name: '已完成', itemStyle: { color: '#9BB591' } },
        { value: taskDoing, name: '进行中', itemStyle: { color: '#F5A88B' } },
        { value: taskTodo, name: '待办', itemStyle: { color: '#FFE0D0' } },
      ]
    }]
  }

  const weekTaskBarOption = {
    grid: { left: 30, right: 10, top: 20, bottom: 25 },
    xAxis: {
      type: 'category',
      data: weekDays.map(d => formatDate(d, 'DD')),
      axisLine: { lineStyle: { color: '#E5D5C8' } },
      axisLabel: { color: '#A09080', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F5EDE5' } },
      axisLabel: { color: '#A09080', fontSize: 10 }
    },
    series: [{
      data: weekTaskData,
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        color: '#F5A88B',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }

  return (
    <div className="page-enter min-h-screen">
      <Header title="数据看板" subtitle="本周数据概览" gradient />

      <div className="px-4 py-3 space-y-4">
        {/* 指标卡片 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-xs text-gray-400">任务完成率</p>
            <p className="text-2xl font-bold text-warm-600 mt-1">
              {taskTotal > 0 ? Math.round(taskDone / taskTotal * 100) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">{taskDone}/{taskTotal}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400">活跃项目</p>
            <p className="text-2xl font-bold text-sage-400 mt-1">{activeProjects.length}</p>
            <p className="text-xs text-gray-400 mt-1">个进行中</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400">笔记总数</p>
            <p className="text-2xl font-bold text-lavender-300 mt-1">{noteCount}</p>
            <p className="text-xs text-gray-400 mt-1">日记 {diaryCount} 篇</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400">习惯坚持</p>
            <p className="text-2xl font-bold text-warm-500 mt-1">{habits.length}</p>
            <p className="text-xs text-gray-400 mt-1">个习惯</p>
          </div>
        </div>

        {/* 任务分布饼图 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-warm-600 mb-2">📊 任务分布</h3>
          {taskTotal > 0 ? (
            <ReactECharts option={taskPieOption} style={{ height: 180 }} />
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">暂无任务数据</p>
          )}
        </div>

        {/* 本周任务完成趋势 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-warm-600 mb-2">📅 本周任务完成</h3>
          <ReactECharts option={weekTaskBarOption} style={{ height: 160 }} />
        </div>

        {/* 习惯完成情况 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-warm-600 mb-3">✅ 本周习惯</h3>
          {habitStats.length > 0 ? (
            <div className="space-y-3">
              {habitStats.map(h => (
                <div key={h.name}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{h.icon}</span>
                    <span className="text-sm text-warm-700">{h.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{h.done}/{h.target}</span>
                  </div>
                  <div className="h-2 bg-warm-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(h.done / h.target * 100, 100)}%`, background: h.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-4">还没有添加习惯</p>
          )}
        </div>

        {/* 项目进度 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-warm-600 mb-3">🎯 项目进度</h3>
          {activeProjects.length > 0 ? (
            <div className="space-y-3">
              {activeProjects.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-warm-700">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.progress}%</span>
                  </div>
                  <div className="h-2 bg-warm-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.progress}%`, background: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-4">没有活跃项目</p>
          )}
        </div>
      </div>
    </div>
  )
}
