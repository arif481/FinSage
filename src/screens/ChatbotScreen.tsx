import { useEffect, useMemo, useState } from 'react'
import { ChatWindow } from '@/features/chatbot/ChatWindow'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { askFinanceAssistant } from '@/services/ai/assistant'
import { addChatMessage, subscribeChatHistory } from '@/services/firestore/chatHistory'
import { ChatMessage } from '@/types/finance'
import {
  budgetProgress,
  categoryComparison,
  computeHealthScore,
  monthOverMonthComparison,
  totalExpenses,
  totalIncome,
} from '@/utils/finance'
import { toMonthKey } from '@/utils/format'

export const ChatbotScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { budgets, categories, error, loans, transactions } = useFinanceCollections(user?.uid)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const currentMonth = toMonthKey(new Date().toISOString())
  const currentMonthTransactions = transactions.filter(
    (transaction) => toMonthKey(transaction.date) === currentMonth,
  )
  const currentMonthBudgets = budgets.filter((budget) => budget.month === currentMonth)

  useEffect(() => {
    if (!user) {
      return
    }

    return subscribeChatHistory(user.uid, setMessages, (listenerError) => {
      setChatError(listenerError.message)
    })
  }, [user])

  const contextText = useMemo(() => {
    const monthExpenses = totalExpenses(currentMonthTransactions)
    const monthIncome = totalIncome(currentMonthTransactions)
    const progress = budgetProgress(budgets, transactions, currentMonth)
    const overBudget = progress.filter((p) => p.remaining < 0)
    const healthScore = computeHealthScore(transactions, budgets, currentMonth)
    const monthComp = monthOverMonthComparison(transactions, currentMonth)
    const categoryBars = categoryComparison(transactions, categories)
    const activeLoans = loans.filter((l) => l.status === 'active')
    const totalBorrowed = activeLoans.filter((l) => l.direction === 'borrowed').reduce((s, l) => s + l.amount, 0)
    const totalLent = activeLoans.filter((l) => l.direction === 'lent').reduce((s, l) => s + l.amount, 0)

    return JSON.stringify({
      month: currentMonth,
      currency,
      monthExpenses,
      monthIncome,
      savingsRate: monthIncome > 0 ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100) : 0,
      transactionCount: currentMonthTransactions.length,
      budgetCount: currentMonthBudgets.length,
      overBudgetCategories: overBudget.map((p) => ({
        category: categories.find((c) => c.id === p.categoryId)?.name ?? p.categoryId,
        overspent: Math.abs(p.remaining),
        percent: p.percent,
      })),
      healthScore: { total: healthScore.totalScore, grade: healthScore.grade },
      monthComparison: monthComp,
      topCategories: categoryBars.slice(0, 5).map((c) => ({ name: c.name, amount: c.amount, pct: c.percentage })),
      loans: {
        totalBorrowed,
        totalLent,
        netPosition: totalLent - totalBorrowed,
        activeCount: activeLoans.length,
        overdueCount: activeLoans.filter((l) => l.dueDate && new Date(l.dueDate) < new Date()).length,
        people: activeLoans.map((l) => ({ person: l.person, amount: l.amount, direction: l.direction, dueDate: l.dueDate })),
      },
      totalTransactions: transactions.length,
      totalMonthsTracked: new Set(transactions.map((t) => toMonthKey(t.date))).size,
    })
  }, [currentMonth, currentMonthBudgets.length, currentMonthTransactions, transactions, budgets, categories, loans, currency])

  const quickPrompts = [
    'What\'s my financial health score and what should I improve?',
    'Give me a personalized savings plan based on my spending patterns.',
    'Which category should I cut first to save 20% more?',
    'Analyze my spending anomalies and suggest fixes.',
    'How much do I owe people vs how much people owe me?',
    'Give me a weekly spending challenge to stay under budget.',
  ]

  const onSend = async (text: string) => {
    if (!user || sending) {
      return
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setSending(true)
    setChatError(null)

    try {
      await addChatMessage(user.uid, userMessage)

      const history = [...messages, userMessage].map(({ content, role }) => ({
        content,
        role: role as 'user' | 'assistant',
      }))

      const reply = await askFinanceAssistant(history, contextText)

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }

      await addChatMessage(user.uid, assistantMessage)
    } catch (sendError) {
      setChatError(sendError instanceof Error ? sendError.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="screen stack" style={{ height: '100%' }}>
      <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
        <div>
          <h2>FinSage Assistant</h2>
          <p className="section-subtitle">
            AI-powered insights. Knows your spending, budgets, health score, and loans.
          </p>
        </div>
      </header>

      {(error ?? chatError) ? (
        <p className="error-text">{error ?? chatError}</p>
      ) : null}

      <ChatWindow
        messages={messages}
        onSendMessage={onSend}
        quickPrompts={quickPrompts}
        loading={sending}
      />
    </main>
  )
}
