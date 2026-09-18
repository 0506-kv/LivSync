import VerifiedBadge from '../Common/VerifiedBadge'
const labelOf = (value) => String(value || '').replaceAll('-', ' ')

function formatBudget(budget) {
  if (!budget?.min && !budget?.max) return 'Not set'

  return `₹${new Intl.NumberFormat('en-IN').format(budget.min || 0)} – ₹${new Intl.NumberFormat('en-IN').format(budget.max || 0)}`
}

function Trait({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium capitalize">{value}</dd>
    </div>
  )
}

// One profile from the deck. The parent keeps the deck order, this only reports the swipe.
function BuddyCard({ profile, onSwipe, isBusy }) {
  const preferences = profile.preferences || {}

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{profile.name}</h2>
            <VerifiedBadge verified={profile.emailVerified} label="Verified" size="xs" />
          </div>
          <p className="mt-1 text-sm text-slate-500 capitalize">
            {[profile.age && `${profile.age}`, labelOf(profile.gender), preferences.occupation].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-center text-white">
          <p className="text-2xl font-semibold leading-none">{profile.score}%</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-300">match</p>
        </div>
      </div>

      {preferences.bio && <p className="mt-4 text-sm leading-6 text-slate-700">{preferences.bio}</p>}

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
        <Trait label="Budget" value={formatBudget(preferences.budget)} />
        <Trait label="City" value={preferences.city || 'Anywhere'} />
        <Trait label="Sleep" value={labelOf(preferences.sleepSchedule)} />
        <Trait label="Schedule" value={labelOf(preferences.workSchedule)} />
        <Trait label="Cleanliness" value={`${preferences.cleanliness}/5`} />
        <Trait label="Noise" value={`${preferences.noiseTolerance}/5`} />
        <Trait label="Food" value={labelOf(preferences.foodHabits)} />
        <Trait label="Smoking" value={labelOf(preferences.smoking)} />
        <Trait label="Drinking" value={labelOf(preferences.drinking)} />
        <Trait label="Pets" value={labelOf(preferences.pets)} />
        <Trait label="Guests" value={labelOf(preferences.guests)} />
        <Trait label="Move in" value={preferences.moveInDate ? new Date(preferences.moveInDate).toLocaleDateString() : 'Flexible'} />
      </dl>

      {preferences.interests?.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {preferences.interests.map((interest) => (
            <li key={interest} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{interest}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex gap-3 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => onSwipe('pass')}
          disabled={isBusy}
          className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => onSwipe('like')}
          disabled={isBusy}
          className="flex-1 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          Buddy up
        </button>
      </div>
    </article>
  )
}

export default BuddyCard
