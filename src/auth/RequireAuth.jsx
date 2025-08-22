import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div style={{ padding: 16 }}>Chargement…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}


