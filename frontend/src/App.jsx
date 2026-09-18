import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './Context/AuthContext'
import LandingPage from './Pages/Common/LandingPage'
import LoginPage from './Pages/Common/LoginPage'
import RegisterPage from './Pages/Common/RegisterPage'
import LandlordHomePage from './Pages/Landlord/LandlordHomePage'
import UserHomePage from './Pages/User/UserHomePage'

function RoleRoute({ role, children }) {
  const { role: currentRole } = useAuth()

  return currentRole === role ? children : <Navigate to="/login" replace />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
