import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
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

export default function CheckoutPage() {
  const { orderId } = useParams()
  const { t } = useTranslation()
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => { 
    void loadCustomerAndOrders() 
  }, [orderId])

  async function loadCustomerAndOrders() {
    if (!orderId) return
    
    // Charger la commande spécifique et les informations du client
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, 
        tiktok_name, 
        code, 
        description, 
        unit_price, 
        quantity, 
        status,
        created_at,
        sessions!inner(name)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Erreur lors du chargement de la commande:', orderError)
      return
    }

    // Charger ou créer le client
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .upsert([{ tiktok_name: orderData.tiktok_name }], {
        onConflict: 'tiktok_name',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (customerError) {
      console.error('Erreur lors du chargement du client:', customerError)
      return
    }

    // Initialiser le statut de la commande et le mode de livraison par défaut si ce n'est pas déjà fait
    const updatedCustomerData = {
      ...customerData,
      order_status: customerData.order_status || 'CHECKOUT EN COURS',
      delivery_mode: customerData.delivery_mode || 'VIA SERVICE DE LIVRAISON'
    }
    
    setCustomer(updatedCustomerData)
    
    // Mettre à jour les valeurs par défaut dans la base si nécessaire
    const updates = {}
    if (!customerData.order_status) {
      updates.order_status = 'CHECKOUT EN COURS'
    }
    if (!customerData.delivery_mode) {
      updates.delivery_mode = 'VIA SERVICE DE LIVRAISON'
    }
    
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('customers')
        .update(updates)
        .eq('tiktok_name', customerData.tiktok_name)
    }

    // Charger toutes les commandes en attente pour ce client
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, 
        tiktok_name, 
        code, 
        description, 
        unit_price, 
        quantity, 
        status,
        created_at,
        sessions!inner(name)
      `)
      .eq('tiktok_name', orderData.tiktok_name)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Erreur lors du chargement des commandes:', ordersError)
      return
    }

    setOrders(ordersData || [])
  }

  const updateField = useCallback((field, value) => {
    setCustomer((prev) => ({ ...(prev || {}), [field]: value }))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        const { error } = await supabase
          .from('customers')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('tiktok_name', customer.tiktok_name)

        if (error) {
          console.error('Erreur lors de la mise à jour:', error)
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour:', err)
      } finally {
        setSaving(false)
      }
    }, 500)
  }, [customer?.tiktok_name])

  const subtotal = useMemo(() => {
    return orders.reduce((sum, order) => {
      return sum + (Number(order.unit_price || 0) * Number(order.quantity || 0))
    }, 0)
  }, [orders])

  const paymentMethods = [
    { value: 'especes', label: t('checkout.paymentMethods.especes') },
    { value: 'mvola', label: t('checkout.paymentMethods.mvola') },
    { value: 'orange_money', label: t('checkout.paymentMethods.orange_money') },
    { value: 'airtel_money', label: t('checkout.paymentMethods.airtel_money') }
  ]

  // Filtrer les modes de paiement selon si c'est en province
  const availablePaymentMethods = customer?.is_province 
    ? paymentMethods.filter(method => ['mvola', 'orange_money', 'airtel_money'].includes(method.value))
    : paymentMethods

  // Vérifier si le mode de paiement est Mobile Money
  const isMobileMoney = ['mvola', 'orange_money', 'airtel_money'].includes(customer?.payment_method)

  // Vérifier si l'acompte est égal au total
  const isFullyPaid = customer?.deposit_amount === subtotal && subtotal > 0

  // Validation pour le checkout
  const canFinalizeCheckout = () => {
    // Vérification des champs obligatoires de base
    if (!customer?.real_name || !customer?.phone || !customer?.address || !customer?.delivery_date || !customer?.delivery_mode || !customer?.payment_method) {
      return false
    }
    
    // Règles spéciales pour les commandes en province
    if (customer?.is_province) {
      // En province, seuls les modes de paiement mobile money sont autorisés
      if (!['mvola', 'orange_money', 'airtel_money'].includes(customer?.payment_method)) {
        return false
      }
      
      // En province, l'acompte est obligatoire et doit être > 0
      if (!customer?.deposit_amount || customer.deposit_amount <= 0) {
        return false
      }
    } else {
      // Acompte requis seulement si le mode de paiement n'est pas "especes"
      if (customer?.payment_method !== 'especes') {
        if (!customer?.deposit_amount || customer.deposit_amount <= 0) {
          return false
        }
      }
    }
    
    // Acompte ne doit pas dépasser le total (si un acompte est saisi)
    if (customer?.deposit_amount && customer.deposit_amount > subtotal) {
      return false
    }
    
    // Référence de paiement requise pour Mobile Money
    if (isMobileMoney && (!customer?.payment_reference || customer.payment_reference.trim() === '')) {
      return false
    }
    
    // Si "Payé" est coché, acompte doit être égal au total (si un acompte est saisi)
    if (customer?.fully_paid && customer?.deposit_amount && customer.deposit_amount !== subtotal) {
      return false
    }
    
    return true
  }

  if (!customer) return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      margin: 0,
      padding: 0
    }}>
      <Typography variant="h6">Chargement...</Typography>
    </Box>
  )

  // Calculer les étapes du checkout
  const getCompletionStep = () => {
    if (!customer?.real_name || !customer?.phone || !customer?.address) return 0
    if (!customer?.delivery_date || !customer?.delivery_mode || !customer?.payment_method) return 1
    
    // Règles d'acompte selon si c'est en province ou non
    if (customer?.is_province) {
      // En province, acompte obligatoire > 0
      if (!customer?.deposit_amount || customer.deposit_amount <= 0) return 2
    } else {
      // Acompte requis seulement si le mode de paiement n'est pas "especes"
      if (customer?.payment_method !== 'especes' && (!customer?.deposit_amount || customer.deposit_amount <= 0)) return 2
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
              {customer.tiktok_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t('checkout.title')}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                @{customer.tiktok_name}
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
                    value={customer.real_name || ''}
                    onChange={(e) => updateField('real_name', e.target.value)}
                    fullWidth
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
                    error={!customer.real_name}
                    helperText={!customer.real_name ? t('checkout.required') : ''}
                  />
                 
                  <TextField
                    label={t('checkout.phone')}
                    value={customer.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    fullWidth
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
                    error={!customer.phone}
                    helperText={!customer.phone ? t('checkout.required') : ''}
                  />
                 
                  <TextField
                    label={t('checkout.deliveryAddress')}
                    value={customer.address || ''}
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
                    error={!customer.address}
                    helperText={!customer.address ? t('checkout.required') : ''}
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={customer?.is_province || false}
                        onChange={(e) => {
                          const isProvince = e.target.checked
                          updateField('is_province', isProvince)
                          
                          // Si on coche "Province" et que le mode de paiement actuel est "especes",
                          // le réinitialiser car seuls les modes mobile money sont autorisés en province
                          if (isProvince && customer?.payment_method === 'especes') {
                            updateField('payment_method', '')
                          }
                          
                          // Si on décoche "Province" et qu'il n'y a pas de mode de paiement sélectionné,
                          // ne rien faire (laisser l'utilisateur choisir)
                        }}
                      />
                    }
                    label={t('checkout.province')}
                  />
                  
                  {customer?.is_province && (
                    <TextField
                      label={t('checkout.transport')}
                      value={customer.transport || ''}
                      onChange={(e) => updateField('transport', e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder="Nom du transporteur"
                    />
                  )}
                
                  

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                      Mode de livraison
                    </Typography>
                    <RadioGroup
                      value={customer.delivery_mode || ''}
                      onChange={(e) => updateField('delivery_mode', e.target.value)}
                      row
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
                       customer?.delivery_mode === 'RECUPERATION' 
                         ? 'Date de récupération' 
                         : t('checkout.deliveryDate')
                     }
                     type="date"
                     value={customer.delivery_date || ''}
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
                      value={customer.payment_method || ''}
                      onChange={(e) => updateField('payment_method', e.target.value)}
                      row
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
                    value={customer?.deposit_amount || 0}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 0
                      updateField('deposit_amount', value)
                      
                      // Si l'acompte est égal au total, cocher automatiquement "Payé"
                      if (value === subtotal && subtotal > 0) {
                        updateField('fully_paid', true)
                      } else if (customer?.fully_paid && value !== subtotal) {
                        // Si "Payé" était coché mais l'acompte ne correspond plus au total, décocher
                        updateField('fully_paid', false)
                      }
                    }}
                    fullWidth
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
                    inputProps={{
                      min: 0,
                      max: subtotal,
                      step: 100
                    }}
                    error={customer?.deposit_amount > subtotal}
                    helperText={
                      customer?.deposit_amount > subtotal 
                        ? t('checkout.depositExceedsTotal') 
                        : customer?.is_province
                          ? "Acompte obligatoire pour les commandes en province"
                          : customer?.payment_method === 'especes' 
                            ? t('checkout.depositOptionalCash')
                            : customer?.payment_method && customer?.payment_method !== 'especes'
                              ? t('checkout.depositRequired')
                              : ""
                    }
                  />
                  
                  {isMobileMoney && (
                    <TextField
                      label={t('checkout.paymentReference')}
                      value={customer?.payment_reference || ''}
                      onChange={(e) => updateField('payment_reference', e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder="Numéro de transaction"
                      required
                    />
                  )}
                  
                                     <FormControlLabel
                      control={
                        <Checkbox
                          checked={customer?.fully_paid || false}
                          onChange={(e) => {
                            const checked = e.target.checked
                            updateField('fully_paid', checked)
                            
                            // Si on coche "Payé", mettre l'acompte égal au total
                            if (checked && subtotal > 0) {
                              updateField('deposit_amount', subtotal)
                            }
                          }}
                          disabled={!isFullyPaid && customer?.deposit_amount !== subtotal}
                        />
                      }
                      label={t('checkout.paid')}
                    />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                      Statut de la commande
                    </Typography>
                    <Chip 
                      label={customer?.order_status || 'CHECKOUT EN COURS'} 
                      color={
                        customer?.order_status === 'CONFIRMEE' ? 'success' :
                        customer?.order_status === 'CHECKOUT EN COURS' ? 'warning' :
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
                    bgcolor: orders.length > 0 ? 'success.main' : 'grey.300',
                    transition: 'all 0.3s ease'
                  }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {t('checkout.orders')} 
                  </Typography>
                  <Chip 
                    label={orders.length} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
                
                {orders.length === 0 ? (
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
                        {orders.map((order, index) => {
                          const orderTotal = Number(order.unit_price || 0) * Number(order.quantity || 0)
                          return (
                            <TableRow
                              key={order.id}
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
                                  label={order.sessions?.name || 'Session inconnue'} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ borderRadius: 1.5 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {order.code}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ maxWidth: '300px' }}>
                                <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                                  {order.description}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {Number(order.unit_price).toLocaleString('fr-FR')} 
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {order.quantity}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {orderTotal.toLocaleString('fr-FR')} 
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {orders.length > 0 && (
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
                            {(customer?.deposit_amount || 0).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
                          <Typography variant="body2">
                            Reste à payer
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {(subtotal - (customer?.deposit_amount || 0)).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        
                        {customer?.payment_method === 'especes' && (!customer?.deposit_amount || customer.deposit_amount === 0) && (
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
                    
                    {/* Bouton de finalisation */}
                    <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                      <Button 
                        variant="contained" 
                        size="large"
                        disabled={!canFinalizeCheckout()}
                                              onClick={async () => {
                        if (canFinalizeCheckout()) {
                          try {
                            // Mettre à jour le statut de la commande à "CONFIRMEE"
                            const { error } = await supabase
                              .from('customers')
                              .update({ 
                                order_status: 'CONFIRMEE',
                                updated_at: new Date().toISOString()
                              })
                              .eq('tiktok_name', customer.tiktok_name)

                            if (error) {
                              console.error('Erreur lors de la finalisation:', error)
                            } else {
                              // Mettre à jour l'état local
                              setCustomer(prev => ({
                                ...prev,
                                order_status: 'CONFIRMEE'
                              }))
                              console.log('Checkout finalisé avec succès')
                            }
                          } catch (err) {
                            console.error('Erreur lors de la finalisation:', err)
                          }
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
                    
                    {!canFinalizeCheckout() && (
                      <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2">
                          Complétez toutes les informations obligatoires pour finaliser la commande.
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          Debug: Mode={customer?.payment_method}, Livraison={customer?.delivery_mode}, Acompte={customer?.deposit_amount}, 
                          Nom={!!customer?.real_name}, Tél={!!customer?.phone}, 
                          Adresse={!!customer?.address}, Date={!!customer?.delivery_date}
                        </Typography>
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
