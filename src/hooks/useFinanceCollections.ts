import { useEffect, useState } from 'react'
import { subscribeBudgets } from '@/services/firestore/budgets'
import { subscribeCategories } from '@/services/firestore/categories'
import { subscribeTransactions } from '@/services/firestore/transactions'
import { Budget, Category, FinanceTransaction } from '@/types/finance'

interface UseFinanceCollectionsResult {
  budgets: Budget[]
  categories: Category[]
  loading: boolean
  transactions: FinanceTransaction[]
}

export const useFinanceCollections = (uid: string | undefined): UseFinanceCollectionsResult => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setTransactions([])
      setCategories([])
      setBudgets([])
      setLoading(false)
      return
    }

    setLoading(true)

    let transactionsReady = false
    let categoriesReady = false
    let budgetsReady = false

    const markReady = () => {
      if (transactionsReady && categoriesReady && budgetsReady) {
        setLoading(false)
      }
    }

    const unsubscribeTransactions = subscribeTransactions(uid, (nextTransactions) => {
      setTransactions(nextTransactions)
      transactionsReady = true
      markReady()
    })

    const unsubscribeCategories = subscribeCategories(uid, (nextCategories) => {
      setCategories(nextCategories)
      categoriesReady = true
      markReady()
    })

    const unsubscribeBudgets = subscribeBudgets(uid, (nextBudgets) => {
      setBudgets(nextBudgets)
      budgetsReady = true
      markReady()
    })

    return () => {
      unsubscribeTransactions()
      unsubscribeCategories()
      unsubscribeBudgets()
    }
  }, [uid])

  return {
    budgets,
    categories,
    loading,
    transactions,
  }
}
