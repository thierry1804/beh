import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { 
  Button, 
  Card, 
  CardContent, 
  TextField, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton,
  Collapse
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ExpandMore, ExpandLess } from '@mui/icons-material'

export default function PreparationPage() {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [expandedCustomers, setExpandedCustomers] = useState(new Set())

  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => { void reload() }, [])

  async function reload() {
    // Charger les customers avec statut CONFIRMEE et leurs commandes
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        delivery_date,
        delivery_mode,
        payment_method,
        deposit_amount,
        total_amount,
        is_province,
        transport,
        created_at,
        updated_at,
        customers!inner(
          id,
          tiktok_name,
          real_name
        )
      `)
      .eq('order_status', 'CONFIRMEE')
      .order('updated_at', { ascending: false })

    if (ordersError) {
      console.error('Erreur lors du chargement des commandes:', ordersError)
      return
    }

    // Traitement des données (pas besoin de requête supplémentaire car tout est dans ordersData)
    const customersWithOrders = (ordersData || []).map((order) => {
      return {
        ...order.customers,
        order_id: order.id,
        delivery_date: order.delivery_date,
        delivery_mode: order.delivery_mode,
        payment_method: order.payment_method,
        deposit_amount: order.deposit_amount,
        total_amount: order.total_amount,
        fully_paid: order.deposit_amount >= order.total_amount,
        is_province: order.is_province,
        transport: order.transport,
        lines: [] // Sera rempli après
      }
    })

    // Charger les lignes de commande et les contacts pour chaque commande
    for (const customer of customersWithOrders) {
      // Charger les lignes de commande
      const { data: linesData } = await supabase
        .from('order_lines')
        .select(`
          id,
          code,
          description,
          unit_price,
          quantity,
          line_total
        `)
        .eq('order_id', customer.order_id)
        .order('created_at', { ascending: false })

      customer.lines = linesData || []

      // Recalculer le total basé sur les lignes de commande réelles
      const calculatedTotal = (linesData || []).reduce((sum, line) => sum + (Number(line.line_total) || 0), 0)
      
      // Si le total en base est différent du total calculé, utiliser le calculé
      if (customer.total_amount !== calculatedTotal) {
        customer.total_amount = calculatedTotal
        customer.fully_paid = customer.deposit_amount >= calculatedTotal
        
        // Optionnel: mettre à jour en base de données
        if (calculatedTotal > 0) {
          await supabase
            .from('orders')
            .update({ total_amount: calculatedTotal })
            .eq('id', customer.order_id)
        }
      }

      // Charger les contacts du client
      const { data: phonesData } = await supabase
        .from('customer_phones')
        .select('phone, is_primary')
        .eq('customer_id', customer.id)
        .order('is_primary', { ascending: false })

      const { data: addressesData } = await supabase
        .from('customer_addresses')
        .select('address, is_primary')
        .eq('customer_id', customer.id)
        .order('is_primary', { ascending: false })

      // Ajouter les contacts principaux
      customer.phone = phonesData?.find(p => p.is_primary)?.phone || phonesData?.[0]?.phone || t('preparation.noContact')
      customer.address = addressesData?.find(a => a.is_primary)?.address || addressesData?.[0]?.address || t('preparation.noAddress')
    }

    // Filtrer les commandes qui ont des lignes de commande et un total > 0
    const validCustomers = customersWithOrders.filter(customer => 
      customer.lines.length > 0 && customer.total_amount > 0
    )

    setCustomers(validCustomers)
  }

  const filteredCustomers = useMemo(() => {
    if (!query.trim()) return customers
    
    return customers.filter(customer => 
      customer.tiktok_name?.toLowerCase().includes(query.toLowerCase()) ||
      customer.real_name?.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone?.includes(query)
    )
  }, [customers, query])

  const totalAmount = useMemo(() => {
    return filteredCustomers.reduce((sum, customer) => sum + (customer.total_amount || 0), 0)
  }, [filteredCustomers])

  const toggleCustomerExpansion = (customerId) => {
    const newExpanded = new Set(expandedCustomers)
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId)
    } else {
      newExpanded.add(customerId)
    }
    setExpandedCustomers(newExpanded)
  }

  const formatDeliveryMode = (mode) => {
    switch (mode) {
      case 'RECUPERATION':
        return t('preparation.deliveryModes.pickup')
      case 'VIA SERVICE DE LIVRAISON':
        return t('preparation.deliveryModes.delivery')
      default:
        return mode || '-'
    }
  }

  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'especes':
        return t('preparation.paymentMethods.especes')
      case 'mvola':
        return t('preparation.paymentMethods.mvola')
      case 'orange_money':
        return t('preparation.paymentMethods.orange_money')
      case 'airtel_money':
        return t('preparation.paymentMethods.airtel_money')
      default:
        return method || '-'
    }
  }

  return (
    <div className="page">
      <PageHeader
        title={`${t('preparation.title')} (${totalAmount.toLocaleString('fr-FR')} Ar)`}
        actions={
          <TextField 
            size="small" 
            placeholder={t('preparation.filterPlaceholder')} 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        }
      />
      
      <Card>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                {customers.length === 0 ? t('preparation.messages.noConfirmedOrders') : t('preparation.messages.noSearchResults')}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t('preparation.headers.client')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('preparation.headers.contact')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('preparation.headers.delivery')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('preparation.headers.payment')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{t('preparation.headers.amount')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('preparation.headers.commands')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('preparation.headers.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <>
                      <TableRow 
                        key={customer.id}
                        sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {customer.real_name || t('preparation.noName')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{customer.tiktok_name}
                            </Typography>
                            {customer.is_province && (
                              <Chip 
                                label={t('preparation.labels.province')} 
                                size="small" 
                                color="warning" 
                                sx={{ ml: 1, fontSize: '0.75rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {customer.phone || t('preparation.noContact')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.address || t('preparation.noAddress')}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Chip 
                              label={formatDeliveryMode(customer.delivery_mode)}
                              size="small"
                              color={customer.delivery_mode === 'RECUPERATION' ? 'primary' : 'secondary'}
                              variant="outlined"
                            />
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                              {customer.delivery_date ? new Date(customer.delivery_date).toLocaleDateString('fr-FR') : t('preparation.noDate')}
                            </Typography>
                            {customer.transport && (
                              <Typography variant="caption" color="text.secondary">
                                {t('preparation.labels.transport')} {customer.transport}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Chip 
                              label={formatPaymentMethod(customer.payment_method)}
                              size="small"
                              color={customer.payment_method === 'especes' ? 'default' : 'primary'}
                              variant="outlined"
                            />
                            {customer.deposit_amount > 0 && (
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                {t('preparation.labels.deposit')} {customer.deposit_amount.toLocaleString('fr-FR')} Ar
                              </Typography>
                            )}
                            {customer.payment_reference && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {t('preparation.labels.reference')} {customer.payment_reference}
                              </Typography>
                            )}
                            {customer.fully_paid && (
                              <Chip 
                                label={t('preparation.labels.paid')} 
                                size="small" 
                                color="success" 
                                sx={{ mt: 0.5, fontSize: '0.75rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {(customer.total_amount || 0).toLocaleString('fr-FR')} Ar
                          </Typography>
                          {customer.deposit_amount > 0 && (customer.total_amount || 0) > customer.deposit_amount && (
                            <Typography variant="caption" color="text.secondary">
                              {t('preparation.labels.remaining')} {((customer.total_amount || 0) - customer.deposit_amount).toLocaleString('fr-FR')} Ar
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell align="center">
                          <IconButton 
                            onClick={() => toggleCustomerExpansion(customer.id)}
                            size="small"
                          >
                            <Chip 
                              label={`${customer.lines?.length || 0} ${(customer.lines?.length || 0) > 1 ? t('preparation.buttons.articles') : t('preparation.buttons.article')}`}
                              size="small"
                              color="primary"
                            />
                            {expandedCustomers.has(customer.id) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/checkout/${customer.order_id}`)}
                            disabled={!customer.order_id}
                          >
                            {t('preparation.buttons.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Ligne expansible avec le détail des commandes */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, border: 'none' }}>
                          <Collapse in={expandedCustomers.has(customer.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 1, m: 1 }}>
                              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                {t('preparation.messages.orderDetails')}:
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>{t('preparation.tableHeaders.session')}</TableCell>
                                    <TableCell>{t('preparation.tableHeaders.code')}</TableCell>
                                    <TableCell>{t('preparation.tableHeaders.description')}</TableCell>
                                    <TableCell align="right">{t('preparation.tableHeaders.unitPrice')}</TableCell>
                                    <TableCell align="center">{t('preparation.tableHeaders.quantity')}</TableCell>
                                    <TableCell align="right">{t('preparation.tableHeaders.subtotal')}</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(customer.lines || []).map((line) => (
                                    <TableRow key={line.id}>
                                      <TableCell>
                                        <Chip 
                                          label={line.code} 
                                          size="small" 
                                          variant="outlined"
                                        />
                                      </TableCell>
                                      <TableCell>{line.code}</TableCell>
                                      <TableCell>{line.description}</TableCell>
                                      <TableCell align="right">
                                        {Number(line.unit_price).toLocaleString('fr-FR')} Ar
                                      </TableCell>
                                      <TableCell align="center">{line.quantity}</TableCell>
                                      <TableCell align="right">
                                        {Number(line.line_total).toLocaleString('fr-FR')} Ar
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
