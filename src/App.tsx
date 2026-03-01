import { Suspense, lazy, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
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
const LoansScreen = lazy(async () =>
  import('@/screens/LoansScreen').then((module) => ({ default: module.LoansScreen })),
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
const SavingsGoalsScreen = lazy(async () =>
  import('@/screens/SavingsGoalsScreen').then((module) => ({ default: module.SavingsGoalsScreen })),
)
const SplitExpensesScreen = lazy(async () =>
  import('@/screens/SplitExpensesScreen').then((module) => ({ default: module.SplitExpensesScreen })),
)
const RecurringScreen = lazy(async () =>
  import('@/screens/RecurringScreen').then((module) => ({ default: module.RecurringScreen })),
)
const CategoriesScreen = lazy(async () =>
  import('@/screens/CategoriesScreen').then((module) => ({ default: module.CategoriesScreen })),
)
const AboutScreen = lazy(async () =>
  import('@/screens/public/AboutScreen').then((module) => ({ default: module.AboutScreen })),
)
const PrivacyScreen = lazy(async () =>
  import('@/screens/public/PrivacyScreen').then((module) => ({ default: module.PrivacyScreen })),
)
const TermsScreen = lazy(async () =>
  import('@/screens/public/TermsScreen').then((module) => ({ default: module.TermsScreen })),
)
const SupportScreen = lazy(async () =>
  import('@/screens/public/SupportScreen').then((module) => ({ default: module.SupportScreen })),
)
const NotFoundScreen = lazy(async () =>
  import('@/screens/public/NotFoundScreen').then((module) => ({ default: module.NotFoundScreen })),
)

const withLoading = (label: string, element: ReactNode) => {
  return <Suspense fallback={<LoadingScreen label={label} />}>{element}</Suspense>
}

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

  return withLoading('Loading authentication...', <AuthScreen />)
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Checking your secure session..." />
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/auth" element={<AuthGate />} />

        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={withLoading('Loading dashboard...', <DashboardScreen />)} />
          <Route path="transactions" element={withLoading('Loading transactions...', <TransactionsScreen />)} />
          <Route path="budgets" element={withLoading('Loading budgets...', <BudgetsScreen />)} />
          <Route path="loans" element={withLoading('Loading loans...', <LoansScreen />)} />
          <Route path="chat" element={withLoading('Loading assistant...', <ChatbotScreen />)} />
          <Route path="reports" element={withLoading('Loading reports...', <ReportsScreen />)} />
          <Route path="settings" element={withLoading('Loading settings...', <SettingsScreen />)} />
          <Route path="goals" element={withLoading('Loading goals...', <SavingsGoalsScreen />)} />
          <Route path="splits" element={withLoading('Loading splits...', <SplitExpensesScreen />)} />
          <Route path="recurring" element={withLoading('Loading recurring...', <RecurringScreen />)} />
          <Route path="categories" element={withLoading('Loading categories...', <CategoriesScreen />)} />
        </Route>

        <Route path="/" element={<PublicLayout />}>
          <Route path="about" element={withLoading('Loading page...', <AboutScreen />)} />
          <Route path="privacy" element={withLoading('Loading page...', <PrivacyScreen />)} />
          <Route path="terms" element={withLoading('Loading page...', <TermsScreen />)} />
          <Route path="support" element={withLoading('Loading page...', <SupportScreen />)} />
          <Route path="*" element={withLoading('Loading page...', <NotFoundScreen />)} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
