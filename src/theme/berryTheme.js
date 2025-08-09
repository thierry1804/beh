import { createTheme } from '@mui/material/styles'

export function createBerryTheme(mode = 'light') {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: '#7367F0' },
      secondary: { main: '#28C76F' },
      background: isDark
        ? { default: '#0f1117', paper: '#151a23' }
        : { default: '#f5f7fb', paper: '#ffffff' },
      divider: isDark ? '#232737' : '#e6e8f0',
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700 },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { borderRadius: 14, border: `1px solid ${isDark ? '#232737' : '#eef0f5'}` } } },
      MuiAppBar: { styleOverrides: { root: { borderBottom: `1px solid ${isDark ? '#232737' : '#eef0f5'}`, backgroundImage: 'none', borderRadius: 0 } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 12 } } },
      MuiTableHead: { styleOverrides: { root: { background: isDark ? '#1b2330' : '#f3f6fb' } } },
    },
  })
}



