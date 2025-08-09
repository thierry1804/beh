import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import App from './App.jsx'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import SessionsPage from './pages/Sessions.jsx'
import CapturePage from './pages/Capture.jsx'
import PendingPage from './pages/Pending.jsx'
import CustomerPage from './pages/Customer.jsx'
import LoginPage from './pages/Login.jsx'
import { AuthProvider } from './auth/AuthProvider.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import ThemeProviderWithToggle from './theme/ThemeProviderWithToggle.jsx'
import DashboardLayout from './layout/DashboardLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProviderWithToggle>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Navigate to="/capture" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/capture" element={<CapturePage />} />
                <Route path="/pending" element={<PendingPage />} />
                <Route path="/customer/:handle" element={<CustomerPage />} />
                <Route path="/prep" element={<div style={{ padding: 16 }}>À venir</div>} />
                <Route path="/delivery" element={<div style={{ padding: 16 }}>À venir</div>} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProviderWithToggle>
  </StrictMode>,
)
