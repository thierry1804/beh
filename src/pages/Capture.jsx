import { useEffect, useMemo, useState } from 'react'
import QuickOrderModal from '../components/QuickOrderModal'
import OrderList from '../components/OrderList'
import { supabase } from '../lib/supabaseClient'
import { useLocalStorage } from '../lib/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Stack, Chip } from '@mui/material'
import PageHeader from '../components/PageHeader'
import { useTranslation } from 'react-i18next'
import { getOrCreateCustomer, addLineToOrder } from '../lib/orderUtils'
import { loadAllCustomersWithPrimaryContacts } from '../lib/customerUtils'

export default function CapturePage() {
  const [selectedSessionId] = useLocalStorage('selectedSessionId', null)
  const [selectedSessionName] = useLocalStorage('selectedSessionName', '')
  const [orderLines, setOrderLines] = useState([])
  const [handles, setHandles] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!selectedSessionId) return
    void reload()
  }, [selectedSessionId])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!open && ((e.ctrlKey && e.key.toLowerCase() === 'n') || (!e.ctrlKey && e.key.toLowerCase() === 'n'))) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const sessionLabel = useMemo(() => selectedSessionName || t('capture.noSessionSelected'), [selectedSessionName, t])

  // Récupérer tous les codes existants dans la session pour la vérification d'unicité
  const existingCodes = useMemo(() => {
    return orderLines.map(line => line.code).filter(Boolean)
  }, [orderLines])

  async function reload() {
    if (!selectedSessionId) return

    try {
      // Charger les lignes de commande de la session actuelle
      const { data: linesData, error: linesError } = await supabase
        .from('order_lines')
        .select(`
          *,
          orders!inner(
            id,
            session_id,
            order_number,
            order_date,
            order_status,
            customers!inner(tiktok_name, real_name)
          )
        `)
        .eq('orders.session_id', selectedSessionId)
        .order('created_at', { ascending: false })
        .limit(500)

      if (linesError) {
        console.error('Erreur lors du chargement des lignes:', linesError)
        return
      }

      // Charger les clients pour l'autocomplétion
      const { data: customersData, error: customersError } = await loadAllCustomersWithPrimaryContacts()

      if (customersError) {
        console.error('Erreur lors du chargement des clients:', customersError)
        return
      }

      setOrderLines(linesData || [])
      setHandles((customersData || []).map((c) => c.tiktok_name).filter(Boolean))
    } catch (err) {
      console.error('Erreur lors du rechargement:', err)
    }
  }

  async function handleSubmit(line) {
    if (!selectedSessionId) return

    try {
      // 1. Créer ou récupérer le client
      const { data: customer, error: customerError } = await getOrCreateCustomer(line.tiktokName)
      if (customerError) {
        console.error('Erreur lors de la création du client:', customerError)
        return
      }

      // 2. Chercher une commande existante pour ce client dans cette session
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('session_id', selectedSessionId)
        .eq('customer_id', customer.id)
        .eq('order_status', 'CREEE')
        .single()

      let orderId

      if (existingOrder) {
        // Utiliser la commande existante
        orderId = existingOrder.id
      } else {
        // Créer une nouvelle commande
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert([{
            session_id: selectedSessionId,
            customer_id: customer.id,
            order_number: `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            order_status: 'CREEE'
          }])
          .select()
          .single()

        if (orderError) {
          console.error('Erreur lors de la création de la commande:', orderError)
          return
        }

        orderId = newOrder.id
      }

      // 3. Chercher une ligne existante (même code + description)
      const { data: existingLine } = await supabase
        .from('order_lines')
        .select('id, quantity')
        .eq('order_id', orderId)
        .eq('code', line.code)
        .eq('description', line.description)
        .limit(1)
        .maybeSingle()

      if (existingLine) {
        const merge = window.confirm(t('capture.mergeConfirmation'))
        if (merge) {
          // Mettre à jour la quantité existante
          await supabase
            .from('order_lines')
            .update({
              quantity: (existingLine.quantity || 0) + line.quantity,
              line_total: ((existingLine.quantity || 0) + line.quantity) * line.unitPrice
            })
            .eq('id', existingLine.id)
        } else {
          // Créer une nouvelle ligne
          await addLineToOrder(orderId, {
            code: line.code,
            description: line.description,
            unit_price: line.unitPrice,
            quantity: line.quantity
          })
        }
      } else {
        // Créer une nouvelle ligne
        await addLineToOrder(orderId, {
          code: line.code,
          description: line.description,
          unit_price: line.unitPrice,
          quantity: line.quantity
        })
      }

      setOpen(false)
      await reload()
    } catch (err) {
      console.error('Erreur lors de la soumission:', err)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title={t('capture.operatorTitle')}
        actions={(
          <Stack direction="row" spacing={1}>
            <Chip label={sessionLabel} />
            <Button variant="contained" onClick={() => setOpen(true)}>
              {t('capture.newOrder')}
              <span className="keyboard-key">{t('capture.newOrderKey')}</span>
            </Button>
            <Button variant="outlined" onClick={() => navigate('/sessions')}>{t('capture.changeSession')}</Button>
          </Stack>
        )}
      />

      {!selectedSessionId ? (
        <Card><CardContent>{t('capture.selectSessionFirst')}</CardContent></Card>
      ) : (
        <>
            <OrderList orderLines={orderLines} />
            <QuickOrderModal
              open={open}
              onClose={() => setOpen(false)}
              onSubmit={handleSubmit}
              knownHandles={handles}
              existingCodes={existingCodes}
            />
        </>
      )}
    </div>
  )
}


