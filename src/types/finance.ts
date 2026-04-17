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
  linkedLoanId?: string
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
  onboardingComplete: boolean
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
  repaidAmount: number
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

export type GoalStatus = 'active' | 'completed' | 'paused'

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  status: GoalStatus
  targetDate?: string
  icon?: string
  color?: string
  createdAt?: string
  updatedAt?: string
}

export type SplitStatus = 'pending' | 'settled'

export interface SplitExpense {
  id: string
  description: string
  totalAmount: number
  myShare: number
  splitWith: string
  status: SplitStatus
  linkedTransactionId?: string
  settledDate?: string
  createdAt?: string
  updatedAt?: string
}

// ─── Space Types ───────────────────────────────────────────

export type SpaceRole = 'owner' | 'admin' | 'member'
export type SpaceInviteStatus = 'pending' | 'accepted' | 'declined'

export interface SpaceMember {
  uid: string
  displayName: string
  email: string
  role: SpaceRole
  joinedAt: string
}

export interface Space {
  id: string
  name: string
  description: string
  icon: string
  color: string
  createdBy: string
  members: SpaceMember[]
  memberUids: string[]
  inviteCode: string
  createdAt?: string
  updatedAt?: string
}

export type SpaceTransactionType = 'expense' | 'income' | 'credit_purchase' | 'emi_payment'

export interface SpaceTransaction {
  id: string
  amount: number
  description: string
  categoryId: string
  type: SpaceTransactionType
  paidBy: string
  paidByName: string
  splitAmong: string[]
  date: string
  tags: string[]
  linkedLoanId?: string
  attachmentNote?: string
  createdBy: string
  createdAt?: string
  updatedAt?: string
}

export type SpaceLoanStatus = 'active' | 'settled' | 'overdue'

export interface SpaceLoan {
  id: string
  fromUid: string
  fromName: string
  toUid: string
  toName: string
  amount: number
  repaidAmount: number
  description: string
  status: SpaceLoanStatus
  isEmi: boolean
  emiAmount?: number
  emiDay?: number
  totalInstallments?: number
  paidInstallments?: number
  dueDate?: string
  settledDate?: string
  creditCardLabel?: string
  tags: string[]
  createdBy: string
  createdAt?: string
  updatedAt?: string
}

export interface SpaceReminder {
  id: string
  title: string
  description: string
  dueDate: string
  recurringFrequency?: 'once' | 'daily' | 'weekly' | 'monthly'
  linkedLoanId?: string
  linkedTransactionId?: string
  assignedTo: string[]
  isDismissed: boolean
  createdBy: string
  createdAt?: string
}

export interface SpaceCategory {
  id: string
  name: string
  icon: string
  color: string
  createdBy: string
  createdAt?: string
}

export interface SpaceActivity {
  id: string
  uid: string
  userName: string
  action: string
  targetType: 'transaction' | 'loan' | 'reminder' | 'member' | 'category' | 'space'
  targetId?: string
  amount?: number
  createdAt?: string
}

