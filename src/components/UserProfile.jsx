import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Chip,
  Divider,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton
} from '@mui/material'
import {
  Edit as EditIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Support as OperatorIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material'
import { useProfile } from '../lib/useProfile'
import { useAuth } from '../auth/AuthProvider'

export default function UserProfile() {
  const { user } = useAuth()
  const { profile, loading, error, updateProfile, isAdmin, isOperator } = useProfile()
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    role: profile?.role || 'operator'
  })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  const handleEdit = () => {
    // Seuls les admins peuvent modifier les profils
    if (!isAdmin) {
      return
    }
    setFormData({ role: profile?.role || 'operator' })
    setEditMode(true)
    setUpdateError(null)
  }

  const handleSave = async () => {
    setUpdateLoading(true)
    setUpdateError(null)

    const result = await updateProfile(formData)
    
    if (result.error) {
      setUpdateError(result.error.message)
    } else {
      setEditMode(false)
    }
    
    setUpdateLoading(false)
  }

  const handleCancel = () => {
    setEditMode(false)
    setUpdateError(null)
  }

  const getRoleIcon = () => {
    if (isAdmin) return <AdminIcon color="error" />
    if (isOperator) return <OperatorIcon color="primary" />
    return <PersonIcon />
  }

  const getRoleColor = () => {
    if (isAdmin) return 'error'
    if (isOperator) return 'primary'
    return 'default'
  }

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrateur'
    if (isOperator) return 'Opérateur'
    return 'Utilisateur'
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Skeleton variant="circular" width={64} height={64} />
            <Box>
              <Skeleton variant="text" width={200} height={32} />
              <Skeleton variant="text" width={150} height={24} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={100} />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Erreur lors du chargement du profil : {error}
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Aucun profil trouvé pour cet utilisateur.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {user?.email || 'Utilisateur'}
                </Typography>
                <Stack direction="row" alignItems="center" gap={1}>
                  {getRoleIcon()}
                  <Chip 
                    label={getRoleLabel()} 
                    color={getRoleColor()} 
                    size="small" 
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Box>
                         {isAdmin && (
               <IconButton onClick={handleEdit} color="primary">
                 <EditIcon />
               </IconButton>
             )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <EmailIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user?.email}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <CalendarIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Membre depuis
                </Typography>
                <Typography variant="body1">
                  {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <CalendarIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Dernière mise à jour
                </Typography>
                <Typography variant="body1">
                  {new Date(profile.updated_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={editMode} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le profil</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {updateError && (
              <Alert severity="error">
                {updateError}
              </Alert>
            )}

            <TextField
              label="Email"
              value={user?.email || ''}
              disabled
              fullWidth
              helperText="L'email ne peut pas être modifié"
            />

                         <FormControl fullWidth>
               <InputLabel>Rôle</InputLabel>
               <Select
                 value={formData.role}
                 label="Rôle"
                 onChange={(e) => setFormData({ ...formData, role: e.target.value })}
               >
                 <MenuItem value="operator">Opérateur</MenuItem>
                 <MenuItem value="admin">Administrateur</MenuItem>
               </Select>
             </FormControl>
             
             {!isAdmin && (
               <Alert severity="info">
                 Seuls les administrateurs peuvent modifier les profils.
               </Alert>
             )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={updateLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={updateLoading}
          >
            {updateLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
