import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ListingCard from '../../Components/Listings/ListingCard'
import UserNavbar from '../../Components/User/UserNavbar'
import { useAuth } from '../../Context/AuthContext'

const BASE_URL = import.meta.env.VITE_BASE_URL

function alertDescription(criteria) {
  const parts = [
    criteria.city,
    criteria.propertyType?.replaceAll('-', ' '),
    criteria.roomType?.replaceAll('-', ' '),
    criteria.minRent !== undefined && `from ₹${criteria.minRent}`,
    criteria.maxRent !== undefined && `up to ₹${criteria.maxRent}`,
    criteria.minBedrooms !== undefined && `${criteria.minBedrooms}+ bedrooms`,
    criteria.furnished !== undefined && (criteria.furnished ? 'furnished' : 'unfurnished'),
    criteria.verifiedLandlord && 'verified landlords',
  ].filter(Boolean)

  return parts.length ? parts.join(' · ') : 'All new listings'
}

function SavedListingsPage() {
  const { clearSession } = useAuth()
  const navigate = useNavigate()
  const [savedListings, setSavedListings] = useState([])
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  const handleError = useCallback((requestError, fallback) => {
    if (requestError.response?.status === 401) {
      clearSession()
      navigate('/login', { replace: true })
      return
    }

    setError(requestError.response?.data?.message || requestError.message || fallback)
  }, [clearSession, navigate])

  useEffect(() => {
    let isCurrent = true

    const load = async () => {
      try {
        const [savedResponse, alertsResponse, notificationsResponse] = await Promise.all([
          axios.get(`${BASE_URL}/saved-listings`, { withCredentials: true }),
          axios.get(`${BASE_URL}/listing-alerts`, { withCredentials: true }),
          axios.get(`${BASE_URL}/listing-alerts/notifications`, { withCredentials: true }),
        ])

        if (!savedResponse.data?.success || !alertsResponse.data?.success || !notificationsResponse.data?.success) {
          throw new Error('Unable to load your saved homes and alerts')
        }

        if (isCurrent) {
          setSavedListings(savedResponse.data.data.savedListings || [])
          setAlerts(alertsResponse.data.data.alerts || [])
          setNotifications(notificationsResponse.data.data.notifications || [])
        }
      } catch (requestError) {
        if (isCurrent) handleError(requestError, 'Unable to load your saved homes and alerts')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    load()

    return () => {
      isCurrent = false
    }
  }, [handleError])

  const runAction = async (id, request, fallback, onSuccess) => {
    setBusyId(id)
    setError('')

    try {
      const response = await request()
      if (!response.data?.success) throw new Error(response.data?.message || fallback)
      onSuccess()
    } catch (requestError) {
      handleError(requestError, fallback)
    } finally {
      setBusyId('')
    }
  }

  const removeSavedListing = (listingId) => runAction(
    `saved-${listingId}`,
    () => axios.delete(`${BASE_URL}/saved-listings/${listingId}`, { withCredentials: true }),
    'Unable to remove saved home',
    () => setSavedListings((current) => current.filter((entry) => entry.listing?._id !== listingId)),
  )

  const updateAlert = (alertId, changes) => runAction(
    `alert-${alertId}`,
    () => axios.patch(`${BASE_URL}/listing-alerts/${alertId}`, changes, { withCredentials: true }),
    'Unable to update listing alert',
    () => setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, ...changes } : alert))),
  )

  const removeAlert = (alertId) => runAction(
    `alert-${alertId}`,
    () => axios.delete(`${BASE_URL}/listing-alerts/${alertId}`, { withCredentials: true }),
    'Unable to delete listing alert',
    () => setAlerts((current) => current.filter((alert) => alert.id !== alertId)),
  )

  const markRead = (notificationId) => runAction(
    `notification-${notificationId}`,
    () => axios.patch(`${BASE_URL}/listing-alerts/notifications/${notificationId}/read`, {}, { withCredentials: true }),
    'Unable to mark notification as read',
    () => setNotifications((current) => current.map((notification) => (notification.id === notificationId ? { ...notification, readAt: new Date().toISOString() } : notification))),
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <UserNavbar />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-medium text-slate-500">Your shortlist</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Saved homes and alerts</h1>
        <p className="mt-2 text-sm text-slate-600">Manage bookmarked homes, saved searches, and new-match notifications.</p>

        {error && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {isLoading && <p className="mt-8 text-slate-600">Loading saved homes and alerts…</p>}

        {!isLoading && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_1fr]">
            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Saved homes</h2>
                <Link to="/user/listings" className="text-sm font-semibold text-slate-900 hover:underline">Browse listings</Link>
              </div>
              {!savedListings.length ? (
                <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No saved homes yet. Bookmark homes while you browse to find them here.</p>
              ) : (
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {savedListings.map((entry) => (
                    <ListingCard
                      key={entry.id}
                      listing={entry.listing}
                      saved
                      onSaveToggle={() => removeSavedListing(entry.listing._id)}
                      isSaving={busyId === `saved-${entry.listing._id}`}
                      footer={<Link to={`/listings/${entry.listing._id}`} className="text-sm font-semibold text-slate-900 hover:underline">Open details</Link>}
                    />
                  ))}
                </div>
              )}
            </section>

            <div className="space-y-8">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Listing alerts</h2>
                <p className="mt-1 text-sm text-slate-600">Create alerts from the listings page using your current filters.</p>
                {!alerts.length && <p className="mt-4 text-sm text-slate-500">No alerts saved yet.</p>}
                <ul className="mt-4 space-y-4">
                  {alerts.map((alert) => (
                    <li key={alert.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                      <p className="text-sm font-semibold capitalize">{alertDescription(alert.criteria)}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={alert.inAppEnabled} disabled={busyId === `alert-${alert.id}`} onChange={(event) => updateAlert(alert.id, { inAppEnabled: event.target.checked })} className="size-4 accent-slate-900" /> In-app</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={alert.emailEnabled} disabled={busyId === `alert-${alert.id}`} onChange={(event) => updateAlert(alert.id, { emailEnabled: event.target.checked })} className="size-4 accent-slate-900" /> Email</label>
                      </div>
                      <button type="button" disabled={busyId === `alert-${alert.id}`} onClick={() => removeAlert(alert.id)} className="mt-3 text-sm font-semibold text-red-700 hover:underline disabled:opacity-60">Delete alert</button>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-500">Email alerts are sent only after you verify your email address.</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">New matches</h2>
                {!notifications.length && <p className="mt-4 text-sm text-slate-500">New listings matching your in-app alerts will appear here.</p>}
                <ul className="mt-4 space-y-3">
                  {notifications.map((notification) => (
                    <li key={notification.id} className={`rounded-lg border p-3 ${notification.readAt ? 'border-slate-200' : 'border-slate-900 bg-slate-50'}`}>
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                        {notification.listing && <Link to={`/listings/${notification.listing.id}`} className="text-slate-900 hover:underline">View listing</Link>}
                        {!notification.readAt && <button type="button" disabled={busyId === `notification-${notification.id}`} onClick={() => markRead(notification.id)} className="text-slate-600 hover:underline disabled:opacity-60">Mark read</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default SavedListingsPage
