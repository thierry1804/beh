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
 * Créer ou récupérer un client pour une vente ordinaire (par nom réel)
 */
export async function getOrCreateCustomerByRealName(realName, phone = null) {
  try {
    console.log('Création client pour vente ordinaire:', realName, phone)

    // D'abord, chercher un client existant avec le même nom réel
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('real_name', realName)
      .limit(1)
      .maybeSingle()

    if (existingCustomer) {
      console.log('Client existant trouvé:', existingCustomer)
      return { data: existingCustomer, error: null }
    }

    // Si pas trouvé, créer un nouveau client
    // Générer un tiktok_name unique basé sur le nom réel pour éviter les conflits
    const tiktokName = `@${realName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}`

    const { data, error } = await supabase
      .from('customers')
      .insert([{ tiktok_name: tiktokName, real_name: realName }])
      .select()
      .single()

    if (error) throw error

    console.log('Nouveau client créé:', data)
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la création du client:', err)
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
    console.log('createOrderWithLines - Lines reçues:', lines)
    console.log('createOrderWithLines - Condition lines:', lines && lines.length > 0)

    if (lines && lines.length > 0) {
      console.log('createOrderWithLines - Lignes reçues:', lines)
      const orderLines = lines.map(line => {
        const unitPrice = parseFloat(line.unit_price)
        const quantity = parseInt(line.quantity)

        if (isNaN(unitPrice) || unitPrice <= 0) {
          throw new Error(`Prix unitaire invalide pour l'article "${line.description}": ${line.unit_price}`)
        }

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Quantité invalide pour l'article "${line.description}": ${line.quantity}`)
        }

        return {
          order_id: order.id,
          code: line.code || 'JP',
          description: line.description,
          unit_price: unitPrice,
          quantity: quantity,
          line_total: unitPrice * quantity
        }
      })

      console.log('createOrderWithLines - Lignes préparées:', orderLines)

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(orderLines)

      if (linesError) {
        console.error('Erreur lors de l\'insertion des lignes:', linesError)
        throw linesError
      }

      console.log('createOrderWithLines - Lignes créées avec succès')
    } else {
      console.warn('createOrderWithLines - Aucune ligne à créer!')
    }

    return { data: order, error: null }
  } catch (err) {
    console.error('Erreur lors de la création de la commande avec détails:', err)
    console.error('Session ID:', sessionId)
    console.error('Customer ID:', customerId)
    console.error('Order data:', orderData)
    console.error('Lines data:', lines)
    return { data: null, error: err }
  }
}

/**
 * Créer une commande simple pour ventes ordinaires (version alternative)
 */
export async function createSimpleOrderWithLines(sessionId, customerId, articles) {
  console.log('=== createSimpleOrderWithLines DÉBUT ===')
  console.log('Session ID:', sessionId)
  console.log('Customer ID:', customerId)
  console.log('Articles reçus:', articles)

  try {
    // 1. Créer la commande
    const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        session_id: sessionId,
        customer_id: customerId,
        order_number: orderNumber,
        order_status: 'CHECKOUT EN COURS'
      }])
      .select()
      .single()

    if (orderError) {
      console.error('Erreur création commande:', orderError)
      throw orderError
    }

    console.log('Commande créée:', order)

    // 2. Créer les lignes une par une avec validation
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      console.log(`--- Article ${i + 1}/${articles.length} ---`)
      console.log('Article brut:', article)

      // Validation stricte
      const unitPrice = parseFloat(article.unit_price)
      const quantity = parseInt(article.quantity)

      console.log('Prix converti:', unitPrice, 'Type:', typeof unitPrice)
      console.log('Quantité convertie:', quantity, 'Type:', typeof quantity)

      if (isNaN(unitPrice) || unitPrice <= 0) {
        console.error(`Prix invalide pour article ${i + 1}:`, article.unit_price)
        continue // Passer au suivant
      }

      if (isNaN(quantity) || quantity <= 0) {
        console.error(`Quantité invalide pour article ${i + 1}:`, article.quantity)
        continue // Passer au suivant
      }

      const lineData = {
        order_id: order.id,
        code: article.code || 'JP',
        description: article.description || `Article ${i + 1}`,
        unit_price: unitPrice,
        quantity: quantity,
        line_total: unitPrice * quantity
      }

      console.log('🔍 Données ligne à insérer (stringifiées):', JSON.stringify(lineData, null, 2))
      console.log('🔍 Types:', {
        unit_price: typeof lineData.unit_price,
        quantity: typeof lineData.quantity,
        line_total: typeof lineData.line_total
      })

      // Double-vérification avant insertion
      if (!lineData.unit_price || lineData.unit_price <= 0) {
        console.error('❌ ARRÊT: unit_price invalide avant insertion:', lineData.unit_price)
        continue
      }

      const { error: lineError } = await supabase
        .from('order_lines')
        .insert([{
          order_id: lineData.order_id,
          code: lineData.code,
          description: lineData.description,
          unit_price: Number(lineData.unit_price), // Force conversion
          quantity: Number(lineData.quantity),     // Force conversion  
          line_total: Number(lineData.line_total)  // Force conversion
        }])

      if (lineError) {
        console.error(`Erreur insertion ligne ${i + 1}:`, lineError)
      } else {
        console.log(`✅ Ligne ${i + 1} créée avec succès`)
      }
    }

    console.log('=== createSimpleOrderWithLines SUCCÈS ===')
    return { data: order, error: null }

  } catch (err) {
    console.error('=== createSimpleOrderWithLines ERREUR ===')
    console.error('Erreur:', err)
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
