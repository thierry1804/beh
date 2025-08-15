import { Navigate } from 'react-router-dom'
import { useProfile } from '../lib/useProfile'
import { Container, Typography, Paper, CircularProgress, Box } from '@mui/material'

export default function HomeRedirect() {
  const { profile, loading, isAdmin, isOperator } = useProfile()

  // Attendre le chargement du profil
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography variant="h6" gutterBottom>
              Chargement...
            </Typography>
          </Box>
        </Paper>
      </Container>
    )
  }

  // Rediriger selon le rôle
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />
  } else if (isOperator) {
    return <Navigate to="/capture" replace />
  } else {
    // Les autres utilisateurs n'ont pas d'accès
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Accès refusé
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Vous n'avez pas les permissions nécessaires pour accéder à cette application.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contactez un administrateur pour obtenir les permissions nécessaires.
          </Typography>
        </Paper>
      </Container>
    )
  }
}
