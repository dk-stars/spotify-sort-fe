import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LoginPage from './pages/LoginPage/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const SourceSelectPage = lazy(() => import('./pages/SourceSelectPage/SourceSelectPage'))
const ScanProgressPage = lazy(() => import('./pages/ScanProgressPage/ScanProgressPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
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
      </Suspense>
    </BrowserRouter>
  );
}
