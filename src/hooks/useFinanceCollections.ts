import { useEffect, useState } from 'react'
import { subscribeBudgets } from '@/services/firestore/budgets'
import { subscribeCategories } from '@/services/firestore/categories'
import { subscribeLoans } from '@/services/firestore/loans'
import { subscribeRecurringRules } from '@/services/firestore/recurringRules'
import { subscribeSavingsGoals } from '@/services/firestore/savingsGoals'
import { subscribeSplitExpenses } from '@/services/firestore/splitExpenses'
import { subscribeTransactions } from '@/services/firestore/transactions'
import { Budget, Category, FinanceTransaction, Loan, RecurringRule, SavingsGoal, SplitExpense } from '@/types/finance'

interface UseFinanceCollectionsResult {
  budgets: Budget[]
  categories: Category[]
  error: string | null
  loading: boolean
  loans: Loan[]
  recurringRules: RecurringRule[]
  savingsGoals: SavingsGoal[]
  splitExpenses: SplitExpense[]
  transactions: FinanceTransaction[]
}

export const useFinanceCollections = (uid: string | undefined): UseFinanceCollectionsResult => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [splitExpenses, setSplitExpenses] = useState<SplitExpense[]>([])
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) {
      setTransactions([])
      setCategories([])
      setBudgets([])
      setLoans([])
      setSavingsGoals([])
      setSplitExpenses([])
      setRecurringRules([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    let transactionsReady = false
    let categoriesReady = false
    let budgetsReady = false
    let loansReady = false
    let savingsGoalsReady = false
    let splitExpensesReady = false
    let recurringRulesReady = false

    const markReady = () => {
      if (transactionsReady && categoriesReady && budgetsReady && loansReady && savingsGoalsReady && splitExpensesReady && recurringRulesReady) {
        setLoading(false)
      }
    }

    const onListenerError = (errorMessage: string) => {
      setError(errorMessage)
      setLoading(false)
    }

    const unsubscribeTransactions = subscribeTransactions(
      uid,
      (nextTransactions) => {
        setTransactions(nextTransactions)
        transactionsReady = true
        markReady()
      },
      (listenerError) => {
        onListenerError(listenerError.message)
      },
    )

    const unsubscribeCategories = subscribeCategories(
      uid,
      (nextCategories) => {
        setCategories(nextCategories)
        categoriesReady = true
        markReady()
      },
      (listenerError) => {
        onListenerError(listenerError.message)
      },
    )

    const unsubscribeBudgets = subscribeBudgets(
      uid,
      (nextBudgets) => {
        setBudgets(nextBudgets)
        budgetsReady = true
        markReady()
      },
      (listenerError) => {
        onListenerError(listenerError.message)
      },
    )

    const unsubscribeLoans = subscribeLoans(
      uid,
      (nextLoans) => {
        setLoans(nextLoans)
        loansReady = true
        markReady()
      },
      (listenerError) => {
        onListenerError(listenerError.message)
      },
    )

    const unsubscribeSavingsGoals = subscribeSavingsGoals(
      uid,
      (nextGoals) => {
        setSavingsGoals(nextGoals)
        savingsGoalsReady = true
        markReady()
      },
      (listenerError) => {
        onListenerError(listenerError.message)
      },
    )

    const unsubscribeSplitExpenses = subscribeSplitExpenses(
      uid,
      (nextSplits) => {
        setSplitExpenses(nextSplits)
        splitExpensesReady = true
        markReady()
      },
      (listenerError) => {
        onListenerError(listenerError.message)
      },
    )

    const unsubscribeRecurringRules = subscribeRecurringRules(
      uid,
      (nextRules) => {
        setRecurringRules(nextRules)
        recurringRulesReady = true
        markReady()
      },
      (listenerError) => {
        onListenerError(listenerError.message)
      },
    )

    return () => {
      unsubscribeTransactions()
      unsubscribeCategories()
      unsubscribeBudgets()
      unsubscribeLoans()
      unsubscribeSavingsGoals()
      unsubscribeSplitExpenses()
      unsubscribeRecurringRules()
    }
  }, [uid])

  return {
    budgets,
    categories,
    error,
    loading,
    loans,
    recurringRules,
    savingsGoals,
    splitExpenses,
    transactions,
  }
}

