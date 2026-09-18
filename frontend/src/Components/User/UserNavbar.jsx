import axios from 'axios'
import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../Context/AuthContext'

const BASE_URL = import.meta.env.VITE_BASE_URL

function UserNavbar() {
  const { clearSession, phone } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = async () => {
    setError('')
    setIsLoggingOut(true)

    try {
      const response = await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true })

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to log out')
      }

      clearSession()
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to log out')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4" aria-label="User navigation">
        <NavLink to="/user" className="text-lg font-semibold tracking-tight text-slate-900">LivSync</NavLink>
        <div className="flex items-center gap-4 text-sm font-medium">
          <NavLink to="/user" end className="text-slate-600 hover:text-slate-900">Home</NavLink>
          <a href="#profile" className="text-slate-600 hover:text-slate-900">Profile</a>
          <span className="hidden text-slate-500 sm:inline">{phone}</span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </nav>
      {error && <p className="mx-auto max-w-5xl px-5 pb-3 text-sm text-red-600">{error}</p>}
    </header>
  )
}

export default UserNavbar
