import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../Components/Common/Navbar'
import { useAuth } from '../../Context/AuthContext'

const BASE_URL = import.meta.env.VITE_BASE_URL

function LoginPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [accountType, setAccountType] = useState('user')
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const endpoint = accountType === 'landlord' ? '/landlord/login' : '/auth/login'
      const response = await axios.post(`${BASE_URL}${endpoint}`, form, { withCredentials: true })
      const account = accountType === 'landlord' ? response.data?.data?.landlord : response.data?.data?.user

      if (!response.data?.success || !account) {
        throw new Error(response.data?.message || 'Unable to log in')
      }

      setSession({
        role: accountType,
        token: response.data?.data?.token || null,
        phone: account.phone,
      })
      // A landlord signs once; every rental agreement is stamped with it, so collect it up front.
      if (accountType === 'landlord') {
        navigate(account.hasSignature ? '/landlord' : '/landlord/signature', { replace: true })
        return
      }

      navigate('/user', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to log in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-md px-5 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Choose your account type and enter your details.</p>

          <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1" aria-label="Account type">
            {['user', 'landlord'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`rounded-md px-3 py-2 text-sm font-medium capitalize ${accountType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                aria-pressed={accountType === type}
              >
                {type}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="identifier">
              Email or phone number
              <input
                id="identifier"
                name="identifier"
                type="text"
                value={form.identifier}
                onChange={handleChange}
                autoComplete="username"
                inputMode="email"
                required
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700"
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Logging in…' : `Log in as ${accountType}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to LivSync? <Link to="/register" className="font-semibold text-slate-900 hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
