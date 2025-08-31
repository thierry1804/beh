import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLocalStorage } from '../lib/useLocalStorage'
import { Button, Card, CardContent, Chip, Stack } from '@mui/material'
import PageHeader from '../components/PageHeader'
import CreateSessionModal from '../components/CreateSessionModal'
import { useTranslation } from 'react-i18next'

export default function SessionsPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useLocalStorage('selectedSessionId', null)
  const [selectedSessionName, setSelectedSessionName] = useLocalStorage('selectedSessionName', '')
  const { t } = useTranslation()

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

  async function createSession(sessionType) {
    setLoading(true)
    const sessionName = defaultSessionName(sessionType)
    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        name: sessionName,
        session_type: sessionType,
        start_at: nowIso,
        status: 'open'
      }])
      .select()
      .single()
    setLoading(false)
    if (!error && data) {
      setSessions((prev) => [data, ...prev])
      setSelectedSessionId(data.id)
      setSelectedSessionName(data.name)
      setCreateModalOpen(false)
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

  // Vérifier s'il y a déjà une session en cours
  const hasOpenSession = useMemo(() => {
    return sessions.some(s => s.status === 'open')
  }, [sessions])

  return (
    <div className="page">
      <PageHeader
        title={t('sessions.title')}
        actions={(
          <Button
            variant="contained"
            onClick={() => setCreateModalOpen(true)}
            disabled={loading || hasOpenSession}
            title={hasOpenSession ? t('sessions.sessionInProgress') : ""}
          >
            {t('sessions.create')}
          </Button>
        )}
      />
      <Card>
        <CardContent>
          <table className="table">
          <thead>
            <tr>
                <th>{t('sessions.name')}</th>
                <th>{t('sessions.type')}</th>
                <th>{t('sessions.start')}</th>
                <th>{t('sessions.status')}</th>
                <th>{t('sessions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const dt = s.start_at ? new Date(s.start_at) : null
              // Gérer les cas où session_type pourrait être null/undefined
              const sessionType = s.session_type || 'LIVE_TIKTOK' // valeur par défaut
              const sessionTypeLabel = sessionType === 'LIVE_TIKTOK'
                ? t('sessions.types.liveTiktok')
                : t('sessions.types.regularSale')

              return (
                <tr key={s.id} style={{ background: selectedSessionId === s.id ? 'rgba(124,77,255,.06)' : undefined }}>
                  <td>{s.name}</td>
                  <td>
                    <Chip
                      size="small"
                      label={sessionTypeLabel}
                      color={sessionType === 'LIVE_TIKTOK' ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </td>
                  <td>{dt ? dt.toLocaleString('fr-FR') : ''}</td>
                  <td><Chip size="small" label={s.status} color={s.status === 'open' ? 'success' : 'default'} variant={s.status === 'open' ? 'soft' : 'outlined'} /></td>
                  <td>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => selectSession(s)}
                        disabled={selectedSessionId === s.id}
                        title={selectedSessionId === s.id ? t('sessions.sessionAlreadyActive') : ""}
                      >
                        {t('sessions.use')}
                      </Button>
                      {s.status === 'open' && (
                        <Button size="small" color="error" variant="outlined" onClick={() => closeSession(s.id)}>{t('sessions.close')}</Button>
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

      <CreateSessionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateSession={createSession}
        loading={loading}
      />
    </div>
  )
}

function defaultSessionName(sessionType = 'LIVE_TIKTOK') {
  const now = new Date()
  const pad = (n) => n.toString().padStart(2, '0')
  const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}h${pad(now.getMinutes())}`
  const prefix = sessionType === 'LIVE_TIKTOK' ? 'Live' : 'Vente'
  return `${prefix} ${dateStr}`
}

const th = {}
const td = {}


