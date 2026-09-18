import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RentalRequestForm from '../../Components/Rentals/RentalRequestForm'
import UserNavbar from '../../Components/User/UserNavbar'

const BASE_URL = import.meta.env.VITE_BASE_URL

function formatAmount(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

function ListingDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [isContacting, setIsContacting] = useState(false)
  const [contactError, setContactError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadListing = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await axios.get(`${BASE_URL}/listings/${listingId}`, { withCredentials: true })
        const loadedListing = response.data?.data?.listing

        if (!response.data?.success || !loadedListing) {
          throw new Error(response.data?.message || 'Unable to load listing')
        }

        if (isCurrent) setListing(loadedListing)
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.response?.data?.message || requestError.message || 'Unable to load listing')
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadListing()

    return () => {
      isCurrent = false
    }
  }, [listingId, retryKey])

  const handleContactLandlord = async () => {
    setContactError('')
    setIsContacting(true)

    try {
      const response = await axios.post(`${BASE_URL}/messages/conversations`, { listingId }, { withCredentials: true })
      const conversationId = response.data?.data?.conversation?.id

      if (!response.data?.success || !conversationId) {
        throw new Error(response.data?.message || 'Unable to contact landlord')
      }

      navigate(`/messages?c=${conversationId}`)
    } catch (requestError) {
      setContactError(requestError.response?.data?.message || requestError.message || 'Unable to contact landlord')
      setIsContacting(false)
    }
  }

  const monthlyRent = listing && (listing.totalMonthlyRent
    ?? (Number(listing.rent?.coldRent || 0) + Number(listing.rent?.utilities || 0) + Number(listing.rent?.otherMonthlyCharges || 0)))

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <UserNavbar />
      <main className="mx-auto max-w-5xl px-5 py-10">
        {isLoading && <p className="text-slate-600">Loading listing…</p>}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-3 font-semibold underline">Try again</button>
          </div>
        )}

        {listing && !isLoading && !error && (
          <article>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-sm font-medium capitalize text-slate-500">{listing.propertyType} · {listing.roomType.replaceAll('-', ' ')}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">{listing.title}</h1>
                <p className="mt-2 text-slate-600">{listing.location.address}, {listing.location.city}, {listing.location.state} {listing.location.postalCode}</p>
              </div>
              <p className="text-2xl font-semibold">₹{formatAmount(monthlyRent)} <span className="text-sm font-normal text-slate-500">/ month</span></p>
            </div>

            {listing.photos?.length ? (
              <section className="mt-8 grid gap-4 sm:grid-cols-2">
                {listing.photos.map((photo, index) => <img key={photo} src={photo} alt={`${listing.title} ${index + 1}`} className="h-64 w-full rounded-xl object-cover" />)}
              </section>
            ) : (
              <div className="mt-8 flex h-64 items-center justify-center rounded-xl bg-slate-200 text-sm text-slate-500">No photos provided</div>
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_19rem]">
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold">About this property</h2>
                  <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{listing.description}</p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold">Property details</h2>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div><dt className="text-sm text-slate-500">Bedrooms</dt><dd className="mt-1 font-medium">{listing.bedrooms}</dd></div>
                    <div><dt className="text-sm text-slate-500">Bathrooms</dt><dd className="mt-1 font-medium">{listing.bathrooms}</dd></div>
                    <div><dt className="text-sm text-slate-500">Area</dt><dd className="mt-1 font-medium">{listing.areaSqFt} sq ft</dd></div>
                    <div><dt className="text-sm text-slate-500">Furnishing</dt><dd className="mt-1 font-medium">{listing.furnished ? 'Furnished' : 'Unfurnished'}</dd></div>
                    <div><dt className="text-sm text-slate-500">Available from</dt><dd className="mt-1 font-medium">{formatDate(listing.availableFrom)}</dd></div>
                    <div><dt className="text-sm text-slate-500">Listing status</dt><dd className="mt-1 font-medium capitalize">{listing.status}</dd></div>
                  </dl>
                </section>
                <section>
                  <h2 className="text-xl font-semibold">Amenities</h2>
                  {listing.amenities?.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2">{listing.amenities.map((amenity) => <li key={amenity} className="rounded-full bg-slate-200 px-3 py-1.5 text-sm text-slate-700">{amenity}</li>)}</ul>
                  ) : <p className="mt-3 text-slate-600">No amenities have been listed.</p>}
                </section>
              </div>

              <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold">Costs</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Base rent</dt><dd>₹{formatAmount(listing.rent?.coldRent)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Utilities</dt><dd>₹{formatAmount(listing.rent?.utilities)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Other charges</dt><dd>₹{formatAmount(listing.rent?.otherMonthlyCharges)}</dd></div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 font-semibold"><dt>Total monthly</dt><dd>₹{formatAmount(monthlyRent)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Security deposit</dt><dd>₹{formatAmount(listing.securityDeposit)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Brokerage fee</dt><dd>₹{formatAmount(listing.brokerageFee)}</dd></div>
                </dl>
                <div className="mt-6 border-t border-slate-200 pt-5 text-sm">
                  <p className="font-medium">Listed by {listing.landlord?.name || 'Landlord'}</p>
                  {listing.landlord?.companyName && <p className="mt-1 text-slate-600">{listing.landlord.companyName}</p>}
                  <button
                    type="button"
                    onClick={handleContactLandlord}
                    disabled={isContacting}
                    className="mt-4 w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isContacting ? 'Opening chat…' : 'Message landlord'}
                  </button>
                  {contactError && <p className="mt-2 text-red-600">{contactError}</p>}
                  <RentalRequestForm listingId={listingId} totalDue={monthlyRent + (listing.securityDeposit || 0) + (listing.brokerageFee || 0)} />
                  {listing.floorPlanUrl && <a href={listing.floorPlanUrl} target="_blank" rel="noreferrer" className="mt-4 block font-semibold text-slate-900 hover:underline">View floor plan</a>}
                  {listing.virtualTourUrl && <a href={listing.virtualTourUrl} target="_blank" rel="noreferrer" className="mt-3 block font-semibold text-slate-900 hover:underline">Open virtual tour</a>}
                </div>
              </aside>
            </div>
          </article>
        )}
      </main>
    </div>
  )
}

export default ListingDetailPage
