import VerifiedBadge from '../Common/VerifiedBadge'

// LivSync's argument, turned on the person signing up: a profile with blanks in it is not a profile.
// Every field the form asks for is drawn here as it is answered, so nothing arrives hidden.
function ProfileCard({ accountType, form }) {
  const isLandlord = accountType === 'landlord'
  const dob = form.dob
    ? new Date(`${form.dob}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  const rows = isLandlord
    ? [
        { label: 'Phone', value: form.phone },
        { label: 'Email', value: form.email },
        { label: 'Password', value: form.password && '•'.repeat(Math.min(form.password.length, 12)) },
        { label: 'Address', value: form.address },
        { label: 'City', value: form.city },
      ]
    : [
        { label: 'Phone', value: form.phone },
        { label: 'Email', value: form.email },
        { label: 'Password', value: form.password && '•'.repeat(Math.min(form.password.length, 12)) },
        { label: 'Date of birth', value: dob },
      ]

  const declarable = [form.name, ...rows.map((row) => row.value)]
  const declared = declarable.filter(Boolean).length
  const complete = declared === declarable.length

  return (
    <div aria-hidden className="relative min-w-0 select-none">
      <div className="absolute -right-4 left-6 -bottom-6 top-6 rounded-[22px] border border-paper/20" />
      <article className="relative rounded-[22px] border border-ink/15 bg-card p-5 shadow-[0_50px_80px_-46px_rgba(0,0,0,.85)] sm:p-6.5">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[.14em] text-faint">
            {isLandlord ? 'Landlord profile' : 'Tenant profile'}
          </p>
          <VerifiedBadge verified={false} unverifiedLabel="Verification pending" size="xs" />
        </div>

        <div className="mt-4 min-h-14">
          {form.name ? (
            <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-.035em] break-words">{form.name}</h2>
          ) : (
            <span className="mt-4 block w-[62%] border-b-2 border-dashed border-ink/25" />
          )}
          {isLandlord && form.businessType === 'company' && form.companyName ? (
            <p className="mt-1.5 text-[14px] text-muted">{form.companyName}</p>
          ) : null}
        </div>

        <dl className="mt-3 grid border-t border-ink/12">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 border-b border-ink/12 py-3">
              <dt className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-faint">
                <span className={`size-1.5 rounded-full transition-colors ${row.value ? 'bg-forest' : 'bg-clay/45'}`} />
                {row.label}
              </dt>
              <dd className="min-w-0 truncate text-[14px] text-ink">
                {row.value || <span className="block w-22 border-b-2 border-dashed border-ink/25" />}
              </dd>
            </div>
          ))}
        </dl>

        {isLandlord && (
          <div className="mt-4 min-h-12">
            <p className="font-mono text-[11px] uppercase tracking-[.12em] text-faint">Lists</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.propertyTypes.length ? (
                form.propertyTypes.map((type) => (
                  <span key={type} className="rounded-full border border-ink/18 bg-ink/4 px-2.5 py-1 text-[12px] capitalize text-ink-soft">{type}</span>
                ))
              ) : (
                <span className="rounded-full border border-dashed border-ink/25 px-2.5 py-1 text-[12px] text-faint">Nothing selected yet</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-ink/12 pt-4">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[.12em] text-faint">
            <span>{complete ? 'Ready to create' : 'Still blank'}</span>
            <span className={complete ? 'text-forest' : 'text-clay'}>{declared}/{declarable.length}</span>
          </div>
          <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-ink/10">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-500 motion-reduce:transition-none ${complete ? 'bg-forest' : 'bg-clay'}`}
              style={{ width: `${(declared / declarable.length) * 100}%` }}
            />
          </div>
        </div>
      </article>
    </div>
  )
}

export default ProfileCard
