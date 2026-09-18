import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import VerifiedBadge from '../Common/VerifiedBadge'

const inr = (value) => `₹${new Intl.NumberFormat('en-IN').format(value)}`

// Illustrative profiles; swap for /matches/compatibility results when the API lands.
const PROFILES = [
  {
    name: 'Ananya R.', age: 24, gender: 'female', occupation: 'UX designer', score: 92,
    bio: 'Quiet on weeknights, cooks a lot on Sundays. Looking for a 2 BHK in west Pune with someone tidy.',
    budget: [9000, 14000], city: 'Pune', sleep: 'early bird', cleanliness: 5, noise: 2,
    food: 'vegetarian', smoking: 'never', pets: 'ok with pets', guests: 'rarely',
    interests: ['Filter coffee', 'Badminton', 'Studio pottery'],
  },
  {
    name: 'Dev M.', age: 27, gender: 'male', occupation: 'Backend engineer', score: 84,
    bio: 'On calls till late, out most weekends. Happy to take the smaller room if the desk fits.',
    budget: [12000, 18000], city: 'Pune', sleep: 'night owl', cleanliness: 4, noise: 3,
    food: 'eats everything', smoking: 'never', pets: 'no pets', guests: 'sometimes',
    interests: ['Trail running', 'Board games', 'Vinyl'],
  },
  {
    name: 'Meera K.', age: 22, gender: 'female', occupation: 'PG student', score: 77,
    bio: 'First flat after the hostel. Wants a roommate who is fine with a study desk in the living room.',
    budget: [7000, 11000], city: 'Pune', sleep: 'flexible', cleanliness: 4, noise: 2,
    food: 'vegetarian', smoking: 'never', pets: 'allergic', guests: 'rarely',
    interests: ['Carnatic music', 'Cycling', 'Chess'],
  },
]

function Trait({ label, value }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">{label}</dt>
      <dd className="mt-1 text-[13.5px] font-medium">{value}</dd>
    </div>
  )
}

function BuddyDeck() {
  const [idx, setIdx] = useState(0)
  const [direction, setDirection] = useState(1)
  const profile = PROFILES[idx % PROFILES.length]

  const swipe = (dir) => {
    setDirection(dir)
    setIdx((current) => current + 1)
  }

  return (
    <div className="relative w-full max-w-[420px] min-h-[500px]">
      <div aria-hidden className="absolute -bottom-2.5 left-4.5 right-4.5 top-8 rounded-[26px] border border-paper/10 bg-paper/7" />
      <div aria-hidden className="absolute bottom-1.5 left-2 right-2 top-4 rounded-[26px] border border-paper/15 bg-paper/10" />

      <AnimatePresence initial={false} mode="popLayout">
        <motion.article
          key={idx}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={(event, info) => {
            if (Math.abs(info.offset.x) > 110) swipe(info.offset.x > 0 ? 1 : -1)
          }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
          exit={{ x: direction * 620, rotate: direction * 10, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="relative z-10 mb-6 flex min-h-[476px] cursor-grab touch-none flex-col rounded-[26px] bg-[#FBF9F4] p-6 text-ink shadow-[0_40px_70px_-40px_rgba(0,0,0,.7)] active:cursor-grabbing"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-[27px] font-bold tracking-[-.035em]">{profile.name}</h3>
                <VerifiedBadge verified label="Verified" size="xs" />
              </div>
              <p className="mt-1.5 text-[13.5px] text-faint">
                {profile.age} · {profile.gender} · {profile.occupation}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-forest px-4 py-3 text-center">
              <p className="font-display text-[26px] font-bold leading-none text-lime">{profile.score}%</p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-forest-mute">match</p>
            </div>
          </div>

          <p className="mt-4.5 text-[14.5px] leading-relaxed text-ink-soft">{profile.bio}</p>

          <dl className="mt-5 grid grid-cols-3 gap-x-3 gap-y-4 border-t border-ink/15 pt-4.5">
            <Trait label="Budget" value={`${inr(profile.budget[0])}–${inr(profile.budget[1])}`} />
            <Trait label="City" value={profile.city} />
            <Trait label="Sleep" value={profile.sleep} />
            <Trait label="Cleanliness" value={`${profile.cleanliness}/5`} />
            <Trait label="Noise" value={`${profile.noise}/5`} />
            <Trait label="Food" value={profile.food} />
            <Trait label="Smoking" value={profile.smoking} />
            <Trait label="Pets" value={profile.pets} />
            <Trait label="Guests" value={profile.guests} />
          </dl>

          <ul className="mt-4.5 flex flex-wrap gap-1.5">
            {profile.interests.map((interest) => (
              <li key={interest} className="rounded-full bg-ink/7 px-2.5 py-1 text-xs text-ink-soft">{interest}</li>
            ))}
          </ul>

          <div className="mt-auto grid grid-cols-2 gap-2.5 pt-5">
            <button
              type="button"
              onClick={() => swipe(-1)}
              className="cursor-pointer rounded-full border border-ink/20 px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/6"
            >
              Pass
            </button>
            <button
              type="button"
              onClick={() => swipe(1)}
              className="cursor-pointer rounded-full bg-forest px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-forest-deep"
            >
              Buddy up
            </button>
          </div>
        </motion.article>
      </AnimatePresence>

      <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-1.5">
        {PROFILES.map((item, i) => (
          <span
            key={item.name}
            className={`size-1.5 rounded-full transition-colors ${i === idx % PROFILES.length ? 'bg-lime' : 'bg-paper/30'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default BuddyDeck
