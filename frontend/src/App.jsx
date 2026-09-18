import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './Context/AuthContext'
import LandingPage from './Pages/Common/LandingPage'
import LoginPage from './Pages/Common/LoginPage'
import RegisterPage from './Pages/Common/RegisterPage'
import LandlordHomePage from './Pages/Landlord/LandlordHomePage'
import LandlordSignaturePage from './Pages/Landlord/LandlordSignaturePage'
import LandlordListingsPage from './Pages/Listings/LandlordListingsPage'
import ListingDetailPage from './Pages/Listings/ListingDetailPage'
import MessagesPage from './Pages/Messages/MessagesPage'
import RentalsPage from './Pages/Rentals/RentalsPage'
import UserListingsPage from './Pages/Listings/UserListingsPage'
import UserHomePage from './Pages/User/UserHomePage'

function RoleRoute({ role, children }) {
  const { role: currentRole } = useAuth()

  return [].concat(role).includes(currentRole) ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/user"
        element={(
          <RoleRoute role="user">
            <UserHomePage />
          </RoleRoute>
        )}
      />
      <Route
        path="/landlord"
        element={(
          <RoleRoute role="landlord">
            <LandlordHomePage />
          </RoleRoute>
        )}
      />
      <Route
        path="/landlord/signature"
        element={(
          <RoleRoute role="landlord">
            <LandlordSignaturePage />
          </RoleRoute>
        )}
      />
      <Route
        path="/landlord/listings"
        element={(
          <RoleRoute role="landlord">
            <LandlordListingsPage />
          </RoleRoute>
        )}
      />
      <Route
        path="/user/listings"
        element={(
          <RoleRoute role="user">
            <UserListingsPage />
          </RoleRoute>
        )}
      />
      <Route
        path="/listings/:listingId"
        element={(
          <RoleRoute role="user">
            <ListingDetailPage />
          </RoleRoute>
        )}
      />
      <Route
        path="/messages"
        element={(
          <RoleRoute role={['user', 'landlord']}>
            <MessagesPage />
          </RoleRoute>
        )}
      />
      <Route
        path="/rentals"
        element={(
          <RoleRoute role={['user', 'landlord']}>
            <RentalsPage />
          </RoleRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
