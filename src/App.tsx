import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useAuth } from '@/hooks/useAuth'

const AuthScreen = lazy(async () => import('@/screens/AuthScreen').then((module) => ({ default: module.AuthScreen })))
const DashboardScreen = lazy(async () =>
  import('@/screens/DashboardScreen').then((module) => ({ default: module.DashboardScreen })),
)
const TransactionsScreen = lazy(async () =>
  import('@/screens/TransactionsScreen').then((module) => ({ default: module.TransactionsScreen })),
)
const BudgetsScreen = lazy(async () =>
  import('@/screens/BudgetsScreen').then((module) => ({ default: module.BudgetsScreen })),
)
const ChatbotScreen = lazy(async () =>
  import('@/screens/ChatbotScreen').then((module) => ({ default: module.ChatbotScreen })),
)
const ReportsScreen = lazy(async () =>
  import('@/screens/ReportsScreen').then((module) => ({ default: module.ReportsScreen })),
)
const SettingsScreen = lazy(async () =>
  import('@/screens/SettingsScreen').then((module) => ({ default: module.SettingsScreen })),
)

const ProtectedLayout = () => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate replace to="/auth" />
  }

  return <AppShell />
}

const AuthGate = () => {
  const { user } = useAuth()

  if (user) {
    return <Navigate replace to="/" />
  }

  return (
    <Suspense fallback={<LoadingScreen label="Loading authentication..." />}>
      <AuthScreen />
    </Suspense>
  )
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Checking your secure session..." />
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthGate />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route
          index
          element={
            <Suspense fallback={<LoadingScreen label="Loading dashboard..." />}>
              <DashboardScreen />
            </Suspense>
          }
        />
        <Route
          path="transactions"
          element={
            <Suspense fallback={<LoadingScreen label="Loading transactions..." />}>
              <TransactionsScreen />
            </Suspense>
          }
        />
        <Route
          path="budgets"
          element={
            <Suspense fallback={<LoadingScreen label="Loading budgets..." />}>
              <BudgetsScreen />
            </Suspense>
          }
        />
        <Route
          path="chat"
          element={
            <Suspense fallback={<LoadingScreen label="Loading assistant..." />}>
              <ChatbotScreen />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <Suspense fallback={<LoadingScreen label="Loading reports..." />}>
              <ReportsScreen />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<LoadingScreen label="Loading settings..." />}>
              <SettingsScreen />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default App
