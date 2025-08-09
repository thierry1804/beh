import { Box, Stack, Typography } from '@mui/material'

export default function PageHeader({ title, subtitle, actions = null }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {actions}
        </Stack>
      </Stack>
    </Box>
  )
}


