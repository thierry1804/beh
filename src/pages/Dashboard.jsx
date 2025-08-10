import { Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'

const data = [
  { name: 'Jan', Investment: 40, Loss: 12, Profit: 30, Maintenance: 9 },
  { name: 'Feb', Investment: 80, Loss: 20, Profit: 60, Maintenance: 10 },
  { name: 'Mar', Investment: 30, Loss: 14, Profit: 48, Maintenance: 8 },
  { name: 'Apr', Investment: 55, Loss: 18, Profit: 43, Maintenance: 7 },
  { name: 'May', Investment: 95, Loss: 25, Profit: 70, Maintenance: 12 },
  { name: 'Jun', Investment: 50, Loss: 10, Profit: 40, Maintenance: 6 },
]

export default function Dashboard() {
  const { t } = useTranslation()
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title={<Typography variant="h6">{t('dashboard.title')}</Typography>} subheader="$2,324.00" />
          <CardContent style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Investment" stackId="a" fill="#7367F0" radius={[6,6,0,0]} />
                <Bar dataKey="Loss" stackId="a" fill="#EA5455" radius={[6,6,0,0]} />
                <Bar dataKey="Profit" stackId="a" fill="#28C76F" radius={[6,6,0,0]} />
                <Bar dataKey="Maintenance" stackId="a" fill="#00CFE8" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title={<Typography variant="h6">{t('dashboard.recentOrders')}</Typography>} />
          <CardContent>
            <Typography variant="body2" color="text.secondary">{t('common.loading')}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}


