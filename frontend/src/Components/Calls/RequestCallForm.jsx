import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_BASE_URL

function RequestCallForm({ listingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ mode: 'video', note: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await axios.post(
        `${BASE_URL}/calls`,
        { listingId, mode: form.mode, note: form.note },
        { withCredentials: true },
      )

      if (!response.data?.success) throw new Error(response.data?.message || 'Unable to request the call')

      setIsSent(true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to request the call')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        <p className="font-semibold">Call requested</p>
        <p className="mt-1">The landlord will pick a date and time. You can join from your calls once they do.</p>
        <Link to="/calls" className="mt-2 inline-block font-semibold underline">See your calls</Link>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full rounded-md border border-slate-900 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-100"
      >
        Request a call
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      <p className="font-semibold">Request a call</p>
      <p className="text-xs text-slate-500">Ask for an appointment and the landlord will set a date and time of up to 30 minutes.</p>

      <label className="block text-xs font-medium text-slate-700" htmlFor="mode">
        Call type
        <select
          id="mode"
          value={form.mode}
          onChange={(event) => setForm({ ...form, mode: event.target.value })}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700"
        >
          <option value="video">Video call</option>
          <option value="voice">Voice call</option>
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-700" htmlFor="note">
        Note (optional)
        <textarea
          id="note"
          rows="2"
          maxLength="300"
          value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
          placeholder="What would you like to discuss, and when are you free?"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700"
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending…' : 'Send request'}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="button" onClick={() => setIsOpen(false)} className="text-xs font-medium text-slate-600 underline">Cancel</button>
    </form>
  )
}

export default RequestCallForm
