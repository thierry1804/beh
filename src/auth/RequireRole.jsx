import { Navigate } from 'react-router-dom'
import { useProfile } from '../lib/useProfile'
import { useAuth } from './AuthProvider'
import { Container, Typography, Paper, Box } from '@mui/material'

export default function RequireRole({ 
  children, 
  adminOnly = false, 
  operatorAllowed = true,
  fallbackPath = '/capture' 
}) {
  const { user } = useAuth()
  const { profile, loading, isAdmin, isOperator } = useProfile()

  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Attendre le chargement du profil
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Chargement...
          </Typography>
        </Paper>
      </Container>
    )
  }

  // Vérifier les permissions
  let hasAccess = false

  if (isAdmin) {
    // Les admins ont accès à tout
    hasAccess = true
  } else if (isOperator) {
    // Les operators ont accès selon les paramètres
    if (adminOnly) {
      hasAccess = false
    } else if (operatorAllowed) {
      hasAccess = true
    } else {
      hasAccess = false
    }
  } else {
    // Les autres utilisateurs n'ont pas d'accès
    hasAccess = false
  }

  if (!hasAccess) {
    // Si c'est la page d'accueil et qu'on a un fallbackPath, rediriger automatiquement
    if (window.location.pathname === '/' && fallbackPath) {
      return <Navigate to={fallbackPath} replace />
    }
    
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Accès refusé
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Typography>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              {isOperator 
                ? "En tant qu'opérateur, vous avez accès à : Saisie, En attente, Préparation et votre profil (lecture seule)."
                : "Contactez un administrateur pour obtenir les permissions nécessaires."
              }
            </Typography>
          </Box>
        </Paper>
      </Container>
    )
  }

  return children
}
