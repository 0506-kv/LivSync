/* eslint-disable react-refresh/only-export-components -- content module: copy and tile art live beside the one wrapper that renders them */
import { motion } from 'framer-motion'

export const CITIES = ['Pune', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Mumbai', 'Chennai', 'Indore', 'Jaipur', 'Kochi']

export const COST_ROWS = [
  { n: '01', title: 'Cold rent', copy: "The number every other site shouts about. Here it's one line of four, not the headline." },
  { n: '02', title: 'Utilities', copy: 'Electricity, water, society maintenance — declared monthly, not discovered in month two.' },
  { n: '03', title: 'Other monthly charges', copy: 'Parking, internet, club dues. Named individually, never bundled into a vague "extras".' },
  { n: '04', title: 'Deposit & brokerage', copy: 'The move-in cheque, visible before you enquire — not sprung on you after the viewing.' },
]

export const SCORE_BARS = [
  { label: 'Lifestyle', pct: 94 },
  { label: 'Schedule', pct: 88 },
  { label: 'Cleanliness', pct: 96 },
  { label: 'Budget overlap', pct: 81 },
]

export const LANDLORD_POINTS = [
  { title: 'Verified badge on your listing', copy: 'Email-verified owners get the tick tenants look for first.' },
  { title: 'Applications in one queue', copy: 'Shortlist, approve or decline without losing the thread.' },
  { title: 'Signature on file', copy: 'Draw it once; reuse it on every agreement you issue.' },
  { title: 'Mark it rented, instantly', copy: 'The listing closes itself and stops the calls the same minute.' },
]

export const FOOTER_COLUMNS = [
  { heading: 'Rent', links: ['Browse listings', 'BuddyUp matching', 'Saved searches', 'Rental applications'] },
  { heading: 'List', links: ['Post a property', 'Verification', 'Agreements', 'Video viewings'] },
  { heading: 'Company', links: ['About', 'Trust & safety', 'Report a listing', 'Contact'] },
]

export const SHELL = 'mx-auto w-full max-w-[1240px] px-5 sm:px-10 lg:px-16'
export const EYEBROW = 'font-mono text-xs uppercase tracking-[.16em] text-faint'
export const H2 = 'font-display text-[34px] font-bold leading-[1.0] tracking-[-.038em] text-balance sm:text-5xl lg:text-[58px]'

export function Reveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

// Abstract tile visuals — geometry only, no illustration to maintain.
export const FEATURE_TILES = [
  {
    title: 'Map search',
    copy: "Draw a radius around campus or the office and see only what's actually reachable.",
    art: (
      <div className="relative h-[116px] overflow-hidden rounded-xl border border-ink/12 bg-[#F1EDE3] bg-[linear-gradient(to_right,rgba(21,19,15,.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,19,15,.07)_1px,transparent_1px)] bg-[size:22px_22px]">
        <span className="absolute left-[38%] top-[44%] size-3 rounded-full bg-clay ring-5 ring-clay/20" />
        <span className="absolute left-[64%] top-[28%] size-2 rounded-full bg-forest" />
        <span className="absolute left-[22%] top-[70%] size-2 rounded-full bg-forest" />
        <span className="absolute left-[30%] top-[36%] size-23 animate-pulse-ring rounded-full border border-dashed border-ink/30" />
      </div>
    ),
  },
  {
    title: '3D walkthrough',
    copy: 'Spin the room and read the floor plan before you spend a Saturday on viewings.',
    art: (
      <div className="grid h-[116px] place-items-center overflow-hidden rounded-xl bg-forest">
        <span className="grid size-[78px] place-items-center rounded-xl border-[1.5px] border-lime/75 [transform:rotate(45deg)_skewY(-12deg)]">
          <span className="size-11 rounded-lg border-[1.5px] border-paper/45" />
        </span>
      </div>
    ),
  },
  {
    title: 'Live messaging',
    copy: "Real-time threads attached to the listing, so nothing lives in a stranger's WhatsApp.",
    art: (
      <div className="flex h-[116px] flex-col justify-center gap-2 rounded-xl border border-ink/12 bg-[#F1EDE3] p-3.5">
        <span className="max-w-[78%] self-start rounded-xl rounded-bl-[3px] border border-ink/12 bg-white px-2.5 py-1.5 text-xs text-ink-soft">Is 1 Oct still open?</span>
        <span className="max-w-[78%] self-end rounded-xl rounded-br-[3px] bg-ink px-2.5 py-1.5 text-xs text-paper">Yes — want a call today?</span>
      </div>
    ),
  },
  {
    title: 'Video viewings',
    copy: 'Request a call, get a slot, walk the flat live from another city.',
    art: (
      <div className="grid h-[116px] grid-cols-[2fr_1fr] gap-2 rounded-xl border border-ink/12 bg-[#F1EDE3] p-3">
        <span className="relative rounded-lg bg-ink">
          <span className="absolute bottom-2.5 left-2.5 flex gap-1.5">
            <span className="size-1.5 rounded-full bg-clay" />
            <span className="size-1.5 rounded-full bg-paper/50" />
          </span>
        </span>
        <span className="rounded-lg bg-[#CBC6B8]" />
      </div>
    ),
  },
  {
    title: 'Application tracker',
    copy: 'One shared status for tenant and landlord. No "any update?" messages.',
    art: (
      <div className="flex h-[116px] flex-col justify-center gap-2.5 rounded-xl border border-ink/12 bg-[#F1EDE3] p-3.5">
        <span className="flex items-center gap-2.5 text-[11.5px] text-ink-soft"><span className="size-2.5 rounded-full bg-forest" />Applied</span>
        <span className="flex items-center gap-2.5 text-[11.5px] text-ink-soft"><span className="size-2.5 rounded-full bg-forest" />Shortlisted</span>
        <span className="flex items-center gap-2.5 text-[11.5px] text-faint"><span className="size-2.5 rounded-full border-[1.5px] border-ink/35" />Approved</span>
      </div>
    ),
  },
  {
    title: 'Sign in the browser',
    copy: 'Generate the agreement, sign it on screen, keep the copy in your account.',
    art: (
      <div className="flex h-[116px] flex-col justify-between rounded-xl border border-ink/12 bg-white p-3.5">
        <span className="block h-[5px] w-[70%] rounded bg-ink/12" />
        <span className="block h-[5px] w-[52%] rounded bg-ink/12" />
        <svg viewBox="0 0 120 34" aria-hidden className="h-8 w-27">
          <path d="M4 26c10-18 16 6 24-4s10-14 17-4 12 10 20 2 14-8 26-12" fill="none" stroke="#15130F" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    ),
  },
]
