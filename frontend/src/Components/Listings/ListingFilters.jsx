import { Filter, X } from 'lucide-react'
import { useState } from 'react'

const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'villa', 'room']
const ROOM_TYPES = ['entire-place', 'private-room', 'shared-room']

function ListingFilters({ filters, onChange, onApply, onReset, isLoading, hasActiveFilters }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    onChange(name, type === 'checkbox' ? checked : value)
  }

  const handleApply = (event) => {
    onApply(event)
    setIsOpen(false)
  }

  const handleReset = () => {
    onReset()
    setIsOpen(false)
  }

  const closeOnBackdrop = (event) => {
    if (event.target === event.currentTarget) setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open listing filters"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Filter listings"
        className="relative inline-flex size-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
      >
        <Filter aria-hidden="true" className="size-5" />
        {hasActiveFilters && <span className="absolute right-1 top-1 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-4 sm:items-center sm:justify-center" role="presentation" onPointerDown={closeOnBackdrop}>
          <div role="dialog" aria-modal="true" aria-labelledby="listing-filter-title" className="max-h-full w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <form onSubmit={handleApply}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="listing-filter-title" className="text-xl font-semibold">Filter listings</h2>
                  <p className="mt-1 text-sm text-slate-600">Set your budget, home type, and move-in needs.</p>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} aria-label="Close filters" className="inline-flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-city">
                  City
                  <input id="listing-city" name="city" value={filters.city} onChange={handleChange} disabled={isLoading} placeholder="e.g. Pune" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50" />
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-property-type">
                  Property type
                  <select id="listing-property-type" name="propertyType" value={filters.propertyType} onChange={handleChange} disabled={isLoading} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50">
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map((type) => <option key={type} value={type} className="capitalize">{type}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-room-type">
                  Room type
                  <select id="listing-room-type" name="roomType" value={filters.roomType} onChange={handleChange} disabled={isLoading} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50">
                    <option value="">Any room type</option>
                    {ROOM_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('-', ' ')}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-min-rent">
                  Minimum monthly rent
                  <input id="listing-min-rent" name="minRent" type="number" min="0" step="1" value={filters.minRent} onChange={handleChange} disabled={isLoading} placeholder="₹0" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50" />
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-max-rent">
                  Maximum monthly rent
                  <input id="listing-max-rent" name="maxRent" type="number" min="0" step="1" value={filters.maxRent} onChange={handleChange} disabled={isLoading} placeholder="No limit" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50" />
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-bedrooms">
                  Bedrooms
                  <select id="listing-bedrooms" name="minBedrooms" value={filters.minBedrooms} onChange={handleChange} disabled={isLoading} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50">
                    <option value="">Any bedrooms</option>
                    <option value="0">Studio / 0+</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-furnished">
                  Furnishing
                  <select id="listing-furnished" name="furnished" value={filters.furnished} onChange={handleChange} disabled={isLoading} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50">
                    <option value="">Any furnishing</option>
                    <option value="true">Furnished</option>
                    <option value="false">Unfurnished</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-available-from">
                  Available by
                  <input id="listing-available-from" name="availableFrom" type="date" value={filters.availableFrom} onChange={handleChange} disabled={isLoading} className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50" />
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="listing-sort">
                  Sort by
                  <select id="listing-sort" name="sort" value={filters.sort} onChange={handleChange} disabled={isLoading} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-700 disabled:bg-slate-50">
                    <option value="newest">Newest first</option>
                    <option value="rent_asc">Rent: low to high</option>
                    <option value="rent_desc">Rent: high to low</option>
                  </select>
                </label>
              </div>

              <label className="mt-5 flex w-fit items-center gap-2 text-sm font-medium text-slate-700" htmlFor="listing-verified-landlord">
                <input id="listing-verified-landlord" name="verifiedLandlord" type="checkbox" checked={filters.verifiedLandlord} onChange={handleChange} disabled={isLoading} className="size-4 accent-slate-900" />
                Verified landlords only
              </label>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={handleReset} disabled={isLoading} className="rounded-md px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">Clear filters</button>
                <button type="submit" disabled={isLoading} className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isLoading ? 'Loading listings…' : 'Apply filters'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ListingFilters
