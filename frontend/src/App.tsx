import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Personal from './pages/Personal'
import Planillas from './pages/Planillas'
import Importar from './pages/Importar'
import Exportar from './pages/Exportar'
import Auth from './pages/Auth'

const AuthContext = createContext<{ isAuthenticated: boolean; login: () => void; logout: () => void }>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
})

export const useAuth = () => useContext(AuthContext)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }
  return <>{children}</>
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark'
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const login = () => {
    setIsAuthenticated(true)
    localStorage.setItem('isAuthenticated', 'true')
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.setItem('isAuthenticated', 'false')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <Routes>
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="personal" element={<Personal />} />
          <Route path="planillas" element={<Planillas />} />
          <Route path="importar" element={<Importar />} />
          <Route path="exportar" element={<Exportar />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App