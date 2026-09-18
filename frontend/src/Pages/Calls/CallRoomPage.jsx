import AgoraRTC from 'agora-rtc-sdk-ng'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_BASE_URL

function CallRoomPage() {
  const { callId } = useParams()
  const navigate = useNavigate()
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  // The Agora client and the published tracks outlive renders and must be torn down exactly once.
  const sessionRef = useRef(null)

  const [call, setCall] = useState(null)
  const [status, setStatus] = useState('Joining…')
  const [error, setError] = useState('')
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [hasRemote, setHasRemote] = useState(false)

  useEffect(() => {
    let isCurrent = true

    const leave = async () => {
      const session = sessionRef.current
      sessionRef.current = null

      if (!session) return

      session.tracks.forEach((track) => {
        track.stop()
        track.close()
      })
      await session.client.leave().catch(() => {})
    }

    const join = async () => {
      try {
        const response = await axios.post(`${BASE_URL}/calls/${callId}/token`, {}, { withCredentials: true })
        const credentials = response.data?.data

        if (!response.data?.success || !credentials?.token) {
          throw new Error(response.data?.message || 'Unable to join the call')
        }
        if (!isCurrent) return

        setCall(credentials.call)
        setStatus('Waiting for the other person to join…')

        const isVideo = credentials.call.mode === 'video'
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType)

          if (mediaType === 'video') {
            user.videoTrack.play(remoteRef.current)
            setHasRemote(true)
          } else {
            user.audioTrack.play()
          }

          setStatus('Connected')
        })
        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') setHasRemote(false)
        })
        client.on('user-left', () => {
          setHasRemote(false)
          setStatus('The other person left the call')
        })

        await client.join(credentials.appId, credentials.channel, credentials.token, credentials.uid)

        const tracks = isVideo
          ? await AgoraRTC.createMicrophoneAndCameraTracks()
          : [await AgoraRTC.createMicrophoneAudioTrack()]

        // A teardown that ran while the devices were opening would otherwise leave the camera on.
        if (!isCurrent) {
          tracks.forEach((track) => {
            track.stop()
            track.close()
          })
          await client.leave().catch(() => {})
          return
        }

        sessionRef.current = { client, tracks }
        await client.publish(tracks)

        if (isVideo) tracks[1].play(localRef.current)
      } catch (joinError) {
        if (isCurrent) {
          setError(joinError.response?.data?.message || joinError.message || 'Unable to join the call')
          setStatus('')
        }
        await leave()
      }
    }

    join()

    return () => {
      isCurrent = false
      leave()
    }
  }, [callId])

  const toggleTrack = async (index, isOn, setIsOn) => {
    const track = sessionRef.current?.tracks[index]

    if (!track) return

    await track.setEnabled(!isOn)
    setIsOn(!isOn)
  }

  const isVideoCall = call?.mode === 'video'

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{isVideoCall ? 'Video call' : 'Voice call'}</p>
          <h1 className="text-lg font-semibold">{call?.counterpart?.name || 'Call'}</h1>
        </div>
        <p className="text-sm text-slate-400">{call?.listing?.title || ''}</p>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-5">
        {error && (
          <div className="max-w-md rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-center text-sm text-red-200">
            <p>{error}</p>
            <button type="button" onClick={() => navigate('/calls')} className="mt-3 rounded-md bg-white px-4 py-2 font-semibold text-slate-900">
              Back to calls
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className="relative w-full max-w-3xl">
              <div ref={remoteRef} className="aspect-video w-full overflow-hidden rounded-xl bg-slate-800" />
              {!hasRemote && (
                <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-slate-400">{status}</p>
              )}
              {isVideoCall && (
                <div ref={localRef} className="absolute bottom-3 right-3 h-28 w-40 overflow-hidden rounded-lg border border-slate-700 bg-slate-950" />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => toggleTrack(0, isMicOn, setIsMicOn)}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800"
              >
                {isMicOn ? 'Mute' : 'Unmute'}
              </button>
              {isVideoCall && (
                <button
                  type="button"
                  onClick={() => toggleTrack(1, isCameraOn, setIsCameraOn)}
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800"
                >
                  {isCameraOn ? 'Stop video' : 'Start video'}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/calls')}
                className="rounded-md bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500"
              >
                Leave call
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default CallRoomPage
