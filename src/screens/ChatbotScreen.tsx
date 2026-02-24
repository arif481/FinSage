import { useEffect, useMemo, useState } from 'react'
import { ChatWindow } from '@/features/chatbot/ChatWindow'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { askFinanceAssistant } from '@/services/ai/assistant'
import { addChatMessage, subscribeChatHistory } from '@/services/firestore/chatHistory'
import { ChatMessage } from '@/types/finance'
import { totalExpenses, totalIncome } from '@/utils/finance'
import { toMonthKey } from '@/utils/format'

export const ChatbotScreen = () => {
  const { user } = useAuth()
  const { budgets, error, transactions } = useFinanceCollections(user?.uid)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const currentMonth = toMonthKey(new Date().toISOString())

  useEffect(() => {
    if (!user) {
      return
    }

    return subscribeChatHistory(
      user.uid,
      setMessages,
      (listenerError) => {
        setChatError(listenerError.message)
      },
    )
  }, [user])

  const contextText = useMemo(() => {
    const monthTransactions = transactions.filter((transaction) => toMonthKey(transaction.date) === currentMonth)
    const monthBudgets = budgets.filter((budget) => budget.month === currentMonth)

    return JSON.stringify({
      budgetCount: monthBudgets.length,
      month: currentMonth,
      monthExpenses: totalExpenses(monthTransactions),
      monthIncome: totalIncome(monthTransactions),
      transactionCount: monthTransactions.length,
    })
  }, [budgets, currentMonth, transactions])

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

  return (
    <main className="screen stack">
      {error ? (
        <p className="error-text">
          Data access error: {error}. Confirm Firestore rules are deployed for your project and you are signed in.
        </p>
      ) : null}
      {chatError ? <p className="error-text">Chat history error: {chatError}</p> : null}
      <header className="screen-header">
        <div>
          <h2>AI assistant</h2>
          <p className="section-subtitle">Natural-language insights for your spending and budget plan.</p>
        </div>
      </header>

      <ChatWindow loading={sending} messages={messages} onSendMessage={handleSendMessage} />
      <p className="info-text">Powered by Gemini through Firebase AI Logic / Cloud Functions.</p>
    </main>
  )
}
