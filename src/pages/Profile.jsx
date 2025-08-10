import { Container, Typography, Box } from '@mui/material'
import UserProfile from '../components/UserProfile'

export default function Profile() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mon Profil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez vos informations personnelles et vos paramètres de compte.
        </Typography>
      </Box>

      <UserProfile />
    </Container>
  )
}
