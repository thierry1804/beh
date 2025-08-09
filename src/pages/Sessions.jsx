import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLocalStorage } from '../lib/useLocalStorage'
import { Button, Card, CardContent, Chip, Stack, TextField } from '@mui/material'
import PageHeader from '../components/PageHeader'

export default function SessionsPage() {
  const [name, setName] = useState(defaultSessionName())
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useLocalStorage('selectedSessionId', null)
  const [selectedSessionName, setSelectedSessionName] = useLocalStorage('selectedSessionName', '')

  const nowIso = useMemo(() => new Date().toISOString(), [])

  useEffect(() => { void loadSessions() }, [])

  async function loadSessions() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('start_at', { ascending: false })
      .limit(50)
    if (!error) setSessions(data || [])
  }

  async function createSession(e) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ name, start_at: nowIso, status: 'open' }])
      .select()
      .single()
    setLoading(false)
    if (!error && data) {
      setSessions((prev) => [data, ...prev])
      setSelectedSessionId(data.id)
      setSelectedSessionName(data.name)
    }
  }

  async function closeSession(id) {
    await supabase.from('sessions').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id)
    await loadSessions()
  }

  function selectSession(s) {
    setSelectedSessionId(s.id)
    setSelectedSessionName(s.name)
  }

  return (
    <div className="page">
      <PageHeader
        title="Sessions de vente"
        actions={(
          <form onSubmit={createSession} className="toolbar" style={{ display: 'flex', gap: 8 }}>
            <TextField size="small" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la session" />
            <Button variant="contained" type="submit" disabled={loading}>Créer</Button>
          </form>
        )}
      />
      <Card>
        <CardContent>
          <table className="table">
          <thead>
            <tr>
                <th>Nom</th>
                <th>Début</th>
                <th>Statut</th>
                <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const dt = s.start_at ? new Date(s.start_at) : null
              return (
                <tr key={s.id} style={{ background: selectedSessionId === s.id ? 'rgba(124,77,255,.06)' : undefined }}>
                  <td>{s.name}</td>
                  <td>{dt ? dt.toLocaleString('fr-FR') : ''}</td>
                  <td><Chip size="small" label={s.status} color={s.status === 'open' ? 'success' : 'default'} variant={s.status === 'open' ? 'soft' : 'outlined'} /></td>
                  <td>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => selectSession(s)}>Utiliser</Button>
                      {s.status === 'open' && (
                        <Button size="small" color="error" variant="outlined" onClick={() => closeSession(s.id)}>Clôturer</Button>
                      )}
                    </Stack>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </CardContent>
      </Card>
    </div>
  )
}

function defaultSessionName() {
  const now = new Date()
  const pad = (n) => n.toString().padStart(2, '0')
  const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}h${pad(now.getMinutes())}`
  return `Live ${dateStr}`
}

const th = {}
const td = {}


