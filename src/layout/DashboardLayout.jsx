import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Stack, Avatar, Tooltip, Menu, MenuItem } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import InsightsIcon from '@mui/icons-material/Insights'
import ListAltIcon from '@mui/icons-material/ListAlt'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 72
const APPBAR_HEIGHT = 56

import { useLocalStorage } from '../lib/useLocalStorage'
import { useColorMode } from '../theme/ThemeProviderWithToggle'
import { useAuth } from '../auth/AuthProvider'
import { useProfile } from '../lib/useProfile'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const toggle = () => setMobileOpen(!mobileOpen)
  const { mode, toggleMode } = useColorMode()
  const [collapsed, setCollapsed] = useLocalStorage('nav_collapsed', false)
  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
  const { signOut, user } = useAuth()
  const { isAdmin, isOperator } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()

  const onLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleProfileClick = () => {
    handleUserMenuClose()
    navigate('/profile')
  }

  const title = getPageTitle(location.pathname)

  const menu = [
    { to: '/dashboard', label: 'Tableaux de bord', icon: <InsightsIcon />, adminOnly: true },
    { to: '/sessions', label: 'Sessions', icon: <ListAltIcon />, adminOnly: true },
    { to: '/capture', label: 'Saisie', icon: <AddShoppingCartIcon />, adminOnly: false },
    { to: '/pending', label: 'En attente', icon: <ShoppingCartCheckoutIcon />, adminOnly: false },
    { to: '/customers', label: 'Clients', icon: <PeopleIcon />, adminOnly: true },
    { to: '/prep', label: 'Préparation', icon: <InventoryIcon />, adminOnly: false },
    { to: '/delivery', label: 'Livraisons', icon: <LocalShippingIcon />, adminOnly: true },
  ]

  // Filtrer le menu selon les permissions
  const filteredMenu = menu.filter(item => {
    if (isAdmin) return true // Les admins ont accès à tout
    if (isOperator) return !item.adminOnly // Les operators n'ont accès qu'aux éléments non adminOnly
    return false // Les autres utilisateurs n'ont accès à rien
  })

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
        {filteredMenu.map((m) => (
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
          <Typography variant="h6" noWrap sx={{ mr: 'auto', textAlign: 'left' }}>{title}</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title={mode === 'light' ? 'Basculer en sombre' : 'Basculer en clair'}>
              <IconButton color="primary" onClick={toggleMode}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Menu utilisateur */}
            {(isAdmin || isOperator) && (
              <>
                <Tooltip title="Menu utilisateur">
                  <IconButton
                    color="primary"
                    onClick={handleUserMenuOpen}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <KeyboardArrowDownIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={handleProfileClick}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Mon Profil
                  </MenuItem>
                  <MenuItem onClick={onLogout}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    Se déconnecter
                  </MenuItem>
                </Menu>
              </>
            )}

            {/* Bouton de déconnexion simple pour les autres utilisateurs */}
            {!isAdmin && !isOperator && (
              <Tooltip title="Se déconnecter">
                <IconButton color="primary" onClick={onLogout}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            )}
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
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        <Box sx={{ height: APPBAR_HEIGHT }} />
        <Outlet />
      </Box>
    </Box>
  )
}

function getPageTitle(pathname) {
  if (pathname === '/' || pathname === '') return 'Tableaux de bord';
  if (pathname.startsWith('/sessions')) return 'Sessions Live TikTok';
  if (pathname.startsWith('/capture')) return 'Saisie';
  if (pathname.startsWith('/pending')) return 'En attente de livraison';
  if (pathname.startsWith('/customers')) return 'Gestion des clients';
  if (pathname.startsWith('/prep')) return 'Préparation';
  if (pathname.startsWith('/delivery')) return 'Livraisons';
  if (pathname.startsWith('/dashboard')) return 'Tableaux de bord';
  if (pathname.startsWith('/customer')) return 'Client';
  if (pathname.startsWith('/profile')) return 'Mon Profil';
  return 'BEHX';
}


