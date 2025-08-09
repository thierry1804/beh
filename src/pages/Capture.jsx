import { useEffect, useMemo, useState } from 'react'
import QuickOrderModal from '../components/QuickOrderModal'
import OrderList from '../components/OrderList'
import { supabase } from '../lib/supabaseClient'
import { useLocalStorage } from '../lib/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Stack, Chip } from '@mui/material'
import PageHeader from '../components/PageHeader'

export default function CapturePage() {
  const [selectedSessionId] = useLocalStorage('selectedSessionId', null)
  const [selectedSessionName] = useLocalStorage('selectedSessionName', '')
  const [orders, setOrders] = useState([])
  const [handles, setHandles] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedSessionId) return
    void reload()
  }, [selectedSessionId])

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'n') || (!e.ctrlKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const sessionLabel = useMemo(() => selectedSessionName || 'Aucune session sélectionnée', [selectedSessionName])

  async function reload() {
    const [{ data: ordersData }, { data: customersData }] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('session_id', selectedSessionId)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('customers')
        .select('tiktok_name')
        .order('updated_at', { ascending: false })
        .limit(2000),
    ])
    setOrders(ordersData || [])
    setHandles((customersData || []).map((c) => c.tiktok_name).filter(Boolean))
  }

  async function handleSubmit(line) {
    if (!selectedSessionId) return
    // Chercher une ligne existante (même pseudo + code + description)
    const { data: existing } = await supabase
      .from('orders')
      .select('id, quantity')
      .eq('session_id', selectedSessionId)
      .ilike('tiktok_name', line.tiktokName)
      .ilike('description', line.description)
      .eq('code', line.code)
      .limit(1)
      .maybeSingle()

    if (existing) {
      const merge = window.confirm('Ligne similaire trouvée. Fusionner (incrémenter la quantité) ?')
      if (merge) {
        await supabase.from('orders').update({ quantity: (existing.quantity || 0) + line.quantity }).eq('id', existing.id)
      } else {
        await supabase.from('orders').insert([{ session_id: selectedSessionId, tiktok_name: line.tiktokName, code: line.code, description: line.description, unit_price: line.unitPrice, quantity: line.quantity }])
      }
    } else {
      await supabase.from('orders').insert([{ session_id: selectedSessionId, tiktok_name: line.tiktokName, code: line.code, description: line.description, unit_price: line.unitPrice, quantity: line.quantity }])
    }
    setOpen(false)
    await reload()
  }

  return (
    <div className="page">
      <PageHeader
        title="Saisie opérateur"
        actions={(
          <Stack direction="row" spacing={1}>
            <Chip label={sessionLabel} />
            <Button variant="contained" onClick={() => setOpen(true)}>Nouvelle commande (N / Ctrl+N)</Button>
            <Button variant="outlined" onClick={() => navigate('/sessions')}>Changer de session</Button>
          </Stack>
        )}
      />

      {!selectedSessionId ? (
        <Card><CardContent>Sélectionnez d'abord une session dans l'écran « Sessions ».</CardContent></Card>
      ) : (
        <>
          <OrderList orders={orders} />
          <QuickOrderModal open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} knownHandles={handles} />
        </>
      )}
    </div>
  )
}


