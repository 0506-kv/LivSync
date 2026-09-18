import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LandlordNavbar from '../../Components/Landlord/LandlordNavbar'
import UserNavbar from '../../Components/User/UserNavbar'
import { useAuth } from '../../Context/AuthContext'

const BASE_URL = import.meta.env.VITE_BASE_URL
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-800',
}

function formatAmount(value) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const script = document.createElement('script')

    script.src = CHECKOUT_SRC
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function RentalsPage() {
  const { role, clearSession } = useAuth()
  const navigate = useNavigate()
  const [rentals, setRentals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)

  const Navbar = role === 'landlord' ? LandlordNavbar : UserNavbar
  const isLandlord = role === 'landlord'

  const handleError = useCallback((requestError, fallback) => {
    if (requestError?.response?.status === 401) {
      clearSession()
      navigate('/login', { replace: true })
      return
    }

    setError(requestError?.response?.data?.message || requestError?.message || fallback)
  }, [clearSession, navigate])

  useEffect(() => {
    let isCurrent = true

    const loadRentals = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/rentals`, { withCredentials: true })

        if (!response.data?.success) throw new Error(response.data?.message || 'Unable to load requests')
        if (!isCurrent) return

        setRentals(response.data.data.rentals)
        setError('')
      } catch (requestError) {
        if (isCurrent) handleError(requestError, 'Unable to load requests')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadRentals()

    return () => {
      isCurrent = false
    }
  }, [handleError, refreshToken])

  const refresh = () => setRefreshToken((token) => token + 1)

  // Every action is a POST/PATCH followed by a reload, so the list always shows server truth.
  const runAction = async (rentalId, request, fallback) => {
    setBusyId(rentalId)
    setError('')

    try {
      const response = await request()

      if (!response.data?.success) throw new Error(response.data?.message || fallback)

      refresh()
    } catch (requestError) {
      handleError(requestError, fallback)
    } finally {
      setBusyId('')
    }
  }

  const decide = (rental, decision) => runAction(
    rental.id,
    () => axios.patch(`${BASE_URL}/rentals/${rental.id}/decision`, { decision }, { withCredentials: true }),
    'Unable to update the request',
  )

  const confirmInPerson = (rental) => runAction(
    rental.id,
    () => axios.post(`${BASE_URL}/rentals/${rental.id}/payment/confirm`, {}, { withCredentials: true }),
    'Unable to confirm the payment',
  )

  const chooseInPerson = (rental) => runAction(
    rental.id,
    () => axios.post(`${BASE_URL}/rentals/${rental.id}/payment/in-person`, {}, { withCredentials: true }),
    'Unable to select in-person payment',
  )

  const payOnline = async (rental) => {
    setBusyId(rental.id)
    setError('')

    try {
      const isCheckoutReady = await loadCheckout()

      if (!isCheckoutReady) throw new Error('Unable to load the payment window')

      const response = await axios.post(`${BASE_URL}/rentals/${rental.id}/payment/order`, {}, { withCredentials: true })

      if (!response.data?.success) throw new Error(response.data?.message || 'Unable to start the payment')

      const { order, keyId, prefill } = response.data.data
      const checkout = new window.Razorpay({
        key: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'LivSync',
        description: rental.listing?.title || 'Rental payment',
        prefill,
        handler: (result) => runAction(
          rental.id,
          () => axios.post(`${BASE_URL}/rentals/${rental.id}/payment/verify`, result, { withCredentials: true }),
          'Payment could not be verified',
        ),
        modal: { ondismiss: () => setBusyId('') },
      })

      checkout.open()
    } catch (requestError) {
      handleError(requestError, 'Unable to start the payment')
      setBusyId('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{isLandlord ? 'Incoming' : 'Your applications'}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Rental requests</h1>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {isLoading && <p className="mt-8 text-slate-600">Loading requests…</p>}

        {!isLoading && !rentals.length && (
          <p className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            {isLandlord
              ? 'No tenant has requested one of your listings yet.'
              : 'You have not requested a listing yet. Open a listing and send a request to rent.'}
          </p>
        )}

        <div className="mt-8 space-y-5">
          {rentals.map((rental) => {
            const isBusy = busyId === rental.id
            const awaitingInPerson = rental.status === 'accepted' && rental.payment.mode === 'in-person'

            return (
              <article key={rental.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      {rental.listing ? (
                        <Link to={`/listings/${rental.listing.id}`} className="hover:underline">{rental.listing.title}</Link>
                      ) : 'Listing removed'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {isLandlord ? `From ${rental.tenant?.name || 'Tenant'}` : `Listed by ${rental.landlord?.name || 'Landlord'}`}
                      {' · '}
                      sent {formatDate(rental.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[rental.status]}`}>{rental.status}</span>
                </div>

                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                  <div><dt className="text-slate-500">Move-in</dt><dd className="mt-1 font-medium">{formatDate(rental.preferences.moveInDate)}</dd></div>
                  <div><dt className="text-slate-500">Duration</dt><dd className="mt-1 font-medium">{rental.preferences.durationMonths} months</dd></div>
                  <div><dt className="text-slate-500">Occupants</dt><dd className="mt-1 font-medium">{rental.preferences.occupants}</dd></div>
                </dl>

                {rental.preferences.note && <p className="mt-3 text-sm text-slate-600"><span className="text-slate-500">Preferences: </span>{rental.preferences.note}</p>}
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{rental.message}</p>

                {isLandlord && rental.tenant && (
                  <dl className="mt-4 grid gap-4 border-t border-slate-200 pt-4 text-sm sm:grid-cols-3">
                    <div><dt className="text-slate-500">Tenant email</dt><dd className="mt-1 font-medium break-words">{rental.tenant.email}</dd></div>
                    <div><dt className="text-slate-500">Phone</dt><dd className="mt-1 font-medium">{rental.tenant.phone}</dd></div>
                    <div><dt className="text-slate-500">Gender</dt><dd className="mt-1 font-medium capitalize">{rental.tenant.gender?.replaceAll('-', ' ')}</dd></div>
                  </dl>
                )}

                {rental.terms && (
                  <dl className="mt-4 grid gap-4 border-t border-slate-200 pt-4 text-sm sm:grid-cols-4">
                    <div><dt className="text-slate-500">Monthly rent</dt><dd className="mt-1 font-medium">{formatAmount(rental.terms.monthlyRent)}</dd></div>
                    <div><dt className="text-slate-500">Deposit</dt><dd className="mt-1 font-medium">{formatAmount(rental.terms.securityDeposit)}</dd></div>
                    <div><dt className="text-slate-500">Brokerage</dt><dd className="mt-1 font-medium">{formatAmount(rental.terms.brokerageFee)}</dd></div>
                    <div><dt className="text-slate-500">{rental.status === 'paid' ? 'Paid' : 'Due now'}</dt><dd className="mt-1 font-semibold">{formatAmount(rental.terms.totalDue)}</dd></div>
                  </dl>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                  {isLandlord && rental.status === 'pending' && (
                    <>
                      <button type="button" onClick={() => decide(rental, 'accept')} disabled={isBusy} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">Accept request</button>
                      <button type="button" onClick={() => decide(rental, 'reject')} disabled={isBusy} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Reject</button>
                      <span className="text-xs text-slate-500">Accepting freezes today&apos;s rent, deposit and brokerage as the agreed terms.</span>
                    </>
                  )}

                  {isLandlord && awaitingInPerson && (
                    <>
                      <button type="button" onClick={() => confirmInPerson(rental)} disabled={isBusy} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">Confirm payment received</button>
                      <span className="text-xs text-slate-500">The tenant will pay you in person. The agreement is issued once you confirm.</span>
                    </>
                  )}

                  {isLandlord && rental.status === 'accepted' && !rental.payment.mode && (
                    <span className="text-sm text-slate-600">Accepted. Waiting for the tenant to pay.</span>
                  )}

                  {!isLandlord && rental.status === 'pending' && <span className="text-sm text-slate-600">Waiting for the landlord to respond.</span>}
                  {!isLandlord && rental.status === 'rejected' && <span className="text-sm text-slate-600">The landlord declined this request. You can send a new one from the listing.</span>}

                  {!isLandlord && rental.status === 'accepted' && (
                    <>
                      <button type="button" onClick={() => payOnline(rental)} disabled={isBusy} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                        {isBusy ? 'Opening payment…' : `Pay ${formatAmount(rental.terms?.totalDue)} online`}
                      </button>
                      {!awaitingInPerson && (
                        <button type="button" onClick={() => chooseInPerson(rental)} disabled={isBusy} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">I will pay in person</button>
                      )}
                      <span className="text-xs text-slate-500">
                        {awaitingInPerson
                          ? 'Marked as pay in person — the landlord confirms it, and no receipt is issued. Paying online instead still gets you one.'
                          : 'Paying online issues a receipt. In-person payments get the agreement only.'}
                      </span>
                    </>
                  )}

                  {rental.status === 'paid' && (
                    <>
                      <a href={`${BASE_URL}/rentals/${rental.id}/agreement`} target="_blank" rel="noreferrer" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Rental agreement (PDF)</a>
                      {rental.documents.receipt ? (
                        <a href={`${BASE_URL}/rentals/${rental.id}/receipt`} target="_blank" rel="noreferrer" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Payment receipt (PDF)</a>
                      ) : (
                        <span className="text-xs text-slate-500">Paid in person — no receipt is issued by LivSync.</span>
                      )}
                      <span className="text-xs text-slate-500">Agreement {rental.agreement?.number}</span>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default RentalsPage
