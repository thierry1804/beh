import { Container, Typography, Box } from '@mui/material'
import UserProfile from '../components/UserProfile'
import { useTranslation } from 'react-i18next'

export default function Profile() {
  const { t } = useTranslation()
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('profile.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('profile.personalInfo')}
        </Typography>
      </Box>

      <UserProfile />
    </Container>
  )
}
