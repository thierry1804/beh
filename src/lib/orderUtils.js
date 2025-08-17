import { supabase } from './supabaseClient'

/**
 * Créer ou récupérer un client
 */
export async function getOrCreateCustomer(tiktokName, realName = null) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .upsert([{ tiktok_name: tiktokName, real_name: realName }], {
        onConflict: 'tiktok_name',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la création/récupération du client:', err)
    return { data: null, error: err }
  }
}

/**
 * Créer ou récupérer un téléphone pour un client
 */
export async function getOrCreateCustomerPhone(customerId, phone) {
  if (!phone || !phone.trim()) return { data: null, error: null }

  try {
    // Vérifier si le téléphone existe déjà
    const { data: existingPhone } = await supabase
      .from('customer_phones')
      .select('id')
      .eq('customer_id', customerId)
      .eq('phone', phone.trim())
      .single()

    if (existingPhone) {
      return { data: existingPhone, error: null }
    }

    // Vérifier s'il y a déjà un téléphone principal
    const { data: primaryPhone } = await supabase
      .from('customer_phones')
      .select('id')
      .eq('customer_id', customerId)
      .eq('is_primary', true)
      .single()

    // Créer le nouveau téléphone
    const { data, error } = await supabase
      .from('customer_phones')
      .insert([{
        customer_id: customerId,
        phone: phone.trim(),
        is_primary: !primaryPhone // Principal si c'est le premier
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la création du téléphone:', err)
    return { data: null, error: err }
  }
}

/**
 * Créer ou récupérer une adresse pour un client
 */
export async function getOrCreateCustomerAddress(customerId, address) {
  if (!address || !address.trim()) return { data: null, error: null }

  try {
    // Vérifier si l'adresse existe déjà
    const { data: existingAddress } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customerId)
      .eq('address', address.trim())
      .single()

    if (existingAddress) {
      return { data: existingAddress, error: null }
    }

    // Vérifier s'il y a déjà une adresse principale
    const { data: primaryAddress } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customerId)
      .eq('is_primary', true)
      .single()

    // Créer la nouvelle adresse
    const { data, error } = await supabase
      .from('customer_addresses')
      .insert([{
        customer_id: customerId,
        address: address.trim(),
        is_primary: !primaryAddress // Principale si c'est la première
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la création de l\'adresse:', err)
    return { data: null, error: err }
  }
}

/**
 * Créer une commande avec ses lignes
 */
export async function createOrderWithLines(sessionId, customerId, orderData, lines) {
  try {
    // 1. Créer la commande
    const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        session_id: sessionId,
        customer_id: customerId,
        customer_phone_id: orderData.customer_phone_id,
        customer_address_id: orderData.customer_address_id,
        order_number: orderNumber,
        delivery_date: orderData.delivery_date,
        delivery_mode: orderData.delivery_mode,
        payment_method: orderData.payment_method,
        payment_reference: orderData.payment_reference,
        deposit_amount: orderData.deposit_amount || 0,
        is_province: orderData.is_province || false,
        transport: orderData.transport,
        order_status: orderData.order_status || 'CREEE'
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // 2. Créer les lignes de commande
    if (lines && lines.length > 0) {
      const orderLines = lines.map(line => ({
        order_id: order.id,
        code: line.code,
        description: line.description,
        unit_price: line.unit_price,
        quantity: line.quantity,
        line_total: line.unit_price * line.quantity
      }))

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(orderLines)

      if (linesError) throw linesError
    }

    return { data: order, error: null }
  } catch (err) {
    console.error('Erreur lors de la création de la commande:', err)
    return { data: null, error: err }
  }
}

/**
 * Ajouter une ligne à une commande existante
 */
export async function addLineToOrder(orderId, lineData) {
  try {
    const { data, error } = await supabase
      .from('order_lines')
      .insert([{
        order_id: orderId,
        code: lineData.code,
        description: lineData.description,
        unit_price: lineData.unit_price,
        quantity: lineData.quantity,
        line_total: lineData.unit_price * lineData.quantity
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de l\'ajout de la ligne:', err)
    return { data: null, error: err }
  }
}

/**
 * Charger une commande avec ses lignes et informations client
 */
export async function loadOrderWithDetails(orderId) {
  try {
    // Charger la commande avec les détails
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        sessions!inner(name, status),
        customers!inner(tiktok_name, real_name, photo_url)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    // Charger les lignes de commande
    const { data: lines, error: linesError } = await supabase
      .from('order_lines')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (linesError) throw linesError

    return {
      data: {
        ...order,
        lines: lines || []
      },
      error: null
    }
  } catch (err) {
    console.error('Erreur lors du chargement de la commande:', err)
    return { data: null, error: err }
  }
}

/**
 * Charger toutes les commandes d'un client
 */
export async function loadCustomerOrders(customerId, status = null) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        sessions!inner(name, status),
        customer_phones!inner(phone),
        customer_addresses!inner(address)
      `)
      .eq('customer_id', customerId)

    if (status) {
      query = query.eq('order_status', status)
    }

    const { data: orders, error: ordersError } = await query
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Charger les lignes pour chaque commande
    const ordersWithLines = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: lines } = await supabase
          .from('order_lines')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true })

        return {
          ...order,
          lines: lines || []
        }
      })
    )

    return { data: ordersWithLines, error: null }
  } catch (err) {
    console.error('Erreur lors du chargement des commandes client:', err)
    return { data: null, error: err }
  }
}

/**
 * Mettre à jour le statut d'une commande
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut:', err)
    return { data: null, error: err }
  }
}

/**
 * Mettre à jour le statut d'une ligne de commande
 */
export async function updateLineStatus(lineId, status) {
  try {
    const { data, error } = await supabase
      .from('order_lines')
      .update({ status })
      .eq('id', lineId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut de ligne:', err)
    return { data: null, error: err }
  }
}

/**
 * Calculer le total d'une commande
 */
export function calculateOrderTotal(lines) {
  return (lines || []).reduce((total, line) => {
    return total + (Number(line.line_total) || 0)
  }, 0)
}

/**
 * Vérifier si une commande peut être finalisée
 */
export function canFinalizeOrder(order, lines) {
  if (!order || !lines || lines.length === 0) return false
  
  const total = calculateOrderTotal(lines)
  const deposit = Number(order.deposit_amount) || 0
  
  // Vérifier que l'acompte couvre au moins 50% du total
  return deposit >= total * 0.5
}
