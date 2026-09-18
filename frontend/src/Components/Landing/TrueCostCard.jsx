import { useEffect, useState } from 'react'
import VerifiedBadge from '../Common/VerifiedBadge'

const COLD = 14500
const UTILITIES = 2300
const OTHER = 1200
const DEPOSIT = 58000
const TOTAL = COLD + UTILITIES + OTHER

const money = (value) => `₹${new Intl.NumberFormat('en-IN').format(value)}`

// The hero's argument in one card: the advertised rent is about four fifths of the real one.
function TrueCostCard() {
  const [mode, setMode] = useState('elsewhere')
  const isLive = mode === 'livsync'

  useEffect(() => {
    const timer = setTimeout(() => setMode('livsync'), 2000)
    return () => clearTimeout(timer)
  }, [])

  const rows = isLive
    ? [
        { label: 'Cold rent', value: money(COLD), dot: 'bg-ink', tone: 'text-ink' },
        { label: 'Utilities', value: money(UTILITIES), dot: 'bg-clay', tone: 'text-ink' },
        { label: 'Other monthly charges', value: money(OTHER), dot: 'bg-sand', tone: 'text-ink' },
        { label: 'Deposit (one-time)', value: money(DEPOSIT), dot: 'bg-ink/20', tone: 'text-muted' },
      ]
    : [
        { label: 'Cold rent', value: money(COLD), dot: 'bg-ink', tone: 'text-ink' },
        { label: 'Utilities', value: 'ask owner', dot: 'bg-ink/20', tone: 'text-amber-700' },
        { label: 'Other monthly charges', value: 'not stated', dot: 'bg-ink/20', tone: 'text-amber-700' },
        { label: 'Deposit (one-time)', value: 'on call', dot: 'bg-ink/20', tone: 'text-amber-700' },
      ]

  const tabClass = (active) => [
    'cursor-pointer rounded-full px-3 py-2.5 text-[13.5px] font-medium transition-colors',
    active ? 'bg-card text-ink shadow-sm' : 'bg-transparent text-faint hover:text-ink',
  ].join(' ')

  return (
    <div className="relative min-w-0">
      <div aria-hidden className="absolute inset-y-0 -bottom-6 left-6 -right-4 top-6 rounded-[22px] border border-ink/15" />
      <article className="relative rounded-[22px] border border-ink/15 bg-card p-5 shadow-[0_40px_70px_-46px_rgba(21,19,15,.7)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.14em] text-faint">Sample listing · Pune</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-[-.03em]">2 BHK · Baner Road</h2>
          </div>
          <VerifiedBadge verified label="Verified landlord" size="xs" />
        </div>

        <div role="tablist" className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-ink/6 p-1">
          <button type="button" role="tab" aria-selected={!isLive} onClick={() => setMode('elsewhere')} className={tabClass(!isLive)}>
            Listed elsewhere
          </button>
          <button type="button" role="tab" aria-selected={isLive} onClick={() => setMode('livsync')} className={tabClass(isLive)}>
            On LivSync
          </button>
        </div>

        <div className="mt-6 flex items-baseline gap-2.5">
          <span className="font-display text-5xl font-bold leading-none tracking-[-.04em]">
            {isLive ? money(TOTAL) : `${money(COLD)} + ?`}
          </span>
          <span className="text-sm text-faint">{isLive ? 'true monthly total' : 'advertised rent only'}</span>
        </div>

        <div className="mt-4 flex h-3.5 overflow-hidden rounded-full bg-ink/7">
          <div className="bg-ink transition-[width] duration-500 ease-out" style={{ width: '80.6%' }} />
          {isLive ? (
            <>
              <div className="bg-clay transition-[width] duration-500 ease-out" style={{ width: '12.8%' }} />
              <div className="bg-sand transition-[width] duration-500 ease-out" style={{ width: '6.6%' }} />
            </>
          ) : (
            <div
              className="transition-[width] duration-500 ease-out"
              style={{
                width: '19.4%',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(21,19,15,.22) 0 6px, rgba(21,19,15,.06) 6px 12px)',
              }}
            />
          )}
        </div>

        <ul className="mt-5 grid gap-px overflow-hidden rounded-xl border border-ink/12 bg-ink/12">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 bg-card px-3.5 py-3">
              <span className="inline-flex items-center gap-2.5 text-sm text-ink-soft">
                <span className={`size-2.5 rounded-[3px] ${row.dot}`} />
                {row.label}
              </span>
              <span className={`font-mono text-[13.5px] ${row.tone}`}>{row.value}</span>
            </li>
          ))}
        </ul>

        <p className={`mt-3.5 text-[13px] leading-relaxed ${isLive ? 'text-muted' : 'text-amber-700'}`}>
          {isLive
            ? 'Everything a tenant pays each month, plus the move-in deposit — in the listing, before the first message.'
            : 'The advertised figure covers about four fifths of what you would actually pay each month.'}
        </p>
      </article>
    </div>
  )
}

export default TrueCostCard
