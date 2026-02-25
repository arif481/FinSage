import { useEffect, useMemo, useState } from 'react'
import { ChatWindow } from '@/features/chatbot/ChatWindow'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { askFinanceAssistant } from '@/services/ai/assistant'
import { addChatMessage, subscribeChatHistory } from '@/services/firestore/chatHistory'
import { ChatMessage } from '@/types/finance'
import { totalExpenses, totalIncome } from '@/utils/finance'
import { formatCurrency, toMonthKey } from '@/utils/format'

export const ChatbotScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { budgets, error, transactions } = useFinanceCollections(user?.uid)
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
    return JSON.stringify({
      budgetCount: currentMonthBudgets.length,
      month: currentMonth,
      monthExpenses: totalExpenses(currentMonthTransactions),
      monthIncome: totalIncome(currentMonthTransactions),
      transactionCount: currentMonthTransactions.length,
    })
  }, [currentMonth, currentMonthBudgets.length, currentMonthTransactions])

  const quickPrompts = [
    'How much did I spend this month compared with my budget?',
    'Which category should I cut first to save 10% next month?',
    'Give me a 3-step plan to reduce discretionary spending this week.',
  ]

  const handleSendMessage = async (prompt: string) => {
    if (!user) {
      return
    }

    setSending(true)

    try {
      await addChatMessage(user.uid, { content: prompt, role: 'user' })

      const answer = await askFinanceAssistant(
        messages
          .slice(-8)
          .map((message) => ({
            role: message.role,
            content: message.content,
          }))
          .concat([{ role: 'user', content: prompt }]),
        contextText,
      )

      await addChatMessage(user.uid, { content: answer, role: 'assistant' })
    } finally {
      setSending(false)
    }
  }

  const insightData = [
    { label: 'Messages', value: String(messages.length) },
    { label: 'Month transactions', value: String(currentMonthTransactions.length) },
    { label: 'Month expense', value: formatCurrency(totalExpenses(currentMonthTransactions), currency) },
    { label: 'Active budgets', value: String(currentMonthBudgets.length) },
  ]

  return (
    <main className="screen stack">
      {error ? (
        <p className="error-text">
          Data access error: {error}. Confirm Firestore rules are deployed for your project and you
          are signed in.
        </p>
      ) : null}
      {chatError ? <p className="error-text">Chat history error: {chatError}</p> : null}
      <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }}>
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="M18 15l.75 2.25L21 18l-2.25.75L18 21l-.75-2.25L15 18l2.25-.75L18 15Z" />
          </svg>
          <div>
            <h2>AI assistant</h2>
            <p className="section-subtitle">
              Natural-language insights for your spending and budget plan.
            </p>
          </div>
        </div>
      </header>

      <section className="insight-strip">
        {insightData.map((item, i) => (
          <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <ChatWindow
        loading={sending}
        messages={messages}
        quickPrompts={quickPrompts}
        onSendMessage={handleSendMessage}
      />
      <p className="info-text" style={{ animation: 'fade-up 400ms ease both 500ms' }}>Powered by Gemini through Firebase AI Logic / Cloud Functions.</p>
    </main>
  )
}
