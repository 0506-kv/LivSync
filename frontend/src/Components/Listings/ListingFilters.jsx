const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'villa', 'room']
const ROOM_TYPES = ['entire-place', 'private-room', 'shared-room']

const FIELD = 'mt-1.5 w-full rounded-xl border border-ink/18 bg-card px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition-colors focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60'
const LABEL = 'block text-[13.5px] font-medium text-ink-soft'
const GROUP = 'font-mono text-[10.5px] uppercase tracking-[.16em] text-faint'

// Only the fields live here; the page decides whether they sit in a sidebar or a sheet.
// Both shells can be mounted at once, so every id is namespaced.
function ListingFilters({ filters, onChange, onApply, onReset, isLoading, idPrefix = 'listing' }) {
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    onChange(name, type === 'checkbox' ? checked : value)
  }

  const id = (name) => `${idPrefix}-${name}`

  return (
    <form onSubmit={onApply} className="grid gap-6">
      <fieldset className="grid gap-3">
        <legend className={GROUP}>Budget</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className={LABEL} htmlFor={id('min-rent')}>
            Min rent
            <input id={id('min-rent')} name="minRent" type="number" min="0" step="500" inputMode="numeric" value={filters.minRent} onChange={handleChange} disabled={isLoading} placeholder="₹0" className={FIELD} />
          </label>
          <label className={LABEL} htmlFor={id('max-rent')}>
            Max rent
            <input id={id('max-rent')} name="maxRent" type="number" min="0" step="500" inputMode="numeric" value={filters.maxRent} onChange={handleChange} disabled={isLoading} placeholder="Any" className={FIELD} />
          </label>
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className={GROUP}>The home</legend>
        <label className={LABEL} htmlFor={id('property-type')}>
          Property type
          <select id={id('property-type')} name="propertyType" value={filters.propertyType} onChange={handleChange} disabled={isLoading} className={`${FIELD} capitalize`}>
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((type) => <option key={type} value={type} className="capitalize">{type}</option>)}
          </select>
        </label>
        <label className={LABEL} htmlFor={id('room-type')}>
          Room type
          <select id={id('room-type')} name="roomType" value={filters.roomType} onChange={handleChange} disabled={isLoading} className={`${FIELD} capitalize`}>
            <option value="">Any room type</option>
            {ROOM_TYPES.map((type) => <option key={type} value={type} className="capitalize">{type.replaceAll('-', ' ')}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={LABEL} htmlFor={id('bedrooms')}>
            Bedrooms
            <select id={id('bedrooms')} name="minBedrooms" value={filters.minBedrooms} onChange={handleChange} disabled={isLoading} className={FIELD}>
              <option value="">Any</option>
              <option value="0">Studio</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>
          <label className={LABEL} htmlFor={id('furnished')}>
            Furnishing
            <select id={id('furnished')} name="furnished" value={filters.furnished} onChange={handleChange} disabled={isLoading} className={FIELD}>
              <option value="">Any</option>
              <option value="true">Furnished</option>
              <option value="false">Unfurnished</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className={GROUP}>Moving in</legend>
        <label className={LABEL} htmlFor={id('available-from')}>
          Available by
          <input id={id('available-from')} name="availableFrom" type="date" value={filters.availableFrom} onChange={handleChange} disabled={isLoading} className={FIELD} />
        </label>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/15 bg-ink/3 p-3.5" htmlFor={id('verified-landlord')}>
        <input id={id('verified-landlord')} name="verifiedLandlord" type="checkbox" checked={filters.verifiedLandlord} onChange={handleChange} disabled={isLoading} className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#13322A]" />
        <span>
          <span className="block text-[13.5px] font-medium text-ink">Verified landlords only</span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">Homes from landlords who confirmed their email address.</span>
        </span>
      </label>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 cursor-pointer rounded-full bg-ink px-5 py-3 text-[14.5px] font-medium text-[#F7F5EF] transition-colors hover:bg-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress disabled:opacity-70"
        >
          {isLoading ? 'Searching…' : 'Apply filters'}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          className="cursor-pointer rounded-full border border-ink/20 px-5 py-3 text-[14.5px] font-medium text-ink-soft transition-colors hover:bg-ink/6 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </form>
  )
}

export default ListingFilters
