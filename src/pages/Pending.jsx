import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLocalStorage } from '../lib/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Button, Card, CardContent, TextField } from '@mui/material'

export default function PendingPage() {
  const [selectedSessionId] = useLocalStorage('selectedSessionId', null)
  const [selectedSessionName] = useLocalStorage('selectedSessionName', '')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState([])
  const navigate = useNavigate()

  useEffect(() => { void reload() }, [])

  async function reload() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, 
        tiktok_name, 
        unit_price, 
        quantity,
        session_id,
        status,
        sessions!inner(name, start_at)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(2000)

    console.log('Données récupérées:', data)
    console.log('Erreur:', error)

    setRows(data || [])
  }

  const grouped = useMemo(() => {
    const sessionMap = new Map()
    const customerMap = new Map()

    // D'abord, grouper par client
    for (const r of rows) {
      const customerKey = r.tiktok_name
      const sessionKey = r.sessions?.name || 'Session inconnue'

      // Grouper par client
      const customerPrev = customerMap.get(customerKey) || {
        tiktok_name: customerKey,
        session_name: sessionKey,
        session_start: r.sessions?.start_at,
        total_qty: 0,
        subtotal: 0
      }
      customerPrev.total_qty += Number(r.quantity || 0)
      customerPrev.subtotal += Number(r.unit_price || 0) * Number(r.quantity || 0)
      customerMap.set(customerKey, customerPrev)

      // Calculer les totaux par session
      const sessionPrev = sessionMap.get(sessionKey) || {
        session_name: sessionKey,
        session_start: r.sessions?.start_at,
        total_qty: 0,
        subtotal: 0,
        customers: []
      }
      sessionPrev.total_qty += Number(r.quantity || 0)
      sessionPrev.subtotal += Number(r.unit_price || 0) * Number(r.quantity || 0)
      sessionMap.set(sessionKey, sessionPrev)
    }

    // Ajouter les clients à leurs sessions respectives
    for (const customer of customerMap.values()) {
      const session = sessionMap.get(customer.session_name)
      if (session) {
        session.customers.push(customer)
      }
    }

    // Trier les clients par sous-total dans chaque session
    for (const session of sessionMap.values()) {
      session.customers.sort((a, b) => b.subtotal - a.subtotal)
    }

    let arr = Array.from(sessionMap.values())
    if (query) {
      arr = arr.filter((g) =>
        (g.session_name || '').toLowerCase().includes(query.toLowerCase()) ||
        g.customers.some(c => (c.tiktok_name || '').toLowerCase().includes(query.toLowerCase()))
      )
    }
    return arr.sort((a, b) => b.subtotal - a.subtotal)
  }, [rows, query])

  const totalAmount = useMemo(() => {
    return grouped.reduce((sum, g) => sum + g.subtotal, 0)
  }, [grouped])

  return (
    <div className="page">
      <PageHeader
        title={`Commandes en attente (${totalAmount.toLocaleString('fr-FR')})`}
        actions={<TextField size="small" placeholder="Filtrer par session ou client" value={query} onChange={(e) => setQuery(e.target.value)} />}
      />
      <Card>
        <CardContent>
      <table className="table">
        <thead>
          <tr>
                <th>Session</th>
            <th>Pseudo</th>
            <th>Qté</th>
            <th>Sous-total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
              {grouped.map((session) => (
                <>
                  {/* Ligne de session avec total */}
                  <tr key={`session-${session.session_name}`} style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                    <td>{session.session_name}</td>
                    <td>{session.customers.length} clients</td>
                    <td style={{ textAlign: 'right' }}>{session.total_qty}</td>
                    <td style={{ textAlign: 'right' }}>{session.subtotal.toLocaleString('fr-FR')}</td>
                    <td></td>
                  </tr>
                  {/* Détails des clients */}
                  {session.customers.map((customer) => (
                    <tr key={`customer-${customer.tiktok_name}`} style={{ backgroundColor: '#fafafa' }}>
                      <td style={{ paddingLeft: '2rem' }}></td>
                      <td>{customer.tiktok_name}</td>
                      <td style={{ textAlign: 'right' }}>{customer.total_qty}</td>
                      <td style={{ textAlign: 'right' }}>{customer.subtotal.toLocaleString('fr-FR')}</td>
                      <td>
                        <Button size="small" variant="contained" onClick={() => navigate(`/customer/${encodeURIComponent(customer.tiktok_name)}`)}>Check out</Button>
                      </td>
                    </tr>
                  ))}
                </>
          ))}
        </tbody>
      </table>
        </CardContent>
      </Card>
    </div>
  )
}

const th = {}
const td = {}
const tdRight = {}


