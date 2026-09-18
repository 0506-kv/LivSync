import { useEffect, useRef, useState } from 'react'

const BASE_URL = import.meta.env.VITE_BASE_URL

function ListingModel({ listingId, title }) {
  const viewerRef = useRef(null)
  // model-viewer is a heavy bundle, so it is only pulled in on listings that actually have a model.
  const [isViewerLoaded, setIsViewerLoaded] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    import('@google/model-viewer')
      .then(() => isCurrent && setIsViewerLoaded(true))
      .catch(() => isCurrent && setError('Unable to load the 3D viewer'))

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return undefined

    const handleLoad = () => setIsModelLoaded(true)
    const handleError = () => setError('This 3D model could not be loaded. The file may no longer be shared publicly.')

    viewer.addEventListener('load', handleLoad)
    viewer.addEventListener('error', handleError)

    return () => {
      viewer.removeEventListener('load', handleLoad)
      viewer.removeEventListener('error', handleError)
    }
  }, [isViewerLoaded])

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">3D tour</h2>
        {isModelLoaded && <p className="text-sm text-slate-500">Drag to rotate · scroll to zoom</p>}
      </div>

      <div className="relative mt-4 h-96 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {isViewerLoaded && !error && (
          <model-viewer
            ref={viewerRef}
            src={`${BASE_URL}/listings/${listingId}/model`}
            alt={`3D model of ${title}`}
            camera-controls=""
            auto-rotate=""
            touch-action="pan-y"
            shadow-intensity="1"
            style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9' }}
          />
        )}
        {!error && !isModelLoaded && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Loading 3D model…</p>
        )}
        {error && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    </section>
  )
}

export default ListingModel
