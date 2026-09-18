import axios from 'axios'
import { useEffect, useState } from 'react'
import UserNavbar from '../../Components/User/UserNavbar'
import ListingCard from '../../Components/Listings/ListingCard'

const BASE_URL = import.meta.env.VITE_BASE_URL

function UserListingsPage() {
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    const loadListings = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await axios.get(`${BASE_URL}/listings?limit=50`, { withCredentials: true })

        if (!response.data?.success || !Array.isArray(response.data?.data?.listings)) {
          throw new Error(response.data?.message || 'Unable to load listings')
        }

        if (isCurrent) setListings(response.data.data.listings)
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.response?.data?.message || requestError.message || 'Unable to load listings')
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadListings()

    return () => {
      isCurrent = false
    }
  }, [retryKey])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <UserNavbar />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-medium text-slate-500">Find a place</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Available listings</h1>

        {isLoading && <p className="mt-8 text-slate-600">Loading listings…</p>}
        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-3 font-semibold underline">Try again</button>
          </div>
        )}
        {!isLoading && !error && !listings.length && <p className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-600">No published listings are available yet.</p>}

        {!isLoading && !error && listings.length > 0 && (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                footer={(
                  <a href={`/listings/${listing._id}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-900 hover:underline">
                    Open full details
                  </a>
                )}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default UserListingsPage
