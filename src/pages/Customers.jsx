import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement des clients:', error)
        return
      }

      setCustomers(data || [])
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
      return <span className="badge badge--success">Acompte versé</span>
    }
    return <span className="badge badge--warning">Sans acompte</span>
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <div className="card__body">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Chargement des clients...
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
          <h2 style={{ margin: 0 }}>Gestion des clients</h2>
          <div style={{ color: '#9aa3b2' }}>
            {filteredCustomers.length} client{filteredCustomers.length > 1 ? 's' : ''} trouvé{filteredCustomers.length > 1 ? 's' : ''}
          </div>
        </div>
        <div className="card__body">
          {/* Filtres et recherche */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <input
                className="input"
                type="text"
                placeholder="Rechercher par nom, pseudo ou téléphone..."
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
              <option value="all">Tous les clients</option>
              <option value="with_deposit">Avec acompte</option>
              <option value="without_deposit">Sans acompte</option>
            </select>
            <button className="btn btn--primary" onClick={loadCustomers}>
              Actualiser
            </button>
          </div>

          {/* Liste des clients */}
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9aa3b2' }}>
                {searchTerm || filterStatus !== 'all' 
                  ? 'Aucun client ne correspond aux critères de recherche'
                  : 'Aucun client enregistré'
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
                            <Link to={`/customer/${customer.tiktok_name}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                              @{customer.tiktok_name}
                            </Link>
                          </h3>
                          {getStatusBadge(customer)}
                        </div>
                        
                        {customer.real_name && (
                          <div style={{ marginBottom: 4, color: '#666' }}>
                            <strong>Nom réel:</strong> {customer.real_name}
                          </div>
                        )}
                        
                        {customer.phone && (
                          <div style={{ marginBottom: 4, color: '#666' }}>
                            <strong>Téléphone:</strong> {customer.phone}
                          </div>
                        )}
                        
                        {customer.address && (
                          <div style={{ marginBottom: 4, color: '#666' }}>
                            <strong>Adresse:</strong> {customer.address}
                          </div>
                        )}
                        
                        {customer.deposit_enabled && customer.deposit_amount && (
                          <div style={{ color: '#28a745' }}>
                            <strong>Acompte:</strong> {customer.deposit_amount} FCFA
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        <Link to={`/customer/${customer.tiktok_name}`} className="btn btn--primary">
                          Voir/Modifier
                        </Link>
                        <div style={{ fontSize: '0.8rem', color: '#9aa3b2' }}>
                          Créé le {new Date(customer.created_at).toLocaleDateString('fr-FR')}
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
