import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LoginIcon from '@mui/icons-material/Login'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const { signInWithPassword, signInWithOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state && location.state.from) || '/capture'
  const { t } = useTranslation()

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await signInWithPassword(email, password)
      if (error) { setMessageType('error'); setMessage(error.message) }
      else navigate(from, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  async function onForgotPassword() {
    if (!email) {
      setMessageType('info')
      setMessage(t('auth.forgotPasswordMessage'))
      return
    }
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/beh/login'
    })
    setLoading(false)
    if (error) {
      setMessageType('error')
      setMessage(error.message)
    } else {
      setMessageType('success')
      setMessage(t('auth.resetPasswordSent'))
    }
  }

  return (
    <Container maxWidth="xs" sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <Paper component="form" onSubmit={onSubmit} elevation={2} sx={{ p: 3, width: '100%' }}>
        <Stack spacing={2}>
          <Stack spacing={0.5} alignItems="center">
            <LockOutlinedIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>{t('auth.login')}</Typography>
          </Stack>

          <TextField
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            InputProps={{ startAdornment: <Box sx={{ pr: 1, color: 'text.secondary' }}><MailOutlineIcon fontSize="small" /></Box> }}
          />

          <TextField
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            InputProps={{ startAdornment: <Box sx={{ pr: 1, color: 'text.secondary' }}><LockOutlinedIcon fontSize="small" /></Box> }}
          />

          <Box sx={{ textAlign: 'right' }}>
            <Button onClick={onForgotPassword} size="small">{t('auth.forgotPassword')}</Button>
          </Box>

          {message && (
            <Alert severity={messageType}>{message}</Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={<LoginIcon />}
            fullWidth
          >
            {loading ? '...' : t('auth.loginButton')}
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}


