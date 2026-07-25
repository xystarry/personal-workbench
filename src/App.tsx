import { Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import KnowledgePage from './pages/KnowledgePage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import NotesEditPage from './pages/NotesEditPage'
import DiaryPage from './pages/DiaryPage'
import HabitsPage from './pages/HabitsPage'
import GoalsPage from './pages/GoalsPage'
import StockPage from './pages/StockPage'
import StockReviewEditPage from './pages/StockReviewEditPage'
import ToolsPage from './pages/ToolsPage'
import BookmarksPage from './pages/BookmarksPage'
import CalculatorPage from './pages/CalculatorPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <div className="min-h-screen pb-16 gradient-warm">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/knowledge/notes/:id" element={<NotesEditPage />} />
        <Route path="/knowledge/diary" element={<DiaryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/stock/review/:id" element={<StockReviewEditPage />} />
        <Route path="/stock/review/new" element={<StockReviewEditPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/bookmarks" element={<BookmarksPage />} />
        <Route path="/tools/calculator" element={<CalculatorPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <InstallPrompt />
    </div>
  )
}
