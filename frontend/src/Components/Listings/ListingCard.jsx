function formatRent(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function readableValue(value) {
  return value?.replaceAll('-', ' ') || '—'
}

function ListingCard({ listing, footer }) {
  const monthlyRent = listing.totalMonthlyRent
    ?? (Number(listing.rent?.coldRent || 0) + Number(listing.rent?.utilities || 0) + Number(listing.rent?.otherMonthlyCharges || 0))
  const photo = listing.photos?.[0]
  const isSoldOut = listing.status === 'rented'

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {photo ? (
        <img src={photo} alt={listing.title} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500">No photo provided</div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{listing.title}</h2>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${isSoldOut ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
            {isSoldOut ? 'Sold out' : readableValue(listing.status)}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{listing.location?.city}, {listing.location?.state}</p>
        <p className="mt-4 text-xl font-semibold text-slate-900">₹{formatRent(monthlyRent)} <span className="text-sm font-normal text-slate-500">/ month</span></p>
        <p className="mt-3 text-sm text-slate-600">
          {listing.bedrooms} bed · {listing.bathrooms} bath · {listing.areaSqFt} sq ft · {readableValue(listing.roomType)}
        </p>
        {footer && <div className="mt-5 border-t border-slate-100 pt-4">{footer}</div>}
      </div>
    </article>
  )
}

export default ListingCard
