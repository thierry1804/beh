import { supabase } from './supabaseClient'

/**
 * Charger un client avec tous ses contacts
 */
export async function loadCustomerWithContacts(customerId) {
  try {
    // Charger le client
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError) throw customerError

    // Charger les téléphones
    const { data: phones, error: phonesError } = await supabase
      .from('customer_phones')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (phonesError) throw phonesError

    // Charger les adresses
    const { data: addresses, error: addressesError } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (addressesError) throw addressesError

    // Extraire les contacts principaux
    const primaryPhone = (phones || []).find(p => p.is_primary) || (phones || [])[0] || null
    const primaryAddress = (addresses || []).find(a => a.is_primary) || (addresses || [])[0] || null

    return {
      data: {
        ...customer,
        phones: phones || [],
        addresses: addresses || [],
        primary_phone: primaryPhone,
        primary_address: primaryAddress
      },
      error: null
    }
  } catch (err) {
    console.error('Erreur lors du chargement du client:', err)
    return { data: null, error: err }
  }
}

/**
 * Charger un client par tiktok_name avec tous ses contacts
 */
export async function loadCustomerByTiktokName(tiktokName) {
  try {
    // Charger le client
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('tiktok_name', tiktokName)
      .single()

    if (customerError) throw customerError

    // Charger les téléphones
    const { data: phones, error: phonesError } = await supabase
      .from('customer_phones')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (phonesError) throw phonesError

    // Charger les adresses
    const { data: addresses, error: addressesError } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (addressesError) throw addressesError

    return {
      data: {
        ...customer,
        phones: phones || [],
        addresses: addresses || []
      },
      error: null
    }
  } catch (err) {
    console.error('Erreur lors du chargement du client:', err)
    return { data: null, error: err }
  }
}

/**
 * Mettre à jour les informations de base d'un client
 */
export async function updateCustomer(customerId, updates) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la mise à jour du client:', err)
    return { data: null, error: err }
  }
}

/**
 * Ajouter un téléphone à un client
 */
export async function addCustomerPhone(customerId, phone, isPrimary = false) {
  try {
    // Si c'est le nouveau téléphone principal, déclasser les autres
    if (isPrimary) {
      await supabase
        .from('customer_phones')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('is_primary', true)
    }

    const { data, error } = await supabase
      .from('customer_phones')
      .insert([{
        customer_id: customerId,
        phone: phone.trim(),
        is_primary: isPrimary
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de l\'ajout du téléphone:', err)
    return { data: null, error: err }
  }
}

/**
 * Mettre à jour un téléphone
 */
export async function updateCustomerPhone(phoneId, updates) {
  try {
    // Si on change le statut principal, déclasser les autres
    if (updates.is_primary) {
      const { data: phone } = await supabase
        .from('customer_phones')
        .select('customer_id')
        .eq('id', phoneId)
        .single()

      if (phone) {
        await supabase
          .from('customer_phones')
          .update({ is_primary: false })
          .eq('customer_id', phone.customer_id)
          .eq('is_primary', true)
          .neq('id', phoneId)
      }
    }

    const { data, error } = await supabase
      .from('customer_phones')
      .update(updates)
      .eq('id', phoneId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la mise à jour du téléphone:', err)
    return { data: null, error: err }
  }
}

/**
 * Supprimer un téléphone
 */
export async function deleteCustomerPhone(phoneId) {
  try {
    const { error } = await supabase
      .from('customer_phones')
      .delete()
      .eq('id', phoneId)

    if (error) throw error
    return { data: true, error: null }
  } catch (err) {
    console.error('Erreur lors de la suppression du téléphone:', err)
    return { data: null, error: err }
  }
}

/**
 * Ajouter une adresse à un client
 */
export async function addCustomerAddress(customerId, address, isPrimary = false) {
  try {
    // Si c'est la nouvelle adresse principale, déclasser les autres
    if (isPrimary) {
      await supabase
        .from('customer_addresses')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('is_primary', true)
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .insert([{
        customer_id: customerId,
        address: address.trim(),
        is_primary: isPrimary
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de l\'ajout de l\'adresse:', err)
    return { data: null, error: err }
  }
}

/**
 * Mettre à jour une adresse
 */
export async function updateCustomerAddress(addressId, updates) {
  try {
    // Si on change le statut principal, déclasser les autres
    if (updates.is_primary) {
      const { data: address } = await supabase
        .from('customer_addresses')
        .select('customer_id')
        .eq('id', addressId)
        .single()

      if (address) {
        await supabase
          .from('customer_addresses')
          .update({ is_primary: false })
          .eq('customer_id', address.customer_id)
          .eq('is_primary', true)
          .neq('id', addressId)
      }
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .update(updates)
      .eq('id', addressId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'adresse:', err)
    return { data: null, error: err }
  }
}

/**
 * Supprimer une adresse
 */
export async function deleteCustomerAddress(addressId) {
  try {
    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)

    if (error) throw error
    return { data: true, error: null }
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'adresse:', err)
    return { data: null, error: err }
  }
}

/**
 * Rechercher des clients par nom ou tiktok_name
 */
export async function searchCustomers(query) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        customer_phones!inner(phone, is_primary),
        customer_addresses!inner(address, is_primary)
      `)
      .or(`tiktok_name.ilike.%${query}%,real_name.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Traiter les données pour extraire les contacts principaux
    const processedCustomers = (data || []).map(customer => {
      const primaryPhone = customer.customer_phones?.find(p => p.is_primary)
      const primaryAddress = customer.customer_addresses?.find(a => a.is_primary)

      return {
        ...customer,
        phone: primaryPhone?.phone || null,
        address: primaryAddress?.address || null,
        customer_phones: undefined,
        customer_addresses: undefined
      }
    })

    return { data: processedCustomers, error: null }
  } catch (err) {
    console.error('Erreur lors de la recherche des clients:', err)
    return { data: null, error: err }
  }
}

/**
 * Obtenir le téléphone principal d'un client
 */
export function getPrimaryPhone(customer) {
  if (!customer || !customer.phones) return null
  return customer.phones.find(p => p.is_primary)?.phone || customer.phones[0]?.phone || null
}

/**
 * Obtenir l'adresse principale d'un client
 */
export function getPrimaryAddress(customer) {
  if (!customer || !customer.addresses) return null
  return customer.addresses.find(a => a.is_primary)?.address || customer.addresses[0]?.address || null
}

/**
 * Créer ou récupérer un téléphone pour un client
 */
export async function getOrCreateCustomerPhone(customerId, phone, isPrimary = false) {
  if (!phone || !phone.trim()) {
    return { data: null, error: null }
  }

  try {
    // Chercher un téléphone existant avec ce numéro
    const { data: existingPhone, error: findError } = await supabase
      .from('customer_phones')
      .select('*')
      .eq('customer_id', customerId)
      .eq('phone', phone.trim())
      .maybeSingle()

    if (findError) throw findError

    if (existingPhone) {
      // Si on veut le définir comme principal et qu'il ne l'est pas déjà
      if (isPrimary && !existingPhone.is_primary) {
        // D'abord, retirer le statut principal des autres téléphones
        await supabase
          .from('customer_phones')
          .update({ is_primary: false })
          .eq('customer_id', customerId)
          .eq('is_primary', true)

        // Puis définir celui-ci comme principal
        const { data: updatedPhone, error: updateError } = await supabase
          .from('customer_phones')
          .update({ is_primary: true })
          .eq('id', existingPhone.id)
          .select()
          .single()

        if (updateError) throw updateError
        return { data: updatedPhone, error: null }
      }
      
      return { data: existingPhone, error: null }
    }

    // Si on veut créer un téléphone principal, d'abord retirer le statut des autres
    if (isPrimary) {
      await supabase
        .from('customer_phones')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('is_primary', true)
    }

    // Créer un nouveau téléphone
    return await addCustomerPhone(customerId, phone, isPrimary)
  } catch (err) {
    console.error('Erreur lors de la création/récupération du téléphone:', err)
    return { data: null, error: err }
  }
}

/**
 * Créer ou récupérer une adresse pour un client
 */
export async function getOrCreateCustomerAddress(customerId, address, isPrimary = false) {
  if (!address || !address.trim()) {
    return { data: null, error: null }
  }

  try {
    // Chercher une adresse existante avec ce texte
    const { data: existingAddress, error: findError } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .eq('address', address.trim())
      .maybeSingle()

    if (findError) throw findError

    if (existingAddress) {
      // Si on veut la définir comme principale et qu'elle ne l'est pas déjà
      if (isPrimary && !existingAddress.is_primary) {
        // D'abord, retirer le statut principal des autres adresses
        await supabase
          .from('customer_addresses')
          .update({ is_primary: false })
          .eq('customer_id', customerId)
          .eq('is_primary', true)

        // Puis définir celle-ci comme principale
        const { data: updatedAddress, error: updateError } = await supabase
          .from('customer_addresses')
          .update({ is_primary: true })
          .eq('id', existingAddress.id)
          .select()
          .single()

        if (updateError) throw updateError
        return { data: updatedAddress, error: null }
      }
      
      return { data: existingAddress, error: null }
    }

    // Si on veut créer une adresse principale, d'abord retirer le statut des autres
    if (isPrimary) {
      await supabase
        .from('customer_addresses')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('is_primary', true)
    }

    // Créer une nouvelle adresse
    return await addCustomerAddress(customerId, address, isPrimary)
  } catch (err) {
    console.error('Erreur lors de la création/récupération de l\'adresse:', err)
    return { data: null, error: err }
  }
}

/**
 * Charger tous les clients avec leurs contacts principaux
 */
export async function loadAllCustomersWithPrimaryContacts() {
  try {
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (customersError) throw customersError

    // Pour chaque client, récupérer ses contacts principaux
    const customersWithContacts = await Promise.all(
      (customers || []).map(async (customer) => {
        // Téléphone principal
        const { data: primaryPhone } = await supabase
          .from('customer_phones')
          .select('phone')
          .eq('customer_id', customer.id)
          .eq('is_primary', true)
          .maybeSingle()

        // Adresse principale
        const { data: primaryAddress } = await supabase
          .from('customer_addresses')
          .select('address')
          .eq('customer_id', customer.id)
          .eq('is_primary', true)
          .maybeSingle()

        return {
          ...customer,
          primary_phone: primaryPhone?.phone || null,
          primary_address: primaryAddress?.address || null
        }
      })
    )

    return { data: customersWithContacts, error: null }
  } catch (err) {
    console.error('Erreur lors du chargement des clients:', err)
    return { data: null, error: err }
  }
}

/**
 * Charger l'historique des commandes d'un client
 */
export async function loadCustomerOrders(customerId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_date,
        order_status,
        total_amount,
        deposit_amount,
        delivery_mode,
        created_at
      `)
      .eq('customer_id', customerId)
      .order('order_date', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Erreur lors du chargement des commandes:', err)
    return { data: null, error: err }
  }
}

/**
 * Supprimer un client et toutes ses données associées
 */
export async function deleteCustomer(customerId) {
  try {
    // Vérifier s'il y a des commandes
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', customerId)
      .limit(1)

    if (orders && orders.length > 0) {
      throw new Error('Impossible de supprimer un client qui a des commandes')
    }

    // Supprimer les téléphones
    await supabase
      .from('customer_phones')
      .delete()
      .eq('customer_id', customerId)

    // Supprimer les adresses
    await supabase
      .from('customer_addresses')
      .delete()
      .eq('customer_id', customerId)

    // Supprimer le client
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)

    if (error) throw error

    return { error: null }
  } catch (err) {
    console.error('Erreur lors de la suppression du client:', err)
    return { error: err }
  }
}
