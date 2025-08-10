import { useTranslation } from 'react-i18next'

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    console.log('Changement de langue vers:', lng)
  }

  return (
    <div 
      onClick={() => changeLanguage(currentLanguage === 'fr' ? 'zh' : 'fr')}
      style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '12px',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minWidth: '60px',
        justifyContent: 'center'
      }}
    >
      🌐 {currentLanguage === 'fr' ? 'FR' : '中文'}
    </div>
  )
}
