import { Link } from 'react-router-dom'
import Navbar from '../../Components/Common/Navbar'

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto flex max-w-5xl flex-col px-5 py-20 sm:py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Simple rental connections</p>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Find a home or manage your rentals in one place.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
          LivSync brings tenants and landlords together with straightforward account tools.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
            Create an account
          </Link>
          <Link to="/login" className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Log in
          </Link>
        </div>
      </main>
    </div>
  )
}

export default LandingPage
