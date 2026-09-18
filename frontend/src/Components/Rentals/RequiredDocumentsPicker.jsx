import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'

const BASE_URL = import.meta.env.VITE_BASE_URL
const ACCEPTED_FILES = '.pdf,image/jpeg,image/png'

function idOf(requirement) {
  return requirement.requirementId || requirement.id || requirement._id
}

function RequiredDocumentsPicker({ requirements = [], selectedDocuments = [], onChange, disabled = false, title = 'Required documents' }) {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(requirements.length))
  const [uploadingRequirement, setUploadingRequirement] = useState('')
  const [error, setError] = useState('')

  const normalizedRequirements = useMemo(() => requirements.map((requirement) => ({ ...requirement, requirementId: idOf(requirement) })).filter((requirement) => requirement.requirementId), [requirements])
  const selection = useMemo(() => Object.fromEntries(selectedDocuments
    .filter((entry) => entry?.requirementId && entry?.documentId)
    .map((entry) => [entry.requirementId, entry.documentId])), [selectedDocuments])

  useEffect(() => {
    if (!normalizedRequirements.length) return undefined

    let isCurrent = true
    axios.get(`${BASE_URL}/tenant-documents`, { withCredentials: true })
      .then((response) => {
        if (!response.data?.success) throw new Error(response.data?.message || 'Unable to load your vault')
        if (isCurrent) setDocuments(response.data.data.documents || [])
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.response?.data?.message || requestError.message || 'Unable to load your vault')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [normalizedRequirements])

  const updateSelection = (requirementId, documentId) => {
    const next = { ...selection, [requirementId]: documentId }
    onChange?.(Object.entries(next).filter(([, id]) => id).map(([selectedRequirementId, selectedDocumentId]) => ({ requirementId: selectedRequirementId, documentId: selectedDocumentId })))
  }

  const uploadForRequirement = async (requirement, file) => {
    if (!file) return

    setError('')
    setUploadingRequirement(requirement.requirementId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('label', requirement.name)
      const response = await axios.post(`${BASE_URL}/tenant-documents`, formData, { withCredentials: true })
      const document = response.data?.data?.document
      if (!response.data?.success || !document) throw new Error(response.data?.message || 'Unable to upload document')

      setDocuments((current) => [document, ...current])
      updateSelection(requirement.requirementId, document.id)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to upload document')
    } finally {
      setUploadingRequirement('')
    }
  }

  if (!normalizedRequirements.length) return null

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600">Select a file already in your vault, or upload it now. Only the selected file is shared with this landlord.</p>
      {isLoading && <p className="mt-3 text-sm text-slate-600">Loading your document vault…</p>}

      {!isLoading && (
        <div className="mt-4 space-y-4">
          {normalizedRequirements.map((requirement) => {
            const isUploading = uploadingRequirement === requirement.requirementId

            return (
              <div key={requirement.requirementId} className="rounded-md border border-slate-200 bg-white p-3">
                <label className="block text-xs font-semibold text-slate-700">
                  {requirement.name}
                  <select value={selection[requirement.requirementId] || ''} onChange={(event) => updateSelection(requirement.requirementId, event.target.value)} disabled={disabled || isUploading} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-slate-700 disabled:bg-slate-100">
                    <option value="">Choose a vault document</option>
                    {documents.map((document) => {
                      const selectedElsewhere = Object.entries(selection).some(([otherRequirement, selectedDocumentId]) => otherRequirement !== requirement.requirementId && selectedDocumentId === document.id)
                      return <option key={document.id} value={document.id} disabled={selectedElsewhere}>{document.label} — {document.originalName}</option>
                    })}
                  </select>
                </label>
                <label className="mt-2 block text-xs font-medium text-slate-600">
                  Or upload {requirement.name} now <span className="font-normal">(PDF, JPEG, PNG; max 10 MB)</span>
                  <input type="file" accept={ACCEPTED_FILES} onChange={(event) => uploadForRequirement(requirement, event.target.files?.[0])} disabled={disabled || isUploading} className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-300 disabled:opacity-60" />
                </label>
                {isUploading && <p className="mt-2 text-xs text-slate-500">Uploading to your vault…</p>}
              </div>
            )
          })}
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  )
}

export default RequiredDocumentsPicker
