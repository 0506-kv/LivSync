import { Bookmark } from 'lucide-react'

function SaveListingButton({ saved, onToggle, isSaving, variant = 'button', className = '' }) {
  const label = saved ? 'Remove from saved homes' : 'Save this home'

  // The icon shape rides on top of a listing photo; the labelled shape sits in page flow.
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={isSaving}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={`grid size-9.5 cursor-pointer place-items-center rounded-full border backdrop-blur-sm transition-all hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress disabled:opacity-70 ${saved ? 'border-ink bg-ink text-[#F7F5EF]' : 'border-ink/15 bg-card/85 text-ink hover:border-ink/45'} ${className}`}
      >
        <Bookmark aria-hidden className={`size-[17px] ${saved ? 'fill-current' : ''}`} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isSaving}
      aria-pressed={saved}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress disabled:opacity-70 ${saved ? 'border-ink bg-ink text-[#F7F5EF] hover:bg-ink-soft' : 'border-ink/20 text-ink hover:bg-ink/6'} ${className}`}
    >
      <Bookmark aria-hidden className={`size-4 ${saved ? 'fill-current' : ''}`} />
      {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save home'}
    </button>
  )
}

export default SaveListingButton
