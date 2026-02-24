import { FormEvent, useMemo, useState, useEffect, useRef } from 'react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [messages],
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages, loading])

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
    <section
      className="card chat-card glass-panel"
      aria-label="Finance assistant chat"
      style={{
        border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
        boxShadow: 'inset 0 0 20px color-mix(in srgb, var(--primary) 10%, transparent)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.7, animation: 'shimmer 2s infinite linear' }} />
      <header>
        <h3 className="glow-text" style={{ fontFamily: 'Space Grotesk, monospace', color: 'var(--primary)' }}>[ TERMINAL: FinSage AI ]</h3>
        <p className="section-subtitle">
          Holographic assistant initialized. Ask about budgets, spending trends, and forecasting.
        </p>
      </header>

      {quickPrompts.length > 0 ? (
        <div className="chip-row" aria-label="Suggested prompts">
          {quickPrompts.map((prompt, index) => (
            <button
              key={prompt}
              className="chip-button"
              disabled={loading}
              type="button"
              style={{ animation: 'stagger-fade-in 0.3s ease forwards', opacity: 0, animationDelay: `${index * 0.1}s`, border: '1px solid color-mix(in srgb, var(--primary) 50%, transparent)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
              onClick={() => {
                void onSendMessage(prompt)
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <div aria-live="polite" className="chat-messages" style={{ background: 'color-mix(in srgb, #000 40%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)', fontFamily: 'Space Grotesk, monospace' }}>
        {sortedMessages.length === 0 ? (
          <p className="empty-state glow-text" style={{ color: 'var(--primary)' }}>
            &gt; Awaiting initial input command...
          </p>
        ) : null}
        {sortedMessages.map((message) => (
          <article
            key={message.id}
            className={message.role === 'user' ? 'chat-bubble chat-bubble--user' : 'chat-bubble'}
            style={{
              animation: 'fade-up 0.3s ease forwards',
              background: message.role === 'user' ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--success) 15%, transparent)',
              borderColor: message.role === 'user' ? 'var(--primary)' : 'var(--success)',
              boxShadow: message.role === 'user' ? 'var(--glow-primary)' : 'var(--glow-success)',
            }}
          >
            <p style={{ color: message.role === 'user' ? '#fff' : 'var(--success)' }}>{message.content}</p>
            <small style={{ color: 'color-mix(in srgb, currentColor 70%, transparent)' }}>{formatDate(message.timestamp)}</small>
          </article>
        ))}
        {loading ? <p className="info-text glow-text" style={{ color: 'var(--primary)', animation: 'pulse-glow 1s infinite alternate' }}>&gt; Processing query...</p> : null}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-row" onSubmit={(event) => void handleSubmit(event)}>
        <label className="sr-only" htmlFor="chat-input">
          Ask FinSage assistant
        </label>
        <input
          id="chat-input"
          placeholder="> Enter command..."
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          style={{ fontFamily: 'Space Grotesk, monospace', background: 'color-mix(in srgb, #000 60%, transparent)', border: '1px solid var(--primary)', color: 'var(--primary)' }}
        />
        <button className="primary-button" disabled={loading || !value.trim()} type="submit" style={{ fontFamily: 'Space Grotesk, monospace' }}>
          EXECUTE
        </button>
      </form>
    </section>
  )
}
