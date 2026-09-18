import { useRef, useState } from 'react'

const WIDTH = 600
const HEIGHT = 200

// Plain canvas: a signature is a few strokes, not a reason to pull in a drawing library.
function SignaturePad({ onChange, disabled }) {
  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  const getContext = () => {
    const context = canvasRef.current.getContext('2d')

    context.lineWidth = 2.5
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = '#0f172a'

    return context
  }

  // The bitmap is a fixed size stretched by CSS, so pointer coordinates are scaled back onto it.
  const getPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()

    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    }
  }

  const handlePointerDown = (event) => {
    if (disabled) return

    event.preventDefault()
    canvasRef.current.setPointerCapture(event.pointerId)
    isDrawingRef.current = true

    const { x, y } = getPoint(event)
    const context = getContext()

    context.beginPath()
    context.moveTo(x, y)
  }

  const handlePointerMove = (event) => {
    if (!isDrawingRef.current) return

    const { x, y } = getPoint(event)
    const context = getContext()

    context.lineTo(x, y)
    context.stroke()
  }

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return

    isDrawingRef.current = false
    setHasInk(true)
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  const handleClear = () => {
    getContext().clearRect(0, 0, WIDTH, HEIGHT)
    setHasInk(false)
    onChange('')
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        aria-label="Signature drawing area"
        className={`h-44 w-full touch-none rounded-lg border border-dashed border-slate-400 bg-white ${disabled ? 'opacity-60' : 'cursor-crosshair'}`}
      />
      <div className="mt-2 flex items-center justify-between text-sm">
        <p className="text-slate-500">{hasInk ? 'Signature captured.' : 'Draw your signature inside the box.'}</p>
        <button type="button" onClick={handleClear} disabled={disabled} className="font-semibold text-slate-700 hover:underline disabled:opacity-60">Clear</button>
      </div>
    </div>
  )
}

export default SignaturePad
