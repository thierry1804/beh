import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export default function OrderList({ orders = [] }) {
  const { t } = useTranslation()
  const total = useMemo(() => orders.reduce((sum, o) => sum + (Number(o.unit_price || 0) * Number(o.quantity || 0)), 0), [orders])
  return (
    <div className="card">
      <div className="card__header">
        <h3 style={{ margin: 0 }}>{t('capture.currentOrders')}</h3>
        <div style={{ fontWeight: 700, color: '#c9d5ff' }}>{t('capture.total')}: {total.toLocaleString('fr-FR')}</div>
      </div>
      <div className="card__body" style={{ maxHeight: 420, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t('capture.time')}</th>
              <th>{t('capture.username')}</th>
              <th>{t('capture.code')}</th>
              <th>{t('capture.description')}</th>
              <th>{t('capture.unitPriceShort')}</th>
              <th>{t('capture.quantityShort')}</th>
              <th>{t('capture.subtotal')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const dt = o.created_at ? new Date(o.created_at) : null
              const time = dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
              const subtotal = Number(o.unit_price || 0) * Number(o.quantity || 0)
              return (
                <tr key={o.id}>
                  <td>{time}</td>
                  <td>{o.tiktok_name}</td>
                  <td>{o.code}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.description}</td>
                  <td style={{ textAlign: 'right' }}>{Number(o.unit_price).toLocaleString('fr-FR')}</td>
                  <td style={{ textAlign: 'right' }}>{o.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{subtotal.toLocaleString('fr-FR')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}



