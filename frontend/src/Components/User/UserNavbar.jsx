import axios from 'axios'
import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../Context/AuthContext'

const BASE_URL = import.meta.env.VITE_BASE_URL

const LINKS = [
  ['/user', 'Home', true],
  ['/user/listings', 'Listings'],
  ['/saved', 'Saved'],
  ['/buddies', 'BuddyUp'],
  ['/rentals', 'Rentals'],
  ['/messages', 'Messages'],
  ['/calls', 'Calls'],
]

function UserNavbar() {
  const { clearSession } = useAuth()
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

  const linkClass = ({ isActive }) => [
    'rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
    isActive ? 'bg-ink text-[#F7F5EF]' : 'text-ink-soft hover:bg-ink/6 hover:text-ink',
  ].join(' ')

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-[1240px] items-center gap-4 px-5 py-3 sm:px-10 lg:px-16" aria-label="User navigation">
        <NavLink to="/user" className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
          <span className="grid size-6.5 place-items-center rounded-[7px] border-[1.5px] border-ink">
            <span className="size-2 rounded-[2px] bg-clay" />
          </span>
          <span className="font-display text-[19px] font-bold tracking-[-.035em]">LivSync</span>
        </NavLink>

        {/* Seven destinations never fit a phone; scrolling them beats hiding them behind a menu. */}
        <div className="-mx-1 flex flex-1 items-center gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>{label}</NavLink>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <NavLink to="/user/profile" className={linkClass}>Profile</NavLink>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer rounded-full border border-ink/20 px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-ink/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress disabled:opacity-60"
          >
            {isLoggingOut ? 'Logging out' : 'Log out'}
          </button>
        </div>
      </nav>
      {error && <p role="alert" className="mx-auto max-w-[1240px] px-5 pb-3 text-sm text-clay sm:px-10 lg:px-16">{error}</p>}
    </header>
  )
}

export default UserNavbar
