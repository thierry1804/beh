import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Fab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  ShoppingCart as OrderIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import CustomerDetailModal from '../components/CustomerDetailModal'
import { supabase } from '../lib/supabaseClient'
import { loadAllCustomersWithPrimaryContacts, deleteCustomer } from '../lib/customerUtils'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuCustomerId, setMenuCustomerId] = useState(null)
  const [error, setError] = useState('')

  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: customersData, error: customersError } = await loadAllCustomersWithPrimaryContacts()

      if (customersError) {
        throw customersError
      }

      // Enrichir avec les données de commandes
      const enrichedCustomers = await Promise.all(
        (customersData || []).map(async (customer) => {
          // Compter les commandes par statut
          const { data: orderStats } = await supabase
            .from('orders')
            .select('order_status, total_amount, deposit_amount')
            .eq('customer_id', customer.id)

          const stats = {
            totalOrders: orderStats?.length || 0,
            totalAmount: orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
            totalDeposit: orderStats?.reduce((sum, order) => sum + (order.deposit_amount || 0), 0) || 0,
            pendingOrders: orderStats?.filter(o => o.order_status === 'CHECKOUT EN COURS').length || 0,
            confirmedOrders: orderStats?.filter(o => o.order_status === 'CONFIRMEE').length || 0,
            deliveredOrders: orderStats?.filter(o => o.order_status === 'LIVREE').length || 0
          }

          // Trouver la dernière commande
          const { data: lastOrder } = await supabase
            .from('orders')
            .select('order_date, order_status, total_amount, id')
            .eq('customer_id', customer.id)
            .order('order_date', { ascending: false })
            .limit(1)
            .single()

          return {
            ...customer,
            stats,
            lastOrder: lastOrder || null
          }
        })
      )

      setCustomers(enrichedCustomers)
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err)
      setError(t('customers.errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch =
        customer.tiktok_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.primary_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.primary_address?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && customer.stats.totalOrders > 0) ||
        (statusFilter === 'inactive' && customer.stats.totalOrders === 0) ||
        (statusFilter === 'pending' && customer.stats.pendingOrders > 0) ||
        (statusFilter === 'confirmed' && customer.stats.confirmedOrders > 0)

      return matchesSearch && matchesStatus
    })

    // Tri
    filtered.sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'name':
          aVal = a.real_name || a.tiktok_name || ''
          bVal = b.real_name || b.tiktok_name || ''
          break
        case 'orders':
          aVal = a.stats.totalOrders
          bVal = b.stats.totalOrders
          break
        case 'amount':
          aVal = a.stats.totalAmount
          bVal = b.stats.totalAmount
          break
        case 'last_order':
          aVal = a.lastOrder?.order_date ? new Date(a.lastOrder.order_date) : new Date(0)
          bVal = b.lastOrder?.order_date ? new Date(b.lastOrder.order_date) : new Date(0)
          break
        default:
          aVal = new Date(a.created_at)
          bVal = new Date(b.created_at)
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

    return filtered
  }, [customers, searchTerm, statusFilter, sortBy, sortOrder])

  const handleMenuClick = (event, customerId) => {
    setAnchorEl(event.currentTarget)
    setMenuCustomerId(customerId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuCustomerId(null)
  }

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer)
    setModalOpen(true)
    handleMenuClose()
  }

  const handleEditCustomer = (customer) => {
    if (customer.lastOrder?.id) {
      navigate(`/checkout/${customer.lastOrder.id}`)
    } else {
      handleViewCustomer(customer)
    }
    handleMenuClose()
  }

  const handleDeleteCustomer = (customer) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
    handleMenuClose()
  }

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return

    try {
      const { error } = await deleteCustomer(customerToDelete.id)
      if (error) throw error

      await loadCustomers()
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      setError(t('customers.errors.deleteFailed'))
    }
  }

  const getStatusChip = (customer) => {
    if (customer.stats.pendingOrders > 0) {
      return <Chip label={t('customers.status.pending')} color="warning" size="small" />
    } else if (customer.stats.confirmedOrders > 0) {
      return <Chip label={t('customers.status.confirmed')} color="info" size="small" />
    } else if (customer.stats.totalOrders > 0) {
      return <Chip label={t('customers.status.completed')} color="success" size="small" />
    } else {
      return <Chip label={t('customers.status.inactive')} color="default" size="small" />
    }
  }

  const handleCreateNewCustomer = () => {
    // Créer un nouveau client et ouvrir le modal d'édition
    navigate('/capture') // Rediriger vers la page de capture pour créer une nouvelle commande
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={50} />
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title={t('customers.title')}
        subtitle={`${filteredAndSortedCustomers.length} ${t('customers.customersFound')}`}
        actions={
          <Box display="flex" gap={1}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadCustomers}
              disabled={loading}
            >
              {t('common.refresh')}
            </Button>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Filtres et recherche */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              placeholder={t('customers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('customers.status.label')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('customers.status.label')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('customers.status.all')}</MenuItem>
                <MenuItem value="active">{t('customers.status.active')}</MenuItem>
                <MenuItem value="inactive">{t('customers.status.inactive')}</MenuItem>
                <MenuItem value="pending">{t('customers.status.pending')}</MenuItem>
                <MenuItem value="confirmed">{t('customers.status.confirmed')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('customers.sortBy.label')}</InputLabel>
              <Select
                value={sortBy}
                label={t('customers.sortBy.label')}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="created_at">{t('customers.sortBy.created')}</MenuItem>
                <MenuItem value="name">{t('customers.sortBy.name')}</MenuItem>
                <MenuItem value="orders">{t('customers.sortBy.orders')}</MenuItem>
                <MenuItem value="amount">{t('customers.sortBy.amount')}</MenuItem>
                <MenuItem value="last_order">{t('customers.sortBy.lastOrder')}</MenuItem>
              </Select>
            </FormControl>

            <Button
              startIcon={<FilterIcon />}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              variant="outlined"
              size="small"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Box>

          {/* Table des clients */}
          {filteredAndSortedCustomers.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchTerm || statusFilter !== 'all' 
                  ? t('customers.noCustomersFound')
                  : t('customers.noCustomers')
                }
              </Typography>
            </Box>
          ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('customers.customer')}</TableCell>
                      <TableCell>{t('customers.contact')}</TableCell>
                      <TableCell>{t('customers.status.label')}</TableCell>
                      <TableCell align="right">{t('customers.totalOrders')}</TableCell>
                      <TableCell align="right">{t('customers.totalAmount')}</TableCell>
                      <TableCell>{t('customers.lastOrder')}</TableCell>
                      <TableCell align="center">{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAndSortedCustomers.map((customer) => (
                      <TableRow key={customer.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {(customer.real_name || customer.tiktok_name || '?')[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {customer.real_name || t('customers.noName')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                              @{customer.tiktok_name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          {customer.primary_phone && (
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">{customer.primary_phone}</Typography>
                            </Box>
                          )}
                          {customer.primary_address && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <LocationIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200 }}>
                                {customer.primary_address.length > 50
                                  ? `${customer.primary_address.substring(0, 50)}...`
                                  : customer.primary_address
                                }
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        {getStatusChip(customer)}
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>
                          {customer.stats.totalOrders}
                        </Typography>
                        {customer.stats.pendingOrders > 0 && (
                          <Typography variant="caption" color="warning.main">
                            ({customer.stats.pendingOrders} {t('customers.pending')})
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>
                          {customer.stats.totalAmount.toLocaleString('fr-FR')} Ar
                        </Typography>
                        {customer.stats.totalDeposit > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {t('customers.deposit')}: {customer.stats.totalDeposit.toLocaleString('fr-FR')} Ar
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {customer.lastOrder ? (
                          <Box>
                            <Typography variant="body2">
                              {new Date(customer.lastOrder.order_date).toLocaleDateString('fr-FR')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.lastOrder.total_amount?.toLocaleString('fr-FR')} Ar
                            </Typography>
                          </Box>
                        ) : (
                            <Typography variant="caption" color="text.secondary">
                              {t('customers.noOrders')}
                            </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, customer.id)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const customer = customers.find(c => c.id === menuCustomerId)
          handleViewCustomer(customer)
        }}>
          <ViewIcon sx={{ mr: 1 }} />
          {t('customers.viewDetails')}
        </MenuItem>
        <MenuItem onClick={() => {
          const customer = customers.find(c => c.id === menuCustomerId)
          handleEditCustomer(customer)
        }}>
          <EditIcon sx={{ mr: 1 }} />
          {t('customers.editOrders')}
        </MenuItem>
        <MenuItem onClick={() => {
          const customer = customers.find(c => c.id === menuCustomerId)
          handleDeleteCustomer(customer)
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>

      {/* Bouton flottant pour nouveau client */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateNewCustomer}
      >
        <AddIcon />
      </Fab>

      {/* Modal de détails client */}
      <CustomerDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customerId={selectedCustomer?.id}
        onSave={loadCustomers}
      />

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('customers.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('customers.deleteWarning', {
              name: customerToDelete?.real_name || customerToDelete?.tiktok_name
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirmDeleteCustomer} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}