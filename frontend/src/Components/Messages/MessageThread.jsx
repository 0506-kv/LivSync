import axios from 'axios'
import { useEffect, useRef, useState } from 'react'

const BASE_URL = import.meta.env.VITE_BASE_URL

function formatTime(value) {
  return value ? new Date(value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''
}

// Mounted with key={conversationId}, so switching threads remounts with clean state.
function MessageThread({ conversationId, title, subtitle, refreshToken, onSent, onError }) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const cursorRef = useRef('')
  const endRef = useRef(null)

  useEffect(() => {
    let isCurrent = true

    const load = async () => {
      try {
        // With a cursor the server only returns messages newer than the last one shown.
        const cursor = cursorRef.current
        const response = await axios.get(`${BASE_URL}/messages/conversations/${conversationId}/messages`, {
          params: cursor ? { after: cursor } : {},
          withCredentials: true,
        })

        if (!response.data?.success) throw new Error(response.data?.message || 'Unable to load messages')
        if (!isCurrent) return

        const loaded = response.data.data.messages

        setMessages((current) => {
          const next = cursor ? [...current, ...loaded] : loaded

          cursorRef.current = next.length ? next[next.length - 1].id : ''

          return next
        })
        onError('')
      } catch (requestError) {
        if (isCurrent) onError(requestError, 'Unable to load messages')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    load()

    return () => {
      isCurrent = false
    }
  }, [conversationId, refreshToken, onError])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  const handleSend = async (event) => {
    event.preventDefault()

    const text = draft.trim()

    if (!text) return

    setIsSending(true)

    try {
      const response = await axios.post(
        `${BASE_URL}/messages/conversations/${conversationId}/messages`,
        { text },
        { withCredentials: true },
      )

      if (!response.data?.success) throw new Error(response.data?.message || 'Unable to send message')

      const sent = response.data.data.message

      cursorRef.current = sent.id
      setMessages((current) => [...current, sent])
      setDraft('')
      onError('')
      onSent()
    } catch (requestError) {
      onError(requestError, 'Unable to send message')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <header className="border-b border-slate-200 px-5 py-3">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {isLoading && <p className="text-sm text-slate-600">Loading messages…</p>}
        {!isLoading && !messages.length && <p className="text-sm text-slate-600">No messages yet. Say hello.</p>}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${message.mine ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
              <p className="whitespace-pre-wrap">{message.text}</p>
              <p className={`mt-1 text-[11px] ${message.mine ? 'text-slate-300' : 'text-slate-500'}`}>{formatTime(message.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-end gap-3 border-t border-slate-200 px-5 py-4">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Write a message…"
          className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </>
  )
}

export default MessageThread
