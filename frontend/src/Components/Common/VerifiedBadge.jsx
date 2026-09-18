// The one place the email-verified tick is drawn, so it reads the same on a profile,
// a listing, a chat header and a BuddyUp card.
function VerifiedBadge({ verified, label = 'Email verified', unverifiedLabel = '', size = 'sm' }) {
  if (!verified && !unverifiedLabel) return null

  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
  const tone = verified
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-medium ${padding} ${tone}`}>
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-3.5 fill-current">
        {verified ? (
          <path d="M10 1.5l2.1 1.6 2.6-.2.8 2.5 2.1 1.5-1 2.4 1 2.4-2.1 1.5-.8 2.5-2.6-.2L10 18.5l-2.1-1.6-2.6.2-.8-2.5L2.4 13l1-2.4-1-2.4 2.1-1.5.8-2.5 2.6.2L10 1.5zm-.8 11.4l4.3-4.3-1.2-1.2-3.1 3.1-1.5-1.5-1.2 1.2 2.7 2.7z" />
        ) : (
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.9 12H9.1v-1.8h1.8V14zm0-3.1H9.1V5.5h1.8v5.4z" />
        )}
      </svg>
      {verified ? label : unverifiedLabel}
    </span>
  )
}

export default VerifiedBadge
