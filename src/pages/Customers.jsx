import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from 'react-i18next'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const { t } = useTranslation()

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      // Charger les clients avec leurs commandes en attente
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (customersError) {
        console.error('Erreur lors du chargement des clients:', customersError)
        return
      }

      // Pour chaque client, récupérer la première commande en attente
      const customersWithOrders = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id')
            .eq('tiktok_name', customer.tiktok_name)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...customer,
            firstOrderId: ordersData?.[0]?.id || null
          }
        })
      )

      setCustomers(customersWithOrders)
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.tiktok_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm)
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'with_deposit' && customer.deposit_enabled) ||
                         (filterStatus === 'without_deposit' && !customer.deposit_enabled)

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (customer) => {
    if (customer.deposit_enabled) {
      return <span className="badge badge--success">{t('customers.depositPaid')}</span>
    }
    return <span className="badge badge--warning">{t('customers.noDeposit')}</span>
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <div className="card__body">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              {t('customers.loading')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card__header">
          <h2 style={{ margin: 0 }}>{t('customers.title')}</h2>
          <div style={{ color: '#9aa3b2' }}>
            {filteredCustomers.length} {filteredCustomers.length > 1 ? t('customers.customersFoundPlural') : t('customers.customersFound')}
          </div>
        </div>
        <div className="card__body">
          {/* Filtres et recherche */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <input
                className="input"
                type="text"
                placeholder={t('customers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: 150 }}
            >
              <option value="all">{t('customers.allCustomers')}</option>
              <option value="with_deposit">{t('customers.withDeposit')}</option>
              <option value="without_deposit">{t('customers.withoutDeposit')}</option>
            </select>
            <button className="btn btn--primary" onClick={loadCustomers}>
              {t('customers.refresh')}
            </button>
          </div>

          {/* Liste des clients */}
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9aa3b2' }}>
                {searchTerm || filterStatus !== 'all' 
                  ? t('customers.noCustomersFound')
                  : t('customers.noCustomers')
                }
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <div key={customer.id} className="card" style={{ border: '1px solid var(--border)' }}>
                  <div className="card__body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                            <Link
                              to={customer.firstOrderId ? `/checkout/${customer.firstOrderId}` : '#'}
                              style={{
                                color: customer.firstOrderId ? 'var(--primary)' : '#999',
                                textDecoration: 'none',
                                cursor: customer.firstOrderId ? 'pointer' : 'not-allowed'
                              }}
                            >
                              @{customer.tiktok_name}
                            </Link>
                          </h3>
                          {getStatusBadge(customer)}
                        </div>
                        
                        {customer.real_name && (
                          <div style={{ marginBottom: 4, color: '#666' }}>
                            <strong>{t('customers.realName')}:</strong> {customer.real_name}
                          </div>
                        )}
                        
                        {customer.phone && (
                          <div style={{ marginBottom: 4, color: '#666' }}>
                            <strong>{t('customers.phone')}:</strong> {customer.phone}
                          </div>
                        )}
                        
                        {customer.address && (
                          <div style={{ marginBottom: 4, color: '#666' }}>
                            <strong>{t('customers.address')}:</strong> {customer.address}
                          </div>
                        )}
                        
                        {customer.deposit_enabled && customer.deposit_amount && (
                          <div style={{ color: '#28a745' }}>
                            <strong>{t('customers.deposit')}:</strong> {customer.deposit_amount} FCFA
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        {customer.firstOrderId ? (
                          <Link to={`/checkout/${customer.firstOrderId}`} className="btn btn--primary">
                            {t('customers.viewEdit')}
                          </Link>
                        ) : (
                          <span className="btn btn--secondary" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            Aucune commande
                          </span>
                        )}
                        <div style={{ fontSize: '0.8rem', color: '#9aa3b2' }}>
                          {t('customers.createdOn')} {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
