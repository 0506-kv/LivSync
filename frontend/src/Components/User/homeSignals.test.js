import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSignals } from './homeSignals.js'

const verified = { emailVerified: true }
const hours = (n) => new Date(Date.now() + n * 3600000).toISOString()

test('a live call outranks every other action', () => {
  const { needsYou } = buildSignals({
    user: { emailVerified: false },
    calls: [{ id: 'c1', joinable: true, status: 'scheduled', listing: { title: 'Baner Road' }, counterpart: { name: 'Rhea' } }],
  })

  assert.equal(needsYou[0].id, 'call-live-c1')
  assert.equal(needsYou[1].id, 'verify')
})

test('an accepted rental asks for the share, a paid one waits on the buddy', () => {
  const unpaid = buildSignals({
    user: verified,
    rentals: [{ id: 'r1', status: 'accepted', myPayment: { amount: 29000, paid: false }, listing: { title: 'Baner Road' } }],
  })
  assert.equal(unpaid.needsYou[0].id, 'pay-r1')
  assert.match(unpaid.needsYou[0].detail, /₹29,000/)
  assert.equal(unpaid.inMotion.length, 0)

  const paid = buildSignals({
    user: verified,
    rentals: [{ id: 'r1', status: 'accepted', myPayment: { amount: 29000, paid: true }, listing: { title: 'Baner Road' } }],
  })
  assert.equal(paid.needsYou.length, 0)
  assert.equal(paid.inMotion[0].state, 'Awaiting your buddy')
})

test('only my own unshared documents are chased, and not on a rejected application', () => {
  const rental = (status) => ({
    id: 'r2',
    status,
    listing: { title: 'Koregaon Park' },
    tenantDocuments: [
      { mine: true, requirements: [{ name: 'Payslip', shared: false }, { name: 'ID', shared: true }] },
      { mine: false, requirements: [{ name: 'Payslip', shared: false }] },
    ],
  })

  const { needsYou } = buildSignals({ user: verified, rentals: [rental('accepted')] })
  assert.equal(needsYou[0].title, 'Send 1 document for Koregaon Park')
  assert.equal(needsYou[0].detail, 'Payslip')

  assert.equal(buildSignals({ user: verified, rentals: [rental('rejected')] }).needsYou.length, 0)
})

test('unread messages collapse into one row and count every conversation', () => {
  const { needsYou, counts } = buildSignals({
    user: verified,
    conversations: [
      { unreadCount: 2, counterpart: { name: 'Rhea' }, listing: { title: 'Baner Road' } },
      { unreadCount: 1, counterpart: { name: 'Sam' }, listing: { title: 'Aundh' } },
      { unreadCount: 0 },
    ],
  })

  assert.equal(needsYou.length, 1)
  assert.equal(needsYou[0].title, '3 unread messages')
  assert.equal(counts.unread, 3)
})

test('read notifications never become an action but still fill the new-listings rail', () => {
  const { needsYou, fresh } = buildSignals({
    user: verified,
    notifications: [{ id: 'n1', readAt: new Date().toISOString(), listing: { title: 'Aundh' } }],
  })

  assert.equal(needsYou.length, 0)
  assert.equal(fresh.length, 1)
})

test('a scheduled call reads as a time, not a status', () => {
  const { needsYou } = buildSignals({
    user: verified,
    calls: [{ id: 'c2', status: 'scheduled', joinable: false, startAt: hours(3), listing: { title: 'Baner Road', city: 'Pune' } }],
  })

  assert.match(needsYou[0].title, /^Viewing today at /)
})

test('a brand new tenant has an empty queue', () => {
  const { needsYou, inMotion, counts } = buildSignals({ user: verified })

  assert.deepEqual(needsYou, [])
  assert.deepEqual(inMotion, [])
  assert.equal(counts.saved, 0)
})
