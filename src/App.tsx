import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import SourceSelectPage from './pages/SourceSelectPage/SourceSelectPage'
import ScanProgressPage from './pages/ScanProgressPage/ScanProgressPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <SourceSelectPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan-progress"
          element={
            <ProtectedRoute>
              <Layout>
                <ScanProgressPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
