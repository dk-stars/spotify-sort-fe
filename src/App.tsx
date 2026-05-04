import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './pages/LoginPage/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const SourceSelectPage = lazy(() => import('./pages/SourceSelectPage/SourceSelectPage'))
const ScanProgressPage = lazy(() => import('./pages/ScanProgressPage/ScanProgressPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage'))
const ScanHistoryPage = lazy(() => import('./pages/ScanHistoryPage/ScanHistoryPage'))
const ScanResultPage = lazy(() => import('./pages/ScanResultPage/ScanResultPage'))
const UpdatesPage = lazy(() => import('./pages/UpdatesPage/UpdatesPage'))

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Suspense fallback={<div /> }>
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
          path="/scan-progress/:jobId"
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
        <Route
          path="/dashboard/:jobId"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout>
                <ScanHistoryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:jobId"
          element={
            <ProtectedRoute>
              <Layout>
                <ScanResultPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/updates"
          element={
            <ProtectedRoute>
              <Layout>
                <UpdatesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
