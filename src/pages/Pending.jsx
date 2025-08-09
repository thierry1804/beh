import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLocalStorage } from '../lib/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Button, Card, CardContent, TextField } from '@mui/material'

export default function PendingPage() {
  const [selectedSessionId] = useLocalStorage('selectedSessionId', null)
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState([])
  const navigate = useNavigate()

  useEffect(() => { if (selectedSessionId) void reload() }, [selectedSessionId])

  async function reload() {
    const { data } = await supabase
      .from('orders')
      .select('id, tiktok_name, unit_price, quantity')
      .eq('session_id', selectedSessionId)
      .order('created_at', { ascending: false })
      .limit(2000)
    setRows(data || [])
  }

  const grouped = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const key = r.tiktok_name
      const prev = map.get(key) || { tiktok_name: key, total_qty: 0, subtotal: 0 }
      prev.total_qty += Number(r.quantity || 0)
      prev.subtotal += Number(r.unit_price || 0) * Number(r.quantity || 0)
      map.set(key, prev)
    }
    let arr = Array.from(map.values())
    if (query) arr = arr.filter((g) => (g.tiktok_name || '').toLowerCase().includes(query.toLowerCase()))
    return arr.sort((a, b) => b.subtotal - a.subtotal)
  }, [rows, query])

  return (
    <div className="page">
      <PageHeader title="Commandes en attente" actions={<TextField size="small" placeholder="Filtrer par pseudo" value={query} onChange={(e) => setQuery(e.target.value)} />} />
      <Card>
        <CardContent>
      <table className="table">
        <thead>
          <tr>
            <th>Pseudo</th>
            <th>Qté</th>
            <th>Sous-total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((g) => (
            <tr key={g.tiktok_name}>
              <td>{g.tiktok_name}</td>
              <td style={{ textAlign: 'right' }}>{g.total_qty}</td>
              <td style={{ textAlign: 'right' }}>{g.subtotal.toLocaleString('fr-FR')}</td>
              <td>
                <Button size="small" variant="contained" onClick={() => navigate(`/customer/${encodeURIComponent(g.tiktok_name)}`)}>Finaliser</Button>
              </td>
            </tr>
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


