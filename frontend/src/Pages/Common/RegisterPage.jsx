import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../Components/Common/Navbar'
import { useAuth } from '../../Context/AuthContext'

const BASE_URL = import.meta.env.VITE_BASE_URL
const PROPERTY_TYPES = ['apartment', 'house', 'room', 'commercial']

function RegisterPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [accountType, setAccountType] = useState('user')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: 'prefer-not-to-say',
    password: '',
    businessType: 'individual',
    companyName: '',
    address: '',
    city: '',
    propertyTypes: [],
    profileDescription: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const togglePropertyType = (event) => {
    const { value, checked } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      propertyTypes: checked
        ? [...currentForm.propertyTypes, value]
        : currentForm.propertyTypes.filter((type) => type !== value),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const isLandlord = accountType === 'landlord'
    const endpoint = isLandlord ? '/landlord/register' : '/auth/register'
    const payload = isLandlord
      ? {
          name: form.name,
          phone: form.phone,
          email: form.email,
          password: form.password,
          businessType: form.businessType,
          companyName: form.companyName,
          address: form.address,
          city: form.city,
          propertyTypes: form.propertyTypes,
          profileDescription: form.profileDescription,
        }
      : {
          name: form.name,
          phone: form.phone,
          email: form.email,
          dob: form.dob,
          gender: form.gender,
          password: form.password,
          role: 'tenant',
        }

    try {
      const response = await axios.post(`${BASE_URL}${endpoint}`, payload, { withCredentials: true })
      const account = isLandlord ? response.data?.data?.landlord : response.data?.data?.user

      if (!response.data?.success || !account) {
        throw new Error(response.data?.message || 'Unable to create your account')
      }

      setSession({
        role: accountType,
        token: response.data?.data?.token || null,
        phone: account.phone,
      })
      // The code is already in their inbox, so the verification step comes before anything else.
      navigate('/verify-email', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to create your account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLandlord = accountType === 'landlord'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-5 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600">Set up the account that best fits you.</p>

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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="name">
                Full name
                <input id="name" name="name" value={form.name} onChange={handleChange} autoComplete="name" required minLength="2" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
              </label>
              <label className="block text-sm font-medium text-slate-700" htmlFor="phone">
                Phone number
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} autoComplete="tel" required className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                Email
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
              </label>
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                Password
                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" required minLength="8" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
              </label>
            </div>

            {isLandlord ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="businessType">
                    Account type
                    <select id="businessType" name="businessType" value={form.businessType} onChange={handleChange} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-slate-700">
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="companyName">
                    Company name {form.businessType === 'company' ? '' : '(optional)'}
                    <input id="companyName" name="companyName" value={form.companyName} onChange={handleChange} required={form.businessType === 'company'} className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="address">
                    Address
                    <input id="address" name="address" value={form.address} onChange={handleChange} required minLength="5" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="city">
                    City
                    <input id="city" name="city" value={form.city} onChange={handleChange} required minLength="2" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
                  </label>
                </div>
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700">Property types</legend>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    {PROPERTY_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm capitalize text-slate-600">
                        <input type="checkbox" value={type} checked={form.propertyTypes.includes(type)} onChange={togglePropertyType} className="size-4 accent-slate-900" />
                        {type}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="block text-sm font-medium text-slate-700" htmlFor="profileDescription">
                  Profile description <span className="font-normal text-slate-500">(optional)</span>
                  <textarea id="profileDescription" name="profileDescription" value={form.profileDescription} onChange={handleChange} rows="3" maxLength="500" className="mt-1.5 w-full resize-y rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
                </label>
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700" htmlFor="dob">
                  Date of birth
                  <input id="dob" name="dob" type="date" value={form.dob} onChange={handleChange} required className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-700" />
                </label>
                <label className="block text-sm font-medium text-slate-700" htmlFor="gender">
                  Gender
                  <select id="gender" name="gender" value={form.gender} onChange={handleChange} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-slate-700">
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
            )}

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Creating account…' : `Create ${accountType} account`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered? <Link to="/login" className="font-semibold text-slate-900 hover:underline">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default RegisterPage
