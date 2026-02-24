import { FormEvent, useMemo, useState } from 'react'
import { ChatMessage } from '@/types/finance'
import { formatDate } from '@/utils/format'

interface ChatWindowProps {
  loading?: boolean
  messages: ChatMessage[]
  quickPrompts?: string[]
  onSendMessage: (prompt: string) => Promise<void>
}

export const ChatWindow = ({
  loading,
  messages,
  quickPrompts = [],
  onSendMessage,
}: ChatWindowProps) => {
  const [value, setValue] = useState('')

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [messages],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const prompt = value.trim()
    if (!prompt) {
      return
    }

    await onSendMessage(prompt)
    setValue('')
  }

  return (
    <section className="card chat-card" aria-label="Finance assistant chat">
      <header>
        <h3>FinSage Assistant</h3>
        <p className="section-subtitle">
          Ask about budgets, spending trends, and suggestions to save more next month.
        </p>
      </header>

      {quickPrompts.length > 0 ? (
        <div className="chip-row" aria-label="Suggested prompts">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              className="chip-button"
              disabled={loading}
              type="button"
              onClick={() => {
                void onSendMessage(prompt)
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <div aria-live="polite" className="chat-messages">
        {sortedMessages.length === 0 ? (
          <p className="empty-state">
            Ask your first question. Example: "How much did I spend on groceries last month?"
          </p>
        ) : null}
        {sortedMessages.map((message) => (
          <article
            key={message.id}
            className={message.role === 'user' ? 'chat-bubble chat-bubble--user' : 'chat-bubble'}
          >
            <p>{message.content}</p>
            <small>{formatDate(message.timestamp)}</small>
          </article>
        ))}
        {loading ? <p className="info-text">Assistant is analyzing your data...</p> : null}
      </div>

      <form className="chat-input-row" onSubmit={(event) => void handleSubmit(event)}>
        <label className="sr-only" htmlFor="chat-input">
          Ask FinSage assistant
        </label>
        <input
          id="chat-input"
          placeholder="How much did I spend on groceries last month?"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button className="primary-button" disabled={loading || !value.trim()} type="submit">
          Send
        </button>
      </form>
    </section>
  )
}
