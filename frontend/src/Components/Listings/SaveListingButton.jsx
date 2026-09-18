function SaveListingButton({ saved, onToggle, isSaving, className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isSaving}
      aria-pressed={saved}
      className={`rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${saved ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'} ${className}`}
    >
      {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save home'}
    </button>
  )
}

export default SaveListingButton
