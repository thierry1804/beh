import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLocalStorage } from '../lib/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Button, Card, CardContent, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function PendingPage() {
  const [selectedSessionId] = useLocalStorage('selectedSessionId', null)
  const [selectedSessionName] = useLocalStorage('selectedSessionName', '')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState([])
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => { void reload() }, [])

  async function reload() {
    const { data, error } = await supabase
      .from('order_lines')
      .select(`
        id,
        code,
        description,
        unit_price, 
        quantity,
        line_total,
        orders!inner(
          id,
          customer_id,
          session_id,
          order_status,
          customers!inner(tiktok_name),
          sessions!inner(name, start_at)
        )
      `)
      .in('orders.order_status', ['CHECKOUT EN COURS', 'CREEE'])
      .order('created_at', { ascending: false })
      .limit(2000)

    console.log(t('messages.dataRetrieved') + ':', data)
    console.log(t('messages.error') + ':', error)

    setRows(data || [])
  }

  const grouped = useMemo(() => {
    const sessionMap = new Map()
    const customerMap = new Map()

    // D'abord, grouper par client
    for (const r of rows) {
      const customerKey = r.orders?.customers?.tiktok_name
      const sessionKey = r.orders?.sessions?.name || t('pending.unknownSession')

      // Grouper par client
      const customerPrev = customerMap.get(customerKey) || {
        tiktok_name: customerKey,
        session_name: sessionKey,
        session_start: r.orders?.sessions?.start_at,
        total_qty: 0,
        subtotal: 0,
        firstOrderId: r.orders?.id  // Ajouter l'ID de la première commande
      }
      customerPrev.total_qty += Number(r.quantity || 0)
      customerPrev.subtotal += Number(r.line_total || 0)
      // Garder la première commande comme référence pour le checkout
      if (!customerPrev.firstOrderId) {
        customerPrev.firstOrderId = r.orders?.id
      }
      customerMap.set(customerKey, customerPrev)

      // Calculer les totaux par session
      const sessionPrev = sessionMap.get(sessionKey) || {
        session_name: sessionKey,
        session_start: r.orders?.sessions?.start_at,
        total_qty: 0,
        subtotal: 0,
        customers: []
      }
      sessionPrev.total_qty += Number(r.quantity || 0)
      sessionPrev.subtotal += Number(r.line_total || 0)
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
        title={`${t('pending.title')} (${totalAmount.toLocaleString('fr-FR')})`}
        actions={<TextField size="small" placeholder={t('pending.filterPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />}
      />
      <Card>
        <CardContent>
      <table className="table">
        <thead>
          <tr>
                <th>{t('pending.session')}</th>
                <th>{t('pending.username')}</th>
                <th>{t('pending.quantity')}</th>
                <th>{t('pending.subtotal')}</th>
                <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
              {grouped.map((session) => (
                <>
                  {/* Ligne de session avec total */}
                  <tr key={`session-${session.session_name}`} style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                    <td>{session.session_name}</td>
                    <td>{session.customers.length} {t('pending.customers')}</td>
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
                        <Button size="small" variant="contained" onClick={() => navigate(`/checkout/${customer.firstOrderId}`)}>{t('pending.checkout')}</Button>
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


