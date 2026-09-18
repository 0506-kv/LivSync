import axios from 'axios'
import { useEffect, useState } from 'react'
import UserNavbar from '../../Components/User/UserNavbar'
import ListingCard from '../../Components/Listings/ListingCard'
import ListingFilters from '../../Components/Listings/ListingFilters'

const BASE_URL = import.meta.env.VITE_BASE_URL
const DEFAULT_FILTERS = {
  city: '',
  propertyType: '',
  roomType: '',
  minRent: '',
  maxRent: '',
  minBedrooms: '',
  furnished: '',
  availableFrom: '',
  verifiedLandlord: false,
  sort: 'newest',
}

function buildListingParams(filters) {
  const params = { limit: 50, sort: filters.sort }
  const textFilters = ['city', 'propertyType', 'roomType', 'minRent', 'maxRent', 'minBedrooms', 'furnished', 'availableFrom']

  textFilters.forEach((name) => {
    if (filters[name] !== '') params[name] = filters[name]
  })
  if (filters.verifiedLandlord) params.verifiedLandlord = true

  return params
}

function hasActiveFilters(filters) {
  return Object.entries(filters).some(([name, value]) => name !== 'sort' && value !== '' && value !== false)
}

function UserListingsPage() {
  const [listings, setListings] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    const loadListings = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await axios.get(`${BASE_URL}/listings`, {
          params: buildListingParams(appliedFilters),
          withCredentials: true,
        })

        if (!response.data?.success || !Array.isArray(response.data?.data?.listings) || !Number.isFinite(response.data?.data?.pagination?.total)) {
          throw new Error(response.data?.message || 'Unable to load listings')
        }

        if (isCurrent) {
          setListings(response.data.data.listings)
          setTotal(response.data.data.pagination.total)
        }
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
  }, [appliedFilters, retryKey])

  const updateFilter = (name, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }))
  }

  const applyFilters = (event) => {
    event.preventDefault()
    setAppliedFilters({ ...filters })
  }

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS })
    setAppliedFilters({ ...DEFAULT_FILTERS })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <UserNavbar />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Find a place</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Available listings</h1>
          </div>
          <ListingFilters
            filters={filters}
            onChange={updateFilter}
            onApply={applyFilters}
            onReset={resetFilters}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters(appliedFilters)}
          />
        </div>

        {isLoading && <p className="mt-8 text-slate-600">Loading listings…</p>}
        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-3 font-semibold underline">Try again</button>
          </div>
        )}
        {!isLoading && !error && !listings.length && <p className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-600">{hasActiveFilters(appliedFilters) ? 'No listings match these filters.' : 'No published listings are available yet.'}</p>}

        {!isLoading && !error && listings.length > 0 && (
          <>
            <p className="mt-8 text-sm text-slate-600">
              {listings.length === total
                ? `${total} ${total === 1 ? 'listing' : 'listings'} found`
                : `Showing ${listings.length} of ${total} listings`}
            </p>
            <section className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          </>
        )}
      </main>
    </div>
  )
}

export default UserListingsPage
