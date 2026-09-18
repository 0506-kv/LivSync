// The home page answers one question: what is blocked on me, and what is blocked on someone else.
// Everything here is derived from the same payloads the rest of the app already fetches — no new endpoints.

const money = (value) => `₹${new Intl.NumberFormat('en-IN').format(Math.round(value || 0))}`

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function since(date) {
  const days = Math.round((Date.parse(date) - Date.now()) / 86400000)

  if (!Number.isFinite(days)) return ''
  return relative.format(days, 'day')
}

export function when(date) {
  const at = new Date(date)

  if (Number.isNaN(at.getTime())) return ''

  const hours = (at.getTime() - Date.now()) / 3600000
  const clock = at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

  if (hours < 0) return `started ${clock}`
  if (hours < 12) return `today at ${clock}`
  if (hours < 36) return `tomorrow at ${clock}`
  return `${at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${clock}`
}

const mineIn = (rental) => rental.tenantDocuments?.find((entry) => entry.mine)

// Lower rank surfaces first: a call already in progress beats a document that can wait.
function actions({ user, rentals, calls, conversations, notifications }) {
  const found = []

  if (user && !user.emailVerified) {
    found.push({
      id: 'verify',
      rank: 1,
      title: 'Verify your email',
      detail: 'Landlords filter unverified tenants out. It takes one code.',
      to: '/verify-email',
      cta: 'Verify',
    })
  }

  calls.filter((call) => call.joinable).forEach((call) => {
    found.push({
      id: `call-live-${call.id}`,
      rank: 0,
      title: `Your viewing of ${call.listing?.title || 'a listing'} is live`,
      detail: `${call.counterpart?.name || 'The landlord'} is waiting on the call.`,
      to: `/calls/${call.id}/room`,
      cta: 'Join now',
    })
  })

  rentals.forEach((rental) => {
    const name = rental.listing?.title || 'your application'

    if (rental.status === 'accepted' && rental.myPayment && !rental.myPayment.paid) {
      found.push({
        id: `pay-${rental.id}`,
        rank: 2,
        title: `Pay your share for ${name}`,
        detail: `${money(rental.myPayment.amount)} of the move-in total. The agreement is issued once every tenant has paid.`,
        to: '/rentals',
        cta: 'Pay now',
      })
    }

    const missing = mineIn(rental)?.requirements.filter((requirement) => !requirement.shared) || []

    if (missing.length && rental.status !== 'rejected') {
      found.push({
        id: `docs-${rental.id}`,
        rank: 3,
        title: `Send ${missing.length} document${missing.length > 1 ? 's' : ''} for ${name}`,
        detail: missing.map((requirement) => requirement.name).join(', '),
        to: '/rentals',
        cta: 'Upload',
      })
    }

    if (rental.status === 'paid' && rental.documents?.agreement) {
      found.push({
        id: `agreement-${rental.id}`,
        rank: 6,
        title: `Your agreement for ${name} is ready`,
        detail: rental.agreement?.number ? `Agreement ${rental.agreement.number}.` : 'Signed and stored in your account.',
        to: '/rentals',
        cta: 'Open',
      })
    }
  })

  calls
    .filter((call) => call.status === 'scheduled' && !call.joinable && call.startAt)
    .forEach((call) => {
      found.push({
        id: `call-${call.id}`,
        rank: 4,
        title: `Viewing ${when(call.startAt)}`,
        detail: `${call.listing?.title || 'A listing'}${call.listing?.city ? ` · ${call.listing.city}` : ''}`,
        to: '/calls',
        cta: 'Details',
      })
    })

  const unread = conversations.filter((conversation) => conversation.unreadCount > 0)

  if (unread.length) {
    const total = unread.reduce((sum, conversation) => sum + conversation.unreadCount, 0)

    found.push({
      id: 'messages',
      rank: 5,
      title: `${total} unread message${total > 1 ? 's' : ''}`,
      detail: unread.length === 1
        ? `From ${unread[0].counterpart?.name || 'a landlord'} about ${unread[0].listing?.title || 'a listing'}.`
        : `Across ${unread.length} conversations.`,
      to: '/messages',
      cta: 'Read',
    })
  }

  const fresh = notifications.filter((notification) => !notification.readAt)

  if (fresh.length) {
    found.push({
      id: 'alerts',
      rank: 7,
      title: `${fresh.length} new listing${fresh.length > 1 ? 's' : ''} match your alerts`,
      detail: 'Saved searches found these since you were last here.',
      to: '/user/listings',
      cta: 'Browse',
    })
  }

  return found.sort((a, b) => a.rank - b.rank)
}

// Waiting on someone else — shown so nothing looks forgotten, but never as a to-do.
function waiting({ rentals, calls }) {
  const open = []

  rentals.forEach((rental) => {
    const name = rental.listing?.title || 'A listing'

    if (rental.status === 'pending') {
      open.push({
        id: `pending-${rental.id}`,
        title: name,
        detail: `Applied ${since(rental.createdAt)} · with ${rental.landlord?.name || 'the landlord'}`,
        state: 'Awaiting decision',
      })
    }

    if (rental.status === 'accepted' && rental.myPayment?.paid) {
      open.push({
        id: `split-${rental.id}`,
        title: name,
        detail: 'Your share is paid. The agreement unlocks when everyone has settled.',
        state: 'Awaiting your buddy',
      })
    }
  })

  calls.filter((call) => call.status === 'requested').forEach((call) => {
    open.push({
      id: `req-${call.id}`,
      title: call.listing?.title || 'A listing',
      detail: `You asked ${call.counterpart?.name || 'the landlord'} for a viewing slot.`,
      state: 'Awaiting a time',
    })
  })

  return open
}

export function buildSignals({ user, rentals = [], calls = [], conversations = [], notifications = [], saved = [] }) {
  const needsYou = actions({ user, rentals, calls, conversations, notifications })

  return {
    needsYou,
    inMotion: waiting({ rentals, calls }),
    fresh: notifications.filter((notification) => notification.listing).slice(0, 3),
    counts: {
      saved: saved.length,
      applications: rentals.filter((rental) => rental.status !== 'rejected').length,
      unread: conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
    },
  }
}
