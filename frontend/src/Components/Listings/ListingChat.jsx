import axios from 'axios'
import { useEffect, useRef, useState } from 'react'

const BASE_URL = import.meta.env.VITE_BASE_URL

function ListingChat({ listingId, listingTitle }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, isAsking, isOpen])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const asked = question.trim()
    if (!asked || isAsking) return

    const history = messages
    setMessages([...history, { role: 'user', text: asked }])
    setQuestion('')
    setError('')
    setIsAsking(true)

    try {
      const response = await axios.post(
        `${BASE_URL}/listings/${listingId}/chat`,
        { message: asked, history },
        { withCredentials: true },
      )

      const reply = response.data?.data?.reply
      if (!response.data?.success || !reply) throw new Error(response.data?.message || 'Unable to answer that')

      setMessages((current) => [...current, { role: 'model', text: reply }])
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to answer that')
    } finally {
      setIsAsking(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg hover:bg-slate-800"
      >
        Ask about this listing
      </button>
    )
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <p className="font-semibold">Listing assistant</p>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{listingTitle}</p>
        </div>
        <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant" className="rounded-md px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100">×</button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {!messages.length && (
          <p className="rounded-lg bg-slate-100 p-3 text-slate-600">
            Ask me anything about this place — rent, deposit, move-in costs, amenities, size or availability.
          </p>
        )}
        {messages.map((entry, index) => (
          <p
            key={index}
            className={entry.role === 'user'
              ? 'ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-lg bg-slate-900 px-3 py-2 text-white'
              : 'w-fit max-w-[85%] whitespace-pre-wrap rounded-lg bg-slate-100 px-3 py-2 text-slate-700'}
          >
            {entry.text}
          </p>
        ))}
        {isAsking && <p className="text-slate-500">Thinking…</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-4">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={500}
          placeholder="What is the total move-in cost?"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </aside>
  )
}

export default ListingChat
