const STAGE_STYLES = {
  complete: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  current: 'border-slate-900 bg-slate-900 text-white',
  upcoming: 'border-slate-200 bg-slate-50 text-slate-500',
  unavailable: 'border-slate-200 bg-slate-50 text-slate-400',
  rejected: 'border-red-200 bg-red-50 text-red-700',
}

function stageState(status, index) {
  if (status === 'rejected') {
    if (index < 2) return 'complete'
    if (index === 2) return 'rejected'
    return 'unavailable'
  }

  if (status === 'pending') {
    if (index === 0) return 'complete'
    if (index === 1) return 'current'
    return 'upcoming'
  }

  if (status === 'accepted') {
    if (index < 3) return 'complete'
    if (index === 3) return 'current'
    return 'upcoming'
  }

  if (status === 'paid') return index < 4 ? 'complete' : 'current'

  return 'upcoming'
}

function stageDetails(rental) {
  const rejected = rental.status === 'rejected'

  return [
    { title: 'Submitted', detail: 'Application sent' },
    { title: 'Under review', detail: rental.status === 'pending' ? 'Awaiting landlord' : 'Review complete' },
    {
      title: rejected ? 'Rejected' : 'Approved',
      detail: rejected ? 'Application closed' : rental.status === 'pending' ? 'Decision pending' : 'Terms confirmed',
    },
    { title: 'Payment pending', detail: rental.status === 'accepted' ? 'Awaiting payment' : rental.status === 'paid' ? 'Payment settled' : 'Opens after approval' },
    { title: 'Agreement ready', detail: rental.status === 'paid' ? 'Ready to download' : 'Issued after payment' },
  ]
}

function ApplicationTracker({ rental }) {
  const stages = stageDetails(rental)

  return (
    <section className="mt-5 border-t border-slate-200 pt-4" aria-labelledby={`application-progress-${rental.id}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 id={`application-progress-${rental.id}`} className="text-sm font-semibold text-slate-800">Application progress</h3>
        <span className="text-xs text-slate-500">{rental.status === 'paid' ? 'Complete' : 'Live status'}</span>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-5">
        {stages.map((stage, index) => {
          const state = stageState(rental.status, index)

          return (
            <li key={stage.title} className={`rounded-lg border p-3 ${STAGE_STYLES[state]}`} aria-current={state === 'current' || state === 'rejected' ? 'step' : undefined}>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">{state === 'complete' ? '✓' : index + 1}</span>
                <p className="text-xs font-semibold leading-tight">{stage.title}</p>
              </div>
              <p className="mt-2 text-xs leading-tight opacity-80">{stage.detail}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default ApplicationTracker
