import { useMemo } from 'react'

export default function OrderList({ orders = [] }) {
  const total = useMemo(() => orders.reduce((sum, o) => sum + (Number(o.unit_price || 0) * Number(o.quantity || 0)), 0), [orders])
  return (
    <div className="card">
      <div className="card__header">
        <h3 style={{ margin: 0 }}>Commandes en cours</h3>
        <div style={{ fontWeight: 700, color: '#c9d5ff' }}>Total: {total.toLocaleString('fr-FR')}</div>
      </div>
      <div className="card__body" style={{ maxHeight: 420, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Heure</th>
              <th>Pseudo</th>
              <th>Code</th>
              <th>Description</th>
              <th>PU</th>
              <th>Qté</th>
              <th>Sous-total</th>
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



