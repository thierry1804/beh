import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import SessionsPage from './pages/Sessions.jsx'
import CapturePage from './pages/Capture.jsx'
import PendingPage from './pages/Pending.jsx'
import CustomerPage from './pages/Customer.jsx'
import CustomersPage from './pages/Customers.jsx'
import LoginPage from './pages/Login.jsx'
import ProfilePage from './pages/Profile.jsx'
import { AuthProvider } from './auth/AuthProvider.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import RequireRole from './auth/RequireRole.jsx'
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
                <Route index element={
                  <RequireRole adminOnly={true} fallbackPath="/capture">
                    <Dashboard />
                  </RequireRole>
                } />
                <Route path="/dashboard" element={
                  <RequireRole adminOnly={true}>
                    <Dashboard />
                  </RequireRole>
                } />
                <Route path="/sessions" element={
                  <RequireRole adminOnly={true}>
                    <SessionsPage />
                  </RequireRole>
                } />
                <Route path="/capture" element={
                  <RequireRole adminOnly={false} operatorAllowed={true}>
                    <CapturePage />
                  </RequireRole>
                } />
                <Route path="/pending" element={
                  <RequireRole adminOnly={false} operatorAllowed={true}>
                    <PendingPage />
                  </RequireRole>
                } />
                <Route path="/customers" element={
                  <RequireRole adminOnly={true}>
                    <CustomersPage />
                  </RequireRole>
                } />
                <Route path="/customer/:handle" element={
                  <RequireRole adminOnly={true}>
                    <CustomerPage />
                  </RequireRole>
                } />
                <Route path="/profile" element={
                  <RequireRole adminOnly={false} operatorAllowed={true}>
                    <ProfilePage />
                  </RequireRole>
                } />
                <Route path="/prep" element={
                  <RequireRole adminOnly={false} operatorAllowed={true}>
                    <div style={{ padding: 16 }}>À venir</div>
                  </RequireRole>
                } />
                <Route path="/delivery" element={
                  <RequireRole adminOnly={true}>
                    <div style={{ padding: 16 }}>À venir</div>
                  </RequireRole>
                } />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProviderWithToggle>
  </StrictMode>,
)
