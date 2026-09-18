import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import VerifiedBadge from '../../Components/Common/VerifiedBadge'
import { useAuth } from '../../Context/AuthContext'

const BASE_URL = import.meta.env.VITE_BASE_URL

function UserHomePage() {
  const navigate = useNavigate()
  const { clearSession } = useAuth()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    const loadProfile = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await axios.get(`${BASE_URL}/auth/profile`, { withCredentials: true })
        const profile = response.data?.data?.user

        if (!response.data?.success || !profile) {
          throw new Error(response.data?.message || 'Unable to load your profile')
        }

        if (isCurrent) setUser(profile)
      } catch (requestError) {
        if (!isCurrent) return

        if (requestError.response?.status === 401) {
          clearSession()
          navigate('/login', { replace: true })
          return
        }

        setError(requestError.response?.data?.message || requestError.message || 'Unable to load your profile')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadProfile()

    return () => {
      isCurrent = false
    }
  }, [clearSession, navigate, retryKey])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <UserNavbar />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-medium text-slate-500">Tenant dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your profile</h1>

        {isLoading && <p className="mt-8 text-slate-600">Loading your profile…</p>}

        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-3 font-semibold underline">Try again</button>
          </div>
        )}

        {user && !isLoading && !error && !user.emailVerified && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p>Your email is not verified yet. Verified tenants stand out to landlords and BuddyUp matches.</p>
            <button type="button" onClick={() => navigate('/verify-email')} className="rounded-md bg-amber-600 px-3 py-2 font-semibold text-white hover:bg-amber-700">Verify email</button>
          </div>
        )}

        {user && !isLoading && !error && (
          <section id="profile" className="mt-8 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Personal details</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div><dt className="text-sm text-slate-500">Name</dt><dd className="mt-1 font-medium">{user.name}</dd></div>
              <div>
                <dt className="text-sm text-slate-500">Email</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 font-medium">
                  {user.email}
                  <VerifiedBadge verified={user.emailVerified} unverifiedLabel="Not verified" />
                </dd>
              </div>
              <div><dt className="text-sm text-slate-500">Phone</dt><dd className="mt-1 font-medium">{user.phone}</dd></div>
              <div><dt className="text-sm text-slate-500">Date of birth</dt><dd className="mt-1 font-medium">{user.dob ? new Date(user.dob).toLocaleDateString() : '—'}</dd></div>
              <div><dt className="text-sm text-slate-500">Gender</dt><dd className="mt-1 font-medium capitalize">{user.gender?.replaceAll('-', ' ') || '—'}</dd></div>
            </dl>
          </section>
        )}
      </main>
    </div>
  )
}

export default UserHomePage
