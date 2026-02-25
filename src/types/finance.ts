export type TransactionType = 'income' | 'expense'

export type ChatRole = 'user' | 'assistant'

export interface FinanceTransaction {
  id: string
  amount: number
  categoryId: string
  date: string
  description: string
  tags: string[]
  type: TransactionType
  createdAt?: string
  updatedAt?: string
}

export interface Budget {
  id: string
  categoryId: string
  month: string
  limit: number
  spent?: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  createdAt?: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
}

export interface UserPreferences {
  currency: string
  themeMode: 'light' | 'dark'
  highContrast: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  collaborators: string[]
  createdAt?: string
  preferences: UserPreferences
}

export interface SpendingByCategory {
  categoryId: string
  amount: number
}

export interface BudgetProgress {
  categoryId: string
  limit: number
  spent: number
  remaining: number
  percent: number
}

export type LoanDirection = 'borrowed' | 'lent'
export type LoanStatus = 'active' | 'settled'

export interface Loan {
  id: string
  person: string
  amount: number
  direction: LoanDirection
  status: LoanStatus
  description: string
  dueDate?: string
  settledDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface RecurringRule {
  id: string
  description: string
  amount: number
  type: TransactionType
  categoryId: string
  frequency: 'daily' | 'weekly' | 'monthly'
  nextRun: string
  active: boolean
  createdAt?: string
}

