import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function QuickOrderModal({ open, onClose, onSubmit, knownHandles = [], existingCodes = [] }) {
  const { t } = useTranslation()
  const [tiktokName, setTiktokName] = useState('')
  const [code, setCode] = useState('JP')
  const [description, setDescription] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [codeError, setCodeError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
      setCode('JP')
      setCodeError('')
    }
  }, [open])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const handleSubmit = (e) => {
    e?.preventDefault()
    const parsedPrice = Number(unitPrice)

    // Vérifier l'unicité du code
    const trimmedCode = code.trim() || 'JP'
    if (existingCodes.includes(trimmedCode)) {
      setCodeError(t('capture.codeExistsError'))
      return
    }

    if (!tiktokName.trim() || !description.trim() || Number.isNaN(parsedPrice) || quantity <= 0) return

    onSubmit?.({ tiktokName: tiktokName.trim(), code: trimmedCode, description: description.trim(), unitPrice: parsedPrice, quantity })
    setDescription('')
    setUnitPrice('')
    setQuantity(1)
    setCode('JP')
    setCodeError('')
  }

  const handleCodeChange = (e) => {
    setCode(e.target.value)
    setCodeError('') // Effacer l'erreur quand l'utilisateur modifie le code
  }

  const datalistId = useMemo(() => 'handles-' + Math.random().toString(36).slice(2), [])

  if (!open) return null

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{t('capture.modalTitle')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>{t('capture.tiktokNameLabel')}</label>
            <div>
              <input className="input" ref={inputRef} list={datalistId} value={tiktokName} onChange={(e) => setTiktokName(e.target.value)} placeholder={t('capture.tiktokNamePlaceholder')} required />
              <datalist id={datalistId}>
                {knownHandles.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="form-row">
            <label>{t('capture.codeLabel')}</label>
            <div>
              <input
                className={`input ${codeError ? 'input--error' : ''}`}
                value={code}
                onChange={handleCodeChange}
                placeholder={t('capture.codePlaceholder')}
              />
              {codeError && <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '4px' }}>{codeError}</div>}
            </div>
          </div>
          <div className="form-row">
            <label>{t('capture.descriptionLabel')}</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('capture.descriptionPlaceholder')} required />
          </div>
          <div className="form-row">
            <label>{t('capture.unitPriceLabel')}</label>
            <input className="input" type="number" step="1" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder={t('capture.unitPricePlaceholder')} required />
          </div>
          <div className="form-row">
            <label>{t('capture.quantityLabel')}</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
              <input className="input" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} min={1} style={{ width: 120 }} />
              <button type="button" className="btn" onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn--primary">{t('capture.validate')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {}


