import { FormEvent, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { ChatMessage } from '@/types/finance'
import { formatDate } from '@/utils/format'

/** Renders basic markdown-like formatting: **bold**, `code`, bullet lists */
const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(<li key={i} style={{ marginLeft: '1rem' }}>{formatInline(line.slice(2))}</li>)
    } else if (line.trim() === '') {
      elements.push(<br key={i} />)
    } else {
      elements.push(<p key={i} style={{ margin: '0.25rem 0' }}>{formatInline(line)}</p>)
    }
  }
  return elements
}

const formatInline = (text: string): React.ReactNode => {
  // Handle **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.85em' }}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

interface ChatWindowProps {
  loading?: boolean
  messages: ChatMessage[]
  quickPrompts?: string[]
  onSendMessage: (prompt: string) => Promise<void>
  onClearChat?: () => void
}

export const ChatWindow = ({
  loading,
  messages,
  quickPrompts = [],
  onSendMessage,
  onClearChat,
}: ChatWindowProps) => {
  const [value, setValue] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px var(--primary))' }}>
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="M18 15l.75 2.25L21 18l-2.25.75L18 21l-.75-2.25L15 18l2.25-.75L18 15Z" />
            </svg>
            <h3 className="glow-text" style={{ fontFamily: 'Space Grotesk, monospace', color: 'var(--primary)' }}>FinSage AI Terminal</h3>
          </div>
          {onClearChat && sortedMessages.length > 0 && (
            <button className="secondary-button" type="button" onClick={onClearChat}
              style={{ fontSize: '0.8rem', fontFamily: 'Space Grotesk, monospace' }}>
              🗑 Clear
            </button>
          )}
        </div>
        <p className="section-subtitle">
          Ask about budgets, spending trends, and financial forecasting.
        </p>
        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          📎 Context: transactions, budgets, goals, loans, health score
        </small>
      </header>

      {quickPrompts.length > 0 ? (
        <div className="chip-row" aria-label="Suggested prompts">
          {quickPrompts.map((prompt, index) => (
            <button
              key={prompt}
              className="chip-button"
              disabled={loading}
              type="button"
              style={{ animation: `scale-pop 300ms cubic-bezier(0.16, 1, 0.3, 1) both ${index * 80}ms`, border: '1px solid color-mix(in srgb, var(--primary) 50%, transparent)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
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
          <p className="empty-state glow-text" style={{ color: 'var(--primary)', animation: 'glow-pulse 2s ease-in-out infinite' }}>
            &gt; Awaiting input command...
            <span style={{ animation: 'typing-bounce 1s ease-in-out infinite', display: 'inline-block', marginLeft: '2px' }}>▌</span>
          </p>
        ) : null}
        {sortedMessages.map((message) => (
          <article
            key={message.id}
            className={message.role === 'user' ? 'chat-bubble chat-bubble--user' : 'chat-bubble'}
            style={{
              background: message.role === 'user' ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--success) 15%, transparent)',
              borderColor: message.role === 'user' ? 'var(--primary)' : 'var(--success)',
              boxShadow: message.role === 'user' ? 'var(--glow-primary)' : 'var(--glow-success)',
            }}
          >
            <div style={{ color: message.role === 'user' ? '#fff' : 'var(--success)' }}>
              {message.role === 'assistant' ? renderMarkdown(message.content) : <p>{message.content}</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              <small style={{ color: 'color-mix(in srgb, currentColor 70%, transparent)' }}>{formatDate(message.timestamp)}</small>
              {message.role === 'assistant' && (
                <button type="button" onClick={() => void copyToClipboard(message.content, message.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.15rem 0.3rem' }}>
                  {copiedId === message.id ? '✅ Copied' : '📋 Copy'}
                </button>
              )}
            </div>
          </article>
        ))}
        {loading ? (
          <div className="typing-indicator">
            <span className="typing-indicator__dot" />
            <span className="typing-indicator__dot" />
            <span className="typing-indicator__dot" />
          </div>
        ) : null}
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
