import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Stack, Avatar, Tooltip } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import InsightsIcon from '@mui/icons-material/Insights'
import ListAltIcon from '@mui/icons-material/ListAlt'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 72
const APPBAR_HEIGHT = 56

import { useLocalStorage } from '../lib/useLocalStorage'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggle = () => setMobileOpen(!mobileOpen)
  const [mode, setMode] = useLocalStorage('ui_mode', 'light')
  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'))
  const [collapsed, setCollapsed] = useLocalStorage('nav_collapsed', false)
  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  const menu = [
    { to: '/sessions', label: 'Sessions', icon: <ListAltIcon /> },
    { to: '/capture', label: 'Saisie', icon: <AddShoppingCartIcon /> },
    { to: '/pending', label: 'En attente', icon: <PeopleIcon /> },
    { to: '/prep', label: 'Préparation', icon: <InventoryIcon /> },
    { to: '/delivery', label: 'Livraisons', icon: <LocalShippingIcon /> },
    { to: '/dashboard', label: 'Tableaux', icon: <InsightsIcon /> },
  ]

  const drawer = (
    <div>
      <Toolbar variant="dense" sx={{ px: 1, minHeight: APPBAR_HEIGHT }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
          <Typography variant="h6" fontWeight={800}>{collapsed ? 'B' : 'BEH'}</Typography>
          <IconButton size="small" onClick={() => setCollapsed(!collapsed)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Stack>
      </Toolbar>
      <Divider />
      <List>
        {menu.map((m) => (
          <Tooltip key={m.to} title={collapsed ? m.label : ''} placement="right">
            <ListItemButton component={NavLink} to={m.to} sx={({ isActive }) => ({
              '&.active': { backgroundColor: 'action.selected' },
              px: collapsed ? 1.25 : 2
            })}>
              <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center' }}>{m.icon}</ListItemIcon>
              {!collapsed && <ListItemText primary={m.label} />}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" color="default" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: 'background.paper', color: 'text.primary', borderRadius: 0 }}>
        <Toolbar variant="dense" sx={{ minHeight: APPBAR_HEIGHT }}>
          <IconButton color="inherit" edge="start" onClick={toggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>BEHX</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title={mode === 'light' ? 'Basculer en sombre' : 'Basculer en clair'}>
              <IconButton color="primary" onClick={toggleMode}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            <Avatar sx={{ width: 32, height: 32 }}>B</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="menu">
        <Drawer variant="temporary" open={mobileOpen} onClose={toggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: EXPANDED_WIDTH, borderRadius: 0 } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, overflowX: 'hidden', borderRadius: 0 } }} open>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ height: APPBAR_HEIGHT }} />
        <Outlet />
      </Box>
    </Box>
  )
}


