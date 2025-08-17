import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export default function OrderList({ orderLines = [] }) {
  const { t } = useTranslation()
  const total = useMemo(() => orderLines.reduce((sum, line) => sum + (Number(line.line_total || 0)), 0), [orderLines])

  const formatOrderStatus = (status) => {
    switch (status) {
      case 'CREEE':
        return { text: 'Créée', color: '#6366f1', bgColor: '#f0f9ff' }
      case 'CHECKOUT EN COURS':
        return { text: 'En cours', color: '#f59e0b', bgColor: '#fef3c7' }
      case 'CONFIRMEE':
        return { text: 'Confirmée', color: '#10b981', bgColor: '#d1fae5' }
      case 'EN PREPARATION':
        return { text: 'Préparation', color: '#8b5cf6', bgColor: '#f3e8ff' }
      case 'LIVREE':
        return { text: 'Livrée', color: '#06b6d4', bgColor: '#cffafe' }
      case 'ANNULEE':
        return { text: 'Annulée', color: '#ef4444', bgColor: '#fee2e2' }
      default:
        return { text: status || 'Inconnu', color: '#6b7280', bgColor: '#f9fafb' }
    }
  }

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
              <th>{t('capture.date')}</th>
              <th>{t('capture.time')}</th>
              <th>{t('capture.username')}</th>
              <th>Statut</th>
              <th>{t('capture.code')}</th>
              <th>{t('capture.description')}</th>
              <th>{t('capture.unitPriceShort')}</th>
              <th>{t('capture.quantityShort')}</th>
              <th>{t('capture.subtotal')}</th>
            </tr>
          </thead>
          <tbody>
            {orderLines.map((line) => {
              const dt = line.created_at ? new Date(line.created_at) : null
              const date = dt ? dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
              const time = dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
              const customerName = line.orders?.customers?.tiktok_name || 'Client inconnu'
              const orderStatus = line.orders?.order_status
              const statusInfo = formatOrderStatus(orderStatus)

              return (
                <tr key={line.id}>
                  <td>{date}</td>
                  <td>{time}</td>
                  <td>{customerName}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: statusInfo.color,
                      backgroundColor: statusInfo.bgColor,
                      border: `1px solid ${statusInfo.color}20`
                    }}>
                      {statusInfo.text}
                    </span>
                  </td>
                  <td>{line.code}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.description}</td>
                  <td style={{ textAlign: 'right' }}>{Number(line.unit_price).toLocaleString('fr-FR')}</td>
                  <td style={{ textAlign: 'right' }}>{line.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{Number(line.line_total).toLocaleString('fr-FR')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}



