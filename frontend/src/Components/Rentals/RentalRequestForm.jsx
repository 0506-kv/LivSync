import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_BASE_URL

const today = () => new Date().toISOString().slice(0, 10)

function RentalRequestForm({ listingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ moveInDate: today(), durationMonths: 12, occupants: 1, note: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSent, setIsSent] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await axios.post(
        `${BASE_URL}/rentals`,
        {
          listingId,
          message: form.message,
          preferences: {
            moveInDate: form.moveInDate,
            durationMonths: Number(form.durationMonths),
            occupants: Number(form.occupants),
            note: form.note,
          },
        },
        { withCredentials: true },
      )

      if (!response.data?.success) throw new Error(response.data?.message || 'Unable to send your request')

      setIsSent(true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to send your request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        <p className="font-semibold">Request sent</p>
        <p className="mt-1">The landlord will review your profile and reply. Payment opens once they accept.</p>
        <Link to="/rentals" className="mt-2 inline-block font-semibold underline">Track your requests</Link>
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
        Request to rent
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      <p className="font-semibold">Request to rent</p>
      <p className="text-xs text-slate-500">Your name, contact details and the preferences below are shared with the landlord.</p>
      <label className="block text-xs font-medium text-slate-700" htmlFor="moveInDate">
        Move-in date
        <input id="moveInDate" name="moveInDate" type="date" min={today()} value={form.moveInDate} onChange={handleChange} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-slate-700" htmlFor="durationMonths">
          Months
          <input id="durationMonths" name="durationMonths" type="number" min="1" max="120" value={form.durationMonths} onChange={handleChange} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700" />
        </label>
        <label className="block text-xs font-medium text-slate-700" htmlFor="occupants">
          Occupants
          <input id="occupants" name="occupants" type="number" min="1" max="20" value={form.occupants} onChange={handleChange} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700" />
        </label>
      </div>
      <label className="block text-xs font-medium text-slate-700" htmlFor="note">
        Living preferences (optional)
        <input id="note" name="note" type="text" maxLength={500} value={form.note} onChange={handleChange} placeholder="Non-smoker, works from home, no pets" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700" />
      </label>
      <label className="block text-xs font-medium text-slate-700" htmlFor="message">
        Message to the landlord
        <textarea id="message" name="message" rows={3} minLength={10} maxLength={1000} value={form.message} onChange={handleChange} required placeholder="Introduce yourself and say why this place suits you." className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700" />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? 'Sending…' : 'Send request'}
        </button>
        <button type="button" onClick={() => setIsOpen(false)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
      </div>
    </form>
  )
}

export default RentalRequestForm
