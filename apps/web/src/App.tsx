import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { DashboardShell } from './pages/DashboardShell'
import { ConversationsPage } from './pages/ConversationsPage'
import { ConversationDetailPage } from './pages/ConversationDetailPage'
import { AnalyticsPage } from './pages/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<DashboardShell />}>
              <Route index element={<Navigate to="/conversations" replace />} />
              <Route path="/conversations" element={<ConversationsPage />} />
              <Route path="/conversations/:id" element={<ConversationDetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
