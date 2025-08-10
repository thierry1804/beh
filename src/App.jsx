import './App.css'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'

export default function App() {
  const { user, signOut } = useAuth()
  return (
    <div>
      <TopNav />
      <main className="page container">
        <Outlet />
      </main>
      <footer className="container" style={{ margin: '12px auto', color: '#9aa3b2', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
        <div></div>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: 8 }}>{user.email}</span>
              <button className="btn" onClick={signOut}>Se déconnecter</button>
            </>
          ) : null}
        </div>
      </footer>
    </div>
  )
}

function TopNav() {
  const item = (to, label) => (
    <NavLink to={to} className={({ isActive }) => `pill${isActive ? ' pill--active' : ''}`}>{label}</NavLink>
  )
  return (
    <header className="topnav">
      <div className="topnav__wrap">
        <Link to="/" className="brand">BEH</Link>
        <nav className="nav">
          {item('/sessions', 'Sessions')}
          {item('/capture', 'Saisie')}
          {item('/pending', 'En attente')}
          {item('/customers', 'Clients')}
          {item('/prep', 'Préparation')}
          {item('/delivery', 'Livraisons')}
          {item('/dashboard', 'Tableaux de bord')}
        </nav>
      </div>
    </header>
  )
}

