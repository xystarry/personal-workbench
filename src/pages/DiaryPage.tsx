import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import Header from '../components/Header'
import { todayStr, formatDate } from '../utils/date'

const moods = [
  { key: 'happy', emoji: '😊', label: '开心', color: '#FBBF24' },
  { key: 'calm', emoji: '😌', label: '平静', color: '#34D399' },
  { key: 'neutral', emoji: '😐', label: '一般', color: '#9CA3AF' },
  { key: 'sad', emoji: '😢', label: '难过', color: '#60A5FA' },
  { key: 'angry', emoji: '😠', label: '生气', color: '#EF4444' },
]

const weathers = [
  { key: 'sunny', emoji: '☀️', label: '晴' },
  { key: 'cloudy', emoji: '☁️', label: '阴' },
  { key: 'rainy', emoji: '🌧️', label: '雨' },
  { key: 'snowy', emoji: '❄️', label: '雪' },
]

export default function DiaryPage() {
  const navigate = useNavigate()
  const today = todayStr()
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [selectedWeather, setSelectedWeather] = useState<string>('')
  const [content, setContent] = useState('')

  const diaries = useLiveQuery(async () => {
    return db.notes.where('type').equals('diary').reverse().sortBy('reviewDate' as any)
  }, [], [])

  // 检查今天是否已写日记
  const todayDiary = useLiveQuery(async () => {
    const all = await db.notes.where('type').equals('diary').toArray()
    return all.find(d => d.createdAt.startsWith(today))
  }, [today], null)

  useEffect(() => {
    if (todayDiary) {
      setSelectedMood(todayDiary.mood || '')
      setSelectedWeather(todayDiary.weather || '')
      setContent(todayDiary.content || '')
    }
  }, [todayDiary])

  const handleSave = async () => {
    if (!content.trim()) return
    const now = new Date().toISOString()
    if (todayDiary?.id) {
      await db.notes.update(todayDiary.id, {
        content,
        mood: selectedMood as any,
        weather: selectedWeather as any,
        updatedAt: now
      })
    } else {
      await db.notes.add({
        title: `${formatDate(now, 'MM月DD日')} 日记`,
        content,
        tags: ['日记'],
        type: 'diary',
        mood: selectedMood as any,
        weather: selectedWeather as any,
        createdAt: now,
        updatedAt: now
      })
    }
    navigate('/knowledge')
  }

  return (
    <div className="page-enter min-h-screen">
      <Header
        title="今日日记"
        subtitle={formatDate(new Date(), 'YYYY年MM月DD日')}
        showBack
        gradient
      />

      <div className="px-4 py-4 space-y-5">
        {/* 心情 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-warm-600 mb-3">今天心情如何？</h3>
          <div className="flex justify-around">
            {moods.map(mood => (
              <button
                key={mood.key}
                onClick={() => setSelectedMood(mood.key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  selectedMood === mood.key ? 'bg-warm-100 scale-110' : ''
                }`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className={`text-xs ${selectedMood === mood.key ? 'text-warm-700 font-medium' : 'text-gray-400'}`}>
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 天气 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-warm-600 mb-3">今天天气如何？</h3>
          <div className="flex justify-around">
            {weathers.map(w => (
              <button
                key={w.key}
                onClick={() => setSelectedWeather(w.key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  selectedWeather === w.key ? 'bg-warm-100 scale-110' : ''
                }`}
              >
                <span className="text-2xl">{w.emoji}</span>
                <span className={`text-xs ${selectedWeather === w.key ? 'text-warm-700 font-medium' : 'text-gray-400'}`}>
                  {w.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 日记内容 */}
        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="今天发生了什么有趣的事？有什么感悟？"
            className="w-full min-h-[250px] bg-white rounded-xl p-4 text-warm-700 border border-warm-100 resize-none text-sm leading-relaxed"
          />
        </div>

        <button onClick={handleSave} className="btn-primary w-full">
          {todayDiary ? '更新日记' : '保存日记'}
        </button>

        {/* 历史日记 */}
        {diaries && diaries.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-warm-600 mb-2">📖 历史日记</h3>
            <div className="space-y-2">
              {diaries.slice(0, 10).map(d => {
                const mood = moods.find(m => m.key === d.mood)
                return (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/knowledge/notes/${d.id}`)}
                    className="card p-3 flex items-center gap-3"
                  >
                    <span className="text-2xl">{mood?.emoji || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-700 truncate">{d.title}</p>
                      <p className="text-xs text-gray-400 truncate">{d.content.slice(0, 50)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
