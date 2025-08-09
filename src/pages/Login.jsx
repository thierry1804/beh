import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useLocation, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { signInWithPassword, signInWithOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('password')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state && location.state.from) || '/capture'

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      if (mode === 'password') {
        const { error } = await signInWithPassword(email, password)
        if (error) setMessage(error.message)
        else navigate(from, { replace: true })
      } else {
        const { error } = await signInWithOtp(email)
        if (!error) setMessage("Lien de connexion envoyé. Vérifiez votre email.")
        else setMessage(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <form onSubmit={onSubmit} style={{ width: 360, maxWidth: '90vw', border: '1px solid #eee', borderRadius: 8, padding: 16, background: 'white' }}>
        <h2 style={{ marginTop: 0 }}>Connexion</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%' }} />
        </div>
        {mode === 'password' && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <label><input type="radio" name="mode" checked={mode === 'password'} onChange={() => setMode('password')} /> Mot de passe</label>
          <label><input type="radio" name="mode" checked={mode === 'otp'} onChange={() => setMode('otp')} /> Lien magique</label>
        </div>
        {message && <div style={{ color: '#0d47a1', marginBottom: 8 }}>{message}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>{loading ? '...' : (mode === 'password' ? 'Se connecter' : 'Envoyer le lien')}</button>
      </form>
    </div>
  )
}


