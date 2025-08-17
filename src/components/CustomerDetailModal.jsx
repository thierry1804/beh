import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material'
import { 
  Close as CloseIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  ShoppingCart as OrderIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabaseClient'
import { 
  loadCustomerWithContacts, 
  updateCustomer, 
  addCustomerPhone, 
  updateCustomerPhone, 
  deleteCustomerPhone,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  loadCustomerOrders
} from '../lib/customerUtils'

function TabPanel(props) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

export default function CustomerDetailModal({ open, onClose, customerId, onSave }) {
  const [customer, setCustomer] = useState(null)
  const [phones, setPhones] = useState([])
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [editingPhone, setEditingPhone] = useState(null)
  const [editingAddress, setEditingAddress] = useState(null)
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [error, setError] = useState('')
  
  const { t } = useTranslation()

  useEffect(() => {
    if (open && customerId) {
      loadCustomerData()
    }
  }, [open, customerId])

  const loadCustomerData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Charger les données du client avec contacts
      const { data: customerData, error: customerError } = await loadCustomerWithContacts(customerId)
      if (customerError) throw customerError

      setCustomer(customerData)
      setPhones(customerData.phones || [])
      setAddresses(customerData.addresses || [])

      // Charger l'historique des commandes
      const { data: ordersData, error: ordersError } = await loadCustomerOrders(customerId)
      if (ordersError) throw ordersError

      setOrders(ordersData || [])

    } catch (err) {
      console.error('Erreur lors du chargement du client:', err)
      setError(t('customers.errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCustomer = async () => {
    if (!customer) return

    setSaving(true)
    setError('')

    try {
      const { error } = await updateCustomer(customer.id, {
        tiktok_name: customer.tiktok_name,
        real_name: customer.real_name
      })

      if (error) throw error

      onSave && onSave()
      onClose()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError(t('customers.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddPhone = async () => {
    if (!newPhone.trim()) return

    try {
      const { data, error } = await addCustomerPhone(customerId, newPhone.trim(), phones.length === 0)
      if (error) throw error

      setPhones([...phones, data])
      setNewPhone('')
    } catch (err) {
      console.error('Erreur lors de l\'ajout du téléphone:', err)
      setError(t('customers.errors.addPhoneFailed'))
    }
  }

  const handleUpdatePhone = async (phoneId, phone, isPrimary = false) => {
    try {
      const { data, error } = await updateCustomerPhone(phoneId, phone, isPrimary)
      if (error) throw error

      setPhones(phones.map(p => p.id === phoneId ? data : (isPrimary ? { ...p, is_primary: false } : p)))
      setEditingPhone(null)
    } catch (err) {
      console.error('Erreur lors de la mise à jour du téléphone:', err)
      setError(t('customers.errors.updatePhoneFailed'))
    }
  }

  const handleDeletePhone = async (phoneId) => {
    try {
      const { error } = await deleteCustomerPhone(phoneId)
      if (error) throw error

      setPhones(phones.filter(p => p.id !== phoneId))
    } catch (err) {
      console.error('Erreur lors de la suppression du téléphone:', err)
      setError(t('customers.errors.deletePhoneFailed'))
    }
  }

  const handleAddAddress = async () => {
    if (!newAddress.trim()) return

    try {
      const { data, error } = await addCustomerAddress(customerId, newAddress.trim(), addresses.length === 0)
      if (error) throw error

      setAddresses([...addresses, data])
      setNewAddress('')
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'adresse:', err)
      setError(t('customers.errors.addAddressFailed'))
    }
  }

  const handleUpdateAddress = async (addressId, address, isPrimary = false) => {
    try {
      const { data, error } = await updateCustomerAddress(addressId, address, isPrimary)
      if (error) throw error

      setAddresses(addresses.map(a => a.id === addressId ? data : (isPrimary ? { ...a, is_primary: false } : a)))
      setEditingAddress(null)
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'adresse:', err)
      setError(t('customers.errors.updateAddressFailed'))
    }
  }

  const handleDeleteAddress = async (addressId) => {
    try {
      const { error } = await deleteCustomerAddress(addressId)
      if (error) throw error

      setAddresses(addresses.filter(a => a.id !== addressId))
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'adresse:', err)
      setError(t('customers.errors.deleteAddressFailed'))
    }
  }

  const formatOrderStatus = (status) => {
    const statusMap = {
      'CREEE': { text: t('customers.orderStatus.created'), color: '#666' },
      'CHECKOUT EN COURS': { text: t('customers.orderStatus.checkout'), color: '#ff9800' },
      'CONFIRMEE': { text: t('customers.orderStatus.confirmed'), color: '#2196f3' },
      'EN PREPARATION': { text: t('customers.orderStatus.preparation'), color: '#9c27b0' },
      'LIVREE': { text: t('customers.orderStatus.delivered'), color: '#4caf50' },
      'ANNULEE': { text: t('customers.orderStatus.cancelled'), color: '#f44336' }
    }
    return statusMap[status] || { text: status, color: '#666' }
  }

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  if (!customer) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">{t('customers.errors.customerNotFound')}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{t('customers.customerDetails')}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label={t('customers.tabs.general')} />
          <Tab label={t('customers.tabs.contacts')} />
          <Tab label={t('customers.tabs.orders')} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label={t('customers.tiktokName')}
              value={customer.tiktok_name || ''}
              onChange={(e) => setCustomer({ ...customer, tiktok_name: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('customers.realName')}
              value={customer.real_name || ''}
              onChange={(e) => setCustomer({ ...customer, real_name: e.target.value })}
              fullWidth
            />
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('customers.createdOn')}: {new Date(customer.created_at).toLocaleDateString('fr-FR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('customers.lastUpdate')}: {new Date(customer.updated_at).toLocaleDateString('fr-FR')}
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Téléphones */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PhoneIcon />
                <Typography variant="h6">{t('customers.phones')}</Typography>
              </Box>
              
              <List dense>
                {phones.map((phone) => (
                  <ListItem key={phone.id}>
                    <ListItemText
                      primary={
                        editingPhone === phone.id ? (
                          <TextField
                            size="small"
                            defaultValue={phone.phone}
                            onBlur={(e) => handleUpdatePhone(phone.id, e.target.value, phone.is_primary)}
                            onKeyPress={(e) => e.key === 'Enter' && handleUpdatePhone(phone.id, e.target.value, phone.is_primary)}
                          />
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            {phone.phone}
                            {phone.is_primary && <Chip label={t('customers.primary')} size="small" color="primary" />}
                          </Box>
                        )
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => setEditingPhone(phone.id)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeletePhone(phone.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Box display="flex" gap={1} mt={1}>
                <TextField
                  size="small"
                  placeholder={t('customers.placeholders.newPhone')}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPhone()}
                />
                <Button startIcon={<AddIcon />} onClick={handleAddPhone}>
                  {t('common.add')}
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* Adresses */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LocationIcon />
                <Typography variant="h6">{t('customers.addresses')}</Typography>
              </Box>
              
              <List dense>
                {addresses.map((address) => (
                  <ListItem key={address.id}>
                    <ListItemText
                      primary={
                        editingAddress === address.id ? (
                          <TextField
                            size="small"
                            multiline
                            defaultValue={address.address}
                            onBlur={(e) => handleUpdateAddress(address.id, e.target.value, address.is_primary)}
                          />
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            {address.address}
                            {address.is_primary && <Chip label={t('customers.primary')} size="small" color="primary" />}
                          </Box>
                        )
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => setEditingAddress(address.id)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteAddress(address.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Box display="flex" gap={1} mt={1}>
                <TextField
                  size="small"
                  multiline
                  placeholder={t('customers.placeholders.newAddress')}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                <Button startIcon={<AddIcon />} onClick={handleAddAddress}>
                  {t('common.add')}
                </Button>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <OrderIcon />
            <Typography variant="h6">{t('customers.orderHistory')}</Typography>
          </Box>

          {orders.length === 0 ? (
            <Typography color="text.secondary">{t('customers.noOrders')}</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('customers.orderNumber')}</TableCell>
                    <TableCell>{t('customers.orderDate')}</TableCell>
                    <TableCell>{t('customers.status')}</TableCell>
                    <TableCell align="right">{t('customers.totalAmount')}</TableCell>
                    <TableCell align="right">{t('customers.deposit')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => {
                    const statusInfo = formatOrderStatus(order.order_status)
                    return (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{new Date(order.order_date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.text}
                            size="small"
                            sx={{ color: statusInfo.color, borderColor: statusInfo.color }}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{(order.total_amount || 0).toLocaleString('fr-FR')} Ar</TableCell>
                        <TableCell align="right">{(order.deposit_amount || 0).toLocaleString('fr-FR')} Ar</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button 
          onClick={handleSaveCustomer} 
          variant="contained" 
          disabled={saving}
        >
          {saving ? <CircularProgress size={20} /> : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
