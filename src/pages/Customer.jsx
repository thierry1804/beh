import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function CustomerPage() {
  const { handle } = useParams()
  const [customer, setCustomer] = useState(null)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => { void loadOrCreate() }, [handle])

  async function loadOrCreate() {
    if (!handle) return
    // Utiliser upsert pour éviter les conflits de contrainte d'unicité
    const { data, error } = await supabase
      .from('customers')
      .upsert([{ tiktok_name: handle }], {
        onConflict: 'tiktok_name',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors du chargement/création du client:', error)
      return
    }

    setCustomer(data)
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
          .eq('tiktok_name', handle)

        if (error) {
          console.error('Erreur lors de la mise à jour:', error)
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour:', err)
      } finally {
        setSaving(false)
      }
    }, 500)
  }, [handle])

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !customer) return
    const filePath = `${customer.id || customer.tiktok_name}-${Date.now()}-${file.name}`
    const { data: uploadData, error } = await supabase.storage.from('receipts').upload(filePath, file, { upsert: true })
    if (!error && uploadData?.path) {
      const { data: publicUrl } = supabase.storage.from('receipts').getPublicUrl(uploadData.path)
      updateField('photo_url', publicUrl.publicUrl)
    }
  }

  const fields = useMemo(() => ([
    { key: 'real_name', label: 'Nom réel' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'address', label: 'Adresse de livraison' },
    { key: 'delivery_pref', label: 'Préférence livraison (J+1, J+2, express)' },
    { key: 'payment_method', label: 'Mode de paiement (MoMo, espèces, OM, carte, …)' },
  ]), [])

  if (!customer) return <div className="page"><div className="card"><div className="card__body">Chargement…</div></div></div>

  return (
    <div className="page">
      <div className="card">
        <div className="card__header">
          <h2 style={{ margin: 0 }}>Fiche client</h2>
          <div style={{ color: '#9aa3b2' }}>Pseudo: <strong>{customer.tiktok_name}</strong> {saving && <em style={{ marginLeft: 8 }}>(enregistrement…)</em>}</div>
        </div>
        <div className="card__body">
          <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
            {fields.map((f) => (
              <div key={f.key} className="form-row">
                <label>{f.label}</label>
                <input className="input" value={customer[f.key] || ''} onChange={(e) => updateField(f.key, e.target.value)} />
              </div>
            ))}

            <div className="form-row">
              <label>Acompte</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label><input type="checkbox" checked={!!customer.deposit_enabled} onChange={(e) => updateField('deposit_enabled', e.target.checked)} /> Acompte versé</label>
                <input className="input" type="number" step="1" value={customer.deposit_amount || 0} onChange={(e) => updateField('deposit_amount', Number(e.target.value || 0))} placeholder="Montant" style={{ width: 160 }} />
              </div>
            </div>

            <div className="form-row">
              <label>Photo / capture d’écran</label>
              <div>
                <input className="input" type="file" accept="image/*" onChange={onFileChange} />
                {customer.photo_url && (
                  <div style={{ marginTop: 8 }}>
                    <img src={customer.photo_url} alt="Justificatif" style={{ maxWidth: 240, borderRadius: 10, border: '1px solid var(--border)' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


