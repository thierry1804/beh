import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Typography
} from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function CreateSessionModal({ open, onClose, onCreateSession, loading }) {
  const [selectedType, setSelectedType] = useState('LIVE_TIKTOK')
  const { t } = useTranslation()

  const handleSubmit = () => {
    onCreateSession(selectedType)
  }

  const handleClose = () => {
    setSelectedType('LIVE_TIKTOK')
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {t('sessions.newSession')}
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('sessions.chooseType')}
          </Typography>
          
          <FormControl component="fieldset">
            <FormLabel component="legend">{t('sessions.type')}</FormLabel>
            <RadioGroup
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              sx={{ mt: 1 }}
            >
              <FormControlLabel
                value="LIVE_TIKTOK"
                control={<Radio />}
                label={
                  <Stack>
                    <Typography variant="body1">
                      {t('sessions.types.liveTiktok')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Session pour un live TikTok en temps réel
                    </Typography>
                  </Stack>
                }
              />
              <FormControlLabel
                value="VENTE_ORDINAIRE"
                control={<Radio />}
                label={
                  <Stack>
                    <Typography variant="body1">
                      {t('sessions.types.regularSale')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Session pour une vente classique
                    </Typography>
                  </Stack>
                }
              />
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading}
        >
          {t('sessions.create')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
