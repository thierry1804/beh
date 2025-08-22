import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Stack, Avatar, Tooltip, Menu, MenuItem, Collapse } from '@mui/material'
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
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import LanguageSelector from '../components/LanguageSelector'

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 72
const APPBAR_HEIGHT = 56

import { useLocalStorage } from '../lib/useLocalStorage'
import { useColorMode } from '../theme/ThemeProviderWithToggle'
import { useAuth } from '../auth/AuthProvider'
import { useProfile } from '../lib/useProfile'
import { useTranslation } from 'react-i18next'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const [commandsMenuOpen, setCommandsMenuOpen] = useState(false)
  const toggle = () => setMobileOpen(!mobileOpen)
  const { mode, toggleMode } = useColorMode()
  const [collapsed, setCollapsed] = useLocalStorage('nav_collapsed', false)
  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
  const { signOut, user } = useAuth()
  const { isAdmin, isOperator } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  // Ouvrir automatiquement le menu Commandes si un sous-menu est actif
  useEffect(() => {
    const commandsPaths = ['/capture', '/pending']
    if (commandsPaths.includes(location.pathname)) {
      setCommandsMenuOpen(true)
    }
  }, [location.pathname])

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

  const handleCommandsMenuToggle = () => {
    setCommandsMenuOpen(!commandsMenuOpen)
  }

  const title = getPageTitle(location.pathname, t)

  const menu = [
    { to: '/dashboard', label: t('navigation.dashboard'), icon: <InsightsIcon />, adminOnly: true },
    { to: '/sessions', label: t('navigation.sessions'), icon: <ListAltIcon />, adminOnly: true },
    {
      type: 'group',
      label: t('navigation.commands'),
      icon: <ShoppingCartIcon />,
      adminOnly: false,
      children: [
        { to: '/capture', label: t('navigation.capture'), icon: <AddShoppingCartIcon />, adminOnly: false },
        { to: '/pending', label: t('navigation.pending'), icon: <ShoppingCartCheckoutIcon />, adminOnly: false },
      ]
    },
    { to: '/customers', label: t('navigation.customers'), icon: <PeopleIcon />, adminOnly: true },
    { to: '/prep', label: t('navigation.prep'), icon: <InventoryIcon />, adminOnly: false },
    { to: '/delivery', label: t('navigation.delivery'), icon: <LocalShippingIcon />, adminOnly: true },
  ]

  // Filtrer le menu selon les permissions
  const filteredMenu = menu.filter(item => {
    if (isAdmin) return true // Les admins ont accès à tout
    if (isOperator) {
      if (item.type === 'group') {
        // Pour les groupes, filtrer les enfants
        const filteredChildren = item.children.filter(child => !child.adminOnly)
        return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : false
      }
      return !item.adminOnly // Les operators n'ont accès qu'aux éléments non adminOnly
    }
    return false // Les autres utilisateurs n'ont accès à rien
  })

  const renderMenuItem = (item) => {
    if (item.type === 'group') {
      const isActive = item.children.some(child => location.pathname === child.to)
      return (
        <div key={item.label}>
          <Tooltip title={collapsed ? item.label : ''} placement="right">
            <ListItemButton
              onClick={handleCommandsMenuToggle}
              sx={{
                px: collapsed ? 1.25 : 2,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&.active': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }
              }}
            >
              <ListItemIcon sx={{
                minWidth: 0,
                mr: collapsed ? 0 : 2,
                justifyContent: 'center',
                color: 'inherit'
              }}>{item.icon}</ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
              {!collapsed && (commandsMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
            </ListItemButton>
          </Tooltip>

          {/* Sous-menus visibles même quand réduit */}
          {collapsed ? (
            // Mode réduit : afficher les sous-menus directement
            commandsMenuOpen && (
              <List component="div" disablePadding>
                {item.children.map((child) => (
                  <Tooltip key={child.to} title={child.label} placement="right">
                    <ListItemButton
                      component={NavLink}
                      to={child.to}
                      sx={{
                        px: 1.25,
                        minHeight: 40,
                        justifyContent: 'center',
                        '&.active': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          }
                        }
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: 0,
                        justifyContent: 'center',
                        color: 'inherit'
                      }}>{child.icon}</ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                ))}
              </List>
            )
          ) : (
            // Mode étendu : afficher avec animation
            <Collapse in={commandsMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children.map((child) => (
                  <Tooltip key={child.to} title={collapsed ? child.label : ''} placement="right">
                    <ListItemButton
                      component={NavLink}
                      to={child.to}
                      sx={{
                        pl: 4,
                        '&.active': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          }
                        }
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: 0,
                        mr: 2,
                        justifyContent: 'center',
                        color: 'inherit'
                      }}>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.label} />
                    </ListItemButton>
                  </Tooltip>
                ))}
              </List>
            </Collapse>
          )}
        </div>
      )
    } else {
      return (
        <Tooltip key={item.to} title={collapsed ? item.label : ''} placement="right">
          <ListItemButton
            component={NavLink}
            to={item.to}
            sx={{
              px: collapsed ? 1.25 : 2,
              justifyContent: collapsed ? 'center' : 'flex-start',
              '&.active': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              justifyContent: 'center',
              color: 'inherit'
            }}>{item.icon}</ListItemIcon>
            {!collapsed && <ListItemText primary={item.label} />}
          </ListItemButton>
        </Tooltip>
      )
    }
  }

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
        {filteredMenu.map(renderMenuItem)}
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
            <LanguageSelector />
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
                    {t('profile.title')}
                  </MenuItem>
                  <MenuItem onClick={onLogout}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    {t('auth.logout')}
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

function getPageTitle(pathname, t) {
  if (pathname === '/' || pathname === '') return t('dashboard.title');
  if (pathname.startsWith('/sessions')) return t('sessions.title');
  if (pathname.startsWith('/capture')) return t('capture.title');
  if (pathname.startsWith('/pending')) return t('pending.title');
  if (pathname.startsWith('/customers')) return t('customers.title');
  if (pathname.startsWith('/prep')) return t('navigation.prep');
  if (pathname.startsWith('/delivery')) return t('navigation.delivery');
  if (pathname.startsWith('/dashboard')) return t('dashboard.title');
  if (pathname.startsWith('/customer')) return t('customers.title');
  if (pathname.startsWith('/profile')) return t('profile.title');
  return 'BEHX';
}


