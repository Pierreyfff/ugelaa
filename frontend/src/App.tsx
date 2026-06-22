import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useEffect, useCallback } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
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

const TaskContext = createContext<{ isProcessing: string | null; setProcessing: (task: string | null) => void }>({
  isProcessing: null,
  setProcessing: () => {}
})

export const useTask = () => useContext(TaskContext)

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

  const [isProcessing, setProcessingState] = useState<string | null>(null)
  const setProcessing = useCallback((task: string | null) => {
    setProcessingState(task)
    if (task) {
      window.onbeforeunload = (e) => {
        e.preventDefault()
        e.returnValue = 'Hay un proceso en ejecución. ¿Está seguro de salir?'
        return 'Hay un proceso en ejecución. ¿Está seguro de salir?'
      }
    } else {
      window.onbeforeunload = null
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <TaskContext.Provider value={{ isProcessing, setProcessing }}>
      <Routes>
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="planillas" element={<Planillas />} />
          <Route path="importar" element={<Importar />} />
          <Route path="exportar" element={<Exportar />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </TaskContext.Provider>
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