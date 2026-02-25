import { useEffect, useState } from 'react'
import { subscribeBudgets } from '@/services/firestore/budgets'
import { subscribeCategories } from '@/services/firestore/categories'
import { subscribeLoans } from '@/services/firestore/loans'
import { subscribeTransactions } from '@/services/firestore/transactions'
import { Budget, Category, FinanceTransaction, Loan } from '@/types/finance'

interface UseFinanceCollectionsResult {
  budgets: Budget[]
  categories: Category[]
  error: string | null
  loading: boolean
  loans: Loan[]
  transactions: FinanceTransaction[]
}

export const useFinanceCollections = (uid: string | undefined): UseFinanceCollectionsResult => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) {
      setTransactions([])
      setCategories([])
      setBudgets([])
      setLoans([])
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

    const markReady = () => {
      if (transactionsReady && categoriesReady && budgetsReady && loansReady) {
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

    return () => {
      unsubscribeTransactions()
      unsubscribeCategories()
      unsubscribeBudgets()
      unsubscribeLoans()
    }
  }, [uid])

  return {
    budgets,
    categories,
    error,
    loading,
    loans,
    transactions,
  }
}
