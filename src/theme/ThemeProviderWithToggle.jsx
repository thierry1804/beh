import { createContext, useContext, useMemo } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createBerryTheme } from './berryTheme'
import { useLocalStorage } from '../lib/useLocalStorage'

const ColorModeContext = createContext({ mode: 'light', setMode: () => { }, toggleMode: () => { } })

export default function ThemeProviderWithToggle({ children }) {
  const [mode, setMode] = useLocalStorage('ui_mode', 'light')
  const theme = useMemo(() => createBerryTheme(mode), [mode])
  const value = useMemo(() => ({
    mode,
    setMode,
    toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
  }), [mode, setMode])
  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  return useContext(ColorModeContext)
}


