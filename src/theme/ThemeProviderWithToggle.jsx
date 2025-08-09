import { useMemo } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createBerryTheme } from './berryTheme'
import { useLocalStorage } from '../lib/useLocalStorage'

export default function ThemeProviderWithToggle({ children }) {
  const [mode] = useLocalStorage('ui_mode', 'light')
  const theme = useMemo(() => createBerryTheme(mode), [mode])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}


