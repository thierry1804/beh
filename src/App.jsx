import './App.css'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { useTranslation } from 'react-i18next'

export default function App() {
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  return (
    <div>
      <TopNav />
      <main className="page container">
        <Outlet />
      </main>
      <footer className="container" style={{ margin: '12px auto', color: '#9aa3b2', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
        <div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <span style={{ marginRight: 8 }}>{user.email}</span>
              <button className="btn" onClick={signOut}>{t('auth.logout')}</button>
            </>
          ) : null}
        </div>
      </footer>
    </div>
  )
}

function TopNav() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const item = (to, label) => (
    <NavLink to={to} className={({ isActive }) => `pill${isActive ? ' pill--active' : ''}`}>{label}</NavLink>
  )
  return (
    <header className="topnav">
      <div className="topnav__wrap">
        <Link to="/" className="brand">BEH</Link>
        <nav className="nav">
          {item('/sessions', t('navigation.sessions'))}
          {item('/capture', t('navigation.capture'))}
          {item('/pending', t('navigation.pending'))}
          {item('/customers', t('navigation.customers'))}
          {item('/prep', t('navigation.prep'))}
          {item('/delivery', t('navigation.delivery'))}
          {item('/dashboard', t('navigation.dashboard'))}
        </nav>
      </div>
    </header>
  )
}

