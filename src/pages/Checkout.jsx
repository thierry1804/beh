import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from 'react-i18next'
import './Checkout.css'
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box,
  Divider,
  Chip,
  Button,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Avatar,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Collapse,
  useMediaQuery,
  useTheme,
  RadioGroup,
  Radio
} from '@mui/material'
import { loadOrderWithDetails, updateOrderStatus, calculateOrderTotal } from '../lib/orderUtils'
import { loadCustomerWithContacts, updateCustomer, getOrCreateCustomerPhone, getOrCreateCustomerAddress } from '../lib/customerUtils'

export default function CheckoutPage() {
  const { orderId } = useParams()
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [order, setOrder] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef(null)

  // Vérifier si la commande est en mode lecture seule (déjà confirmée)
  const isReadOnly = order?.order_status === 'CONFIRMEE'

  useEffect(() => { 
    void loadOrderAndCustomer() 
  }, [orderId])

  async function loadOrderAndCustomer() {
    if (!orderId) return
    
    try {
      // Charger la commande avec tous ses détails
      const { data: orderData, error: orderError } = await loadOrderWithDetails(orderId)

      if (orderError) {
        console.error('Erreur lors du chargement de la commande:', orderError)
        return
      }

      setOrder(orderData)

      // Charger le client avec tous ses contacts
      const { data: customerData, error: customerError } = await loadCustomerWithContacts(orderData.customer_id)

      if (customerError) {
        console.error('Erreur lors du chargement du client:', customerError)
        return
      }

      // Initialiser les valeurs par défaut si nécessaire
      const updatedCustomerData = {
        ...customerData,
        order_status: orderData.order_status || 'CHECKOUT EN COURS',
        delivery_mode: orderData.delivery_mode || 'VIA SERVICE DE LIVRAISON'
      }

      setCustomer(updatedCustomerData)

      // Mettre à jour les valeurs par défaut dans la base si nécessaire
      const updates = {}
      if (!orderData.order_status) {
        updates.order_status = 'CHECKOUT EN COURS'
      }
      if (!orderData.delivery_mode) {
        updates.delivery_mode = 'VIA SERVICE DE LIVRAISON'
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('orders')
          .update(updates)
          .eq('id', orderId)
      }

    } catch (err) {
      console.error('Erreur lors du chargement:', err)
    }
  }

  // Fonction pour forcer la sauvegarde immédiate de l'état actuel
  const forceSave = useCallback(async () => {
    if (!order?.id || isReadOnly) return

    setSaving(true)
    try {
      // Mettre à jour la commande (seulement les champs de la table orders)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          delivery_mode: order.delivery_mode,
          delivery_date: order.delivery_date,
          payment_method: order.payment_method,
          payment_reference: order.payment_reference,
          deposit_amount: order.deposit_amount,
          is_province: order.is_province,
          transport: order.transport,
          order_status: order.order_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (orderError) {
        console.error('Erreur lors de la sauvegarde de la commande:', orderError)
        throw orderError
      }

      // Mettre à jour le client si nécessaire
      if (customer) {
        const { error: customerError } = await updateCustomer(customer.id, {
          real_name: customer.real_name,
          photo_url: customer.photo_url
        })

        if (customerError) {
          console.error('Erreur lors de la sauvegarde du client:', customerError)
        }
      }

    } catch (err) {
      console.error('Erreur lors de la sauvegarde forcée:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [order, customer, isReadOnly])

  const updateField = useCallback(async (field, value) => {
    // Ne pas permettre les modifications si la commande est confirmée
    if (isReadOnly) {
      return
    }

    const orderFields = ['delivery_mode', 'delivery_date', 'payment_method', 'deposit_amount', 'payment_reference', 'order_status', 'is_province', 'transport']
    const contactFields = ['phone', 'address']

    if (orderFields.includes(field)) {
      // Champ de commande
      setOrder((prev) => ({ ...(prev || {}), [field]: value }))
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaving(true)
        try {
          const { error } = await supabase
            .from('orders')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('id', order.id)

          if (error) {
            console.error('Erreur lors de la mise à jour de la commande:', error)
          }
        } catch (err) {
          console.error('Erreur lors de la mise à jour de la commande:', err)
        } finally {
          setSaving(false)
        }
      }, 500)
    } else if (contactFields.includes(field)) {
      // Champs de contact (téléphone/adresse)
      setCustomer((prev) => ({
        ...(prev || {}),
        [field]: value,
        [`primary_${field === 'phone' ? 'phone' : 'address'}`]: { [field]: value, is_primary: true }
      }))

      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaving(true)
        try {
          if (field === 'phone') {
            await getOrCreateCustomerPhone(customer.id, value, true)
          } else if (field === 'address') {
            await getOrCreateCustomerAddress(customer.id, value, true)
          }
        } catch (err) {
          console.error('Erreur lors de la mise à jour du contact:', err)
        } finally {
          setSaving(false)
        }
      }, 500)
    } else {
      // Champ de client (nom, photo, etc.)
      setCustomer((prev) => ({ ...(prev || {}), [field]: value }))
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaving(true)
        try {
          const { error } = await supabase
            .from('customers')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('id', customer.id)

          if (error) {
            console.error('Erreur lors de la mise à jour du client:', error)
          }
        } catch (err) {
          console.error('Erreur lors de la mise à jour du client:', err)
        } finally {
          setSaving(false)
        }
      }, 500)
    }
  }, [order?.id, customer?.id, isReadOnly])

  const subtotal = useMemo(() => {
    return calculateOrderTotal(order?.lines || [])
  }, [order?.lines])

  const paymentMethods = [
    { value: 'especes', label: t('checkout.paymentMethods.especes') },
    { value: 'mvola', label: t('checkout.paymentMethods.mvola') },
    { value: 'orange_money', label: t('checkout.paymentMethods.orange_money') },
    { value: 'airtel_money', label: t('checkout.paymentMethods.airtel_money') }
  ]

  // Filtrer les modes de paiement selon si c'est en province
  const availablePaymentMethods = order?.is_province 
    ? paymentMethods.filter(method => ['mvola', 'orange_money', 'airtel_money'].includes(method.value))
    : paymentMethods

  // Vérifier si le mode de paiement est Mobile Money
  const isMobileMoney = ['mvola', 'orange_money', 'airtel_money'].includes(order?.payment_method)

  // Vérifier si l'acompte est égal au total
  const isFullyPaid = order?.deposit_amount === subtotal && subtotal > 0

  // Validation pour le checkout - retourne les champs manquants
  const getMissingFields = () => {
    const missing = []

    // Vérification des champs obligatoires de base
    if (!customer?.real_name) {
      missing.push(t('checkout.validation.customerName'))
    }
    
    if (!customer?.primary_phone?.phone) {
      missing.push(t('checkout.validation.phone'))
    }

    if (!customer?.primary_address?.address) {
      missing.push(t('checkout.validation.address'))
    }

    if (!order?.delivery_mode) {
      missing.push(t('checkout.validation.deliveryMode'))
    }

    if (!order?.delivery_date) {
      missing.push(t('checkout.validation.deliveryDate'))
    }

    if (!order?.payment_method) {
      missing.push(t('checkout.validation.paymentMethod'))
    }
    
    // Vérifications spécifiques selon le mode de paiement
    const isMobileMoney = order?.payment_method && order?.payment_method !== 'especes'
    if (isMobileMoney && !order?.payment_reference) {
      missing.push(t('checkout.validation.paymentReference'))
    }
    
    // Vérifications spécifiques pour la province
    if (order?.is_province && !order?.transport) {
      missing.push(t('checkout.validation.transportName'))
    }
    
    // Vérification du montant d'acompte (au moins 50%)
    if (order?.deposit_amount < subtotal * 0.5) {
      missing.push(t('checkout.validation.minimumDeposit'))
    }
    
    return missing
  }

  const canFinalizeCheckout = () => {
    return getMissingFields().length === 0
  }

  if (!order) return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      margin: 0,
      padding: 0
    }}>
      <Typography variant="h6">{t('checkout.messages.loadingOrder')}</Typography>
    </Box>
  )

  // Calculer les étapes du checkout
  const getCompletionStep = () => {
    if (!order?.delivery_date || !order?.delivery_mode || !order?.payment_method) return 0
    
    // Règles d'acompte selon si c'est en province ou non
    if (order?.is_province) {
      // En province, acompte obligatoire > 0
      if (!order?.deposit_amount || order.deposit_amount <= 0) return 2
    } else {
      // Acompte requis seulement si le mode de paiement n'est pas "especes"
      if (order?.payment_method !== 'especes' && (!order?.deposit_amount || order.deposit_amount <= 0)) return 2
    }
    
    return 3
  }

  const steps = [
    t('checkout.steps.personalInfo'),
    t('checkout.steps.deliveryPayment'), 
    t('checkout.steps.deposit'),
    t('checkout.steps.complete')
  ]

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* En-tête moderne avec gradient */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        p: { xs: 2, md: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              width: 48, 
              height: 48,
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}>
              {customer?.tiktok_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t('checkout.title')}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                @{customer?.tiktok_name}
              </Typography>
            </Box>
          </Box>
          
          {/* Stepper de progression */}
          <Stepper activeStep={getCompletionStep()} sx={{ mt: 2 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel sx={{ 
                  '& .MuiStepLabel-label': { 
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  },
                  '& .MuiStepLabel-label.Mui-active': { 
                    color: 'white',
                    fontWeight: 600
                  },
                  '& .MuiStepLabel-label.Mui-completed': { 
                    color: 'rgba(255,255,255,0.9)'
                  }
                }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Box>
      
      {/* Message d'information pour les commandes confirmées */}
      {isReadOnly && (
        <Box sx={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: 2,
          p: 2,
          m: 2,
          mx: 'auto',
          maxWidth: 1200
        }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#856404' }}>
            ⚠️ Cette commande a été confirmée et ne peut plus être modifiée.
          </Typography>
          <Typography variant="body2" sx={{ color: '#856404', mt: 0.5 }}>
            Vous pouvez consulter les détails mais aucune modification n'est possible.
          </Typography>
        </Box>
      )}

      {/* Conteneur principal avec padding et max-width */}
      <Box sx={{ 
        flex: 1, 
        maxWidth: { xs: '100%', md: 1200, lg: 1600, xl: 1800 }, 
        mx: 'auto', 
        p: { xs: 2, md: 3, lg: 4 }, 
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Grid container spacing={{ xs: 2, md: 3, lg: 4 }} sx={{ 
          flexGrow: 1,
          alignItems: 'flex-start',
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%'
        }}>
          {/* Volet gauche - Informations client */}
          <Grid item xs={12} md={4} lg={3} sx={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: { md: '320px' }, // Largeur minimale fixe
            maxWidth: { md: '400px' }  // Largeur maximale pour éviter qu'il soit trop large
          }}>
            <Card sx={{ 
              height: 'fit-content',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              overflow: 'visible'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: getCompletionStep() >= 1 ? 'success.main' : 'grey.300',
                    transition: 'all 0.3s ease'
                  }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {t('checkout.customerInfo')}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label={t('checkout.customerName')}
                    value={customer?.real_name || ''}
                    onChange={(e) => {
                      setCustomer(prev => ({ ...prev, real_name: e.target.value }))
                    }}
                    fullWidth
                    variant="outlined"
                    disabled={isReadOnly}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.25)'
                        }
                      }
                    }}
                    error={!customer?.real_name}
                    helperText={!customer?.real_name ? t('checkout.required') : ''}
                  />
                 
                  <TextField
                    label={t('checkout.phone')}
                    value={customer?.primary_phone?.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    fullWidth
                    variant="outlined"
                    disabled={isReadOnly}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.25)'
                        }
                      }
                    }}
                    error={!customer?.primary_phone?.phone}
                    helperText={!customer?.primary_phone?.phone ? t('checkout.required') : ''}
                  />
                 
                  <TextField
                    label={t('checkout.deliveryAddress')}
                    value={customer?.primary_address?.address || ''}
                    onChange={(e) => updateField('address', e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.25)'
                        }
                      }
                    }}
                    error={!customer?.primary_address?.address}
                    helperText={!customer?.primary_address?.address ? t('checkout.required') : ''}
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={order?.is_province || false}
                        onChange={(e) => {
                          const isProvince = e.target.checked
                          updateField('is_province', isProvince)
                          
                          // Si on coche "Province" et que le mode de paiement actuel est "especes",
                          // le réinitialiser car seuls les modes mobile money sont autorisés en province
                          if (isProvince && order?.payment_method === 'especes') {
                            updateField('payment_method', '')
                          }
                          
                          // Si on décoche "Province", vider le champ transport
                          if (!isProvince && order?.transport) {
                            updateField('transport', '')
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    }
                    label={t('checkout.province')}
                  />
                  
                  {order?.is_province && (
                    <TextField
                      label={t('checkout.transport')}
                      value={order?.transport || ''}
                      onChange={(e) => updateField('transport', e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder={t('checkout.placeholders.transportName')}
                    />
                  )}
                
                  

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                      Mode de livraison
                    </Typography>
                    <RadioGroup
                      value={order?.delivery_mode || ''}
                      onChange={(e) => updateField('delivery_mode', e.target.value)}
                      row
                      disabled={isReadOnly}
                      sx={{ 
                        gap: 1, 
                        flexWrap: 'nowrap',
                        display: 'flex',
                        flexDirection: 'row'
                      }}
                    >
                      <FormControlLabel
                        value="RECUPERATION"
                        control={<Radio />}
                        label={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Récup.
                          </Typography>
                        }
                        sx={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          margin: 0,
                          p: 1,
                          flex: '0 1 auto',
                          minWidth: 'fit-content',
                          maxWidth: 'fit-content',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#f8fafc',
                            borderColor: '#cbd5e1'
                          },
                          '&:has(.Mui-checked)': {
                            backgroundColor: '#eff6ff',
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 0 0 1px ${theme.palette.primary.main}20`
                          }
                        }}
                      />
                      <FormControlLabel
                        value="VIA SERVICE DE LIVRAISON"
                        control={<Radio />}
                        label={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Sce. de livraison
                          </Typography>
                        }
                        sx={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          margin: 0,
                          p: 1,
                          flex: '0 1 auto',
                          minWidth: 'fit-content',
                          maxWidth: 'fit-content',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#f8fafc',
                            borderColor: '#cbd5e1'
                          },
                          '&:has(.Mui-checked)': {
                            backgroundColor: '#eff6ff',
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 0 0 1px ${theme.palette.primary.main}20`
                          }
                        }}
                      />
                    </RadioGroup>
                  </Box>

                                     <TextField
                     label={
                      order?.delivery_mode === 'RECUPERATION'
                        ? t('checkout.messages.pickupDate')
                         : t('checkout.deliveryDate')
                     }
                     type="date"
                    value={order?.delivery_date || ''}
                     onChange={(e) => updateField('delivery_date', e.target.value)}
                     fullWidth
                     variant="outlined"
                     InputLabelProps={{ shrink: true }}
                     inputProps={{
                       min: new Date().toISOString().split('T')[0]
                     }}
                   />
                
                                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                      {t('checkout.paymentMethod')}
                    </Typography>
                    <RadioGroup
                      value={order?.payment_method || ''}
                      onChange={(e) => {
                        const newPaymentMethod = e.target.value
                        updateField('payment_method', newPaymentMethod)

                        // Vider la référence de paiement lors du changement de mode
                        if (order?.payment_reference) {
                          updateField('payment_reference', '')
                        }
                      }}
                      row
                      disabled={isReadOnly}
                      sx={{ gap: 1, flexWrap: 'wrap' }}
                    >
                      {availablePaymentMethods.map((method) => (
                        <FormControlLabel
                          key={method.value}
                          value={method.value}
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {method.label}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            margin: 0,
                            p: 1,
                            flex: '1 1 auto',
                            minWidth: 'fit-content',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#f8fafc',
                              borderColor: '#cbd5e1'
                            },
                            '&:has(.Mui-checked)': {
                              backgroundColor: '#eff6ff',
                              borderColor: theme.palette.primary.main,
                              boxShadow: `0 0 0 1px ${theme.palette.primary.main}20`
                            }
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </Box>
                  
                  <TextField
                    label={t('checkout.deposit')}
                    type="number"
                    value={order?.deposit_amount || 0}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 0
                      updateField('deposit_amount', value)
                      
                      // Note: Le statut "payé" est automatiquement calculé basé sur deposit_amount >= total_amount
                    }}
                    fullWidth
                    variant="outlined"
                    disabled={isReadOnly}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.25)'
                        }
                      }
                    }}
                    inputProps={{
                      min: 0,
                      max: subtotal,
                      step: 100
                    }}
                    error={order?.deposit_amount > subtotal}
                    helperText={
                      order?.deposit_amount > subtotal 
                        ? t('checkout.depositExceedsTotal') 
                        : order?.is_province
                          ? t('checkout.messages.depositRequiredProvince')
                          : order?.payment_method === 'especes' 
                            ? t('checkout.depositOptionalCash')
                            : order?.payment_method && order?.payment_method !== 'especes'
                              ? t('checkout.depositRequired')
                              : ""
                    }
                  />
                  
                  {isMobileMoney && (
                    <TextField
                      label={t('checkout.paymentReference')}
                      value={order?.payment_reference || ''}
                      onChange={(e) => updateField('payment_reference', e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder={t('checkout.placeholders.paymentReference')}
                      required
                    />
                  )}
                  
                                     <FormControlLabel
                      control={
                      <Checkbox
                        checked={isFullyPaid}
                          onChange={(e) => {
                            const checked = e.target.checked
                            
                            // Si on coche "Payé", mettre l'acompte égal au total
                            if (checked && subtotal > 0) {
                              updateField('deposit_amount', subtotal)
                            } else if (!checked) {
                              // Si on décoche "Payé", mettre l'acompte à 0
                              updateField('deposit_amount', 0)
                            }
                          }}
                        disabled={isReadOnly}
                        />
                      }
                      label={t('checkout.paid')}
                    />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                      Statut de la commande
                    </Typography>
                    <Chip 
                      label={order?.order_status || 'CHECKOUT EN COURS'} 
                      color={
                        order?.order_status === 'CONFIRMEE' ? 'success' :
                          order?.order_status === 'CHECKOUT EN COURS' ? 'warning' :
                        'default'
                      }
                      variant="outlined"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        px: 2,
                        py: 0.5
                      }}
                    />
                  </Box>

                  {saving && (
                    <Chip 
                      label={t('checkout.saving')} 
                      color="info" 
                      size="small" 
                      sx={{ alignSelf: 'flex-start' }}
                    />
                  )}
               </Box>
             </CardContent>
           </Card>
         </Grid>

          {/* Volet droit - Commandes */}
          <Grid item xs={12} md={8} lg={9} sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1, // Prend tout l'espace restant
            minWidth: 0 // Permet la shrinking si nécessaire
          }}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              height: 'fit-content'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: order?.lines?.length > 0 ? 'success.main' : 'grey.300',
                    transition: 'all 0.3s ease'
                  }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {t('checkout.orders')} 
                  </Typography>
                  <Chip 
                    label={order?.lines?.length} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
                
                {order?.lines?.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    color: 'text.secondary',
                    border: '2px dashed #e2e8f0',
                    borderRadius: 2,
                    backgroundColor: '#f8fafc'
                  }}>
                    <Typography variant="h6" sx={{ mb: 1, opacity: 0.7 }}>
                      {t('checkout.noOrders')}
                    </Typography>
                    <Typography variant="body2">
                      Aucune commande en attente pour ce client
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer 
                    component={Paper} 
                    className="checkout-table-container"
                    sx={{ 
                      boxShadow: 'none', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Table 
                      className="checkout-table"
                      sx={{ 
                        minWidth: 650,
                        '& .MuiTableHead-root': {
                          backgroundColor: '#f8fafc'
                        }
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Session
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Code
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: '200px' }}>
                            Description
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Prix unitaire
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Quantité
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Sous-total
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                          {order?.lines?.map((line, index) => {
                            const lineTotal = Number(line.unit_price || 0) * Number(line.quantity || 0)
                          return (
                            <TableRow
                              key={line.id}
                              sx={{
                                '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                                '&:hover': { 
                                  backgroundColor: '#f0f9ff',
                                  transition: 'background-color 0.2s ease'
                                },
                                '& td': { borderColor: '#e2e8f0' }
                              }}
                            >
                              <TableCell>
                                <Chip 
                                  label={line.sessions?.name || 'Session inconnue'} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ borderRadius: 1.5 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {line.code}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ maxWidth: '300px' }}>
                                <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                                  {line.description}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {Number(line.unit_price).toLocaleString('fr-FR')} 
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {line.quantity}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {lineTotal.toLocaleString('fr-FR')} 
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {order?.lines?.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Divider sx={{ mb: 3 }} />
                    
                    {/* Récapitulatif financier */}
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: 2,
                      mb: 3
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {t('checkout.subtotal')}
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {subtotal.toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
                          <Typography variant="body2">
                            Acompte versé
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {(order?.deposit_amount || 0).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
                          <Typography variant="body2">
                            Reste à payer
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {(subtotal - (order?.deposit_amount || 0)).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        
                        {order?.payment_method === 'especes' && (!order?.deposit_amount || order.deposit_amount === 0) && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
                            <Typography variant="body2">
                              Mode de paiement
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              Paiement intégral en espèces
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Indicateur de progression du checkout */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progression du checkout
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round((getCompletionStep() / 3) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(getCompletionStep() / 3) * 100}
                        sx={{ 
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                    
                    {/* Bouton de finalisation - masqué pour les commandes confirmées */}
                    {!isReadOnly && (
                      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                        <Button 
                        variant="contained" 
                        size="large"
                        disabled={!canFinalizeCheckout()}
                          onClick={async () => {
                            if (canFinalizeCheckout()) {
                              try {
                                // 1. D'abord, annuler tout auto-save en cours et forcer la sauvegarde
                                if (saveTimer.current) {
                                  clearTimeout(saveTimer.current)
                                }

                                // Utiliser forceSave pour sauvegarder l'état actuel complet
                                await forceSave()

                                // 2. Puis mettre à jour le statut à "CONFIRMEE"
                                const { error: orderError } = await supabase
                                  .from('orders')
                                  .update({
                                    order_status: 'CONFIRMEE',
                                    updated_at: new Date().toISOString()
                                  })
                                  .eq('id', order.id)

                                if (orderError) {
                                  alert('Erreur lors de la finalisation de la commande: ' + orderError.message)
                                  return
                                }

                                // 3. Mettre à jour l'état local
                                setOrder(prev => ({
                                ...prev,
                                order_status: 'CONFIRMEE'
                              }))

                                // Mettre à jour les commandes locales aussi
                                setOrder(prev => prev.lines.map(line => ({
                                  ...line,
                                  status: 'completed'
                                })))

                                alert('Commande finalisée avec succès ! Elle apparaîtra dans la préparation des commandes.')

                                // Redirection vers la liste des commandes en attente
                                setTimeout(() => {
                                  navigate('/pending')
                                }, 1500)
                              } catch (err) {
                                alert('Erreur technique: ' + err.message)
                                setSaving(false)
                              }
                            } else {
                              alert('Veuillez compléter tous les champs obligatoires')
                            }
                          }}
                        sx={{
                          height: 56,
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          width: { xs: '100%', md: 'auto' },
                          minWidth: { md: '250px' },
                          px: { md: 4 },
                          background: canFinalizeCheckout() 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : undefined,
                          '&:hover': canFinalizeCheckout() ? {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                          } : undefined,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {canFinalizeCheckout() 
                          ? t('checkout.finalizeCheckout')
                          : 'Veuillez compléter les informations requises'
                          }
                      </Button>
                      </Box>
                    )}
                    
                    {!canFinalizeCheckout() && !isReadOnly && (
                      <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          {t('checkout.messages.missingFieldsTitle')}
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                          {getMissingFields().map((field, index) => (
                            <Typography
                              key={index}
                              component="li"
                              variant="body2"
                              sx={{ mb: 0.5, color: 'warning.dark' }}
                            >
                              {field}
                            </Typography>
                          ))}
                        </Box>
                      </Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
