import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Box,
  IconButton,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

export default function RegularSaleModal({ open, onClose, onSubmit, loading }) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [articles, setArticles] = useState([
    { id: Date.now(), code: 'JP', description: '', unitPrice: '', quantity: 1 }
  ])
  const { t } = useTranslation()

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setCustomerName('')
      setCustomerPhone('')
      setArticles([
        { id: Date.now(), code: 'JP', description: '', unitPrice: '', quantity: 1 }
      ])
    }
  }, [open])

  // Calcul du montant total
  const totalAmount = articles.reduce((total, article) => {
    const price = parseFloat(article.unitPrice) || 0
    const qty = parseInt(article.quantity) || 0
    return total + (price * qty)
  }, 0)

  const handleAddArticle = () => {
    setArticles([
      ...articles,
      { id: Date.now(), code: 'JP', description: '', unitPrice: '', quantity: 1 }
    ])
  }

  const handleRemoveArticle = (id) => {
    if (articles.length > 1) {
      setArticles(articles.filter(article => article.id !== id))
    }
  }

  const handleArticleChange = (id, field, value) => {
    setArticles(articles.map(article => 
      article.id === id ? { ...article, [field]: value } : article
    ))
  }

  const handleSubmit = () => {
    // Validation
    if (!customerName.trim()) {
      alert('Le nom du client est obligatoire')
      return
    }
    if (!customerPhone.trim()) {
      alert('Le numéro de téléphone est obligatoire')
      return
    }

    // Vérifier que tous les articles sont valides
    const validArticles = articles.filter(article => {
      const price = parseFloat(article.unitPrice)
      const qty = parseInt(article.quantity)
      return article.description.trim() && 
             !isNaN(price) && price > 0 && 
             !isNaN(qty) && qty > 0
    })

    if (validArticles.length === 0) {
      alert('Au moins un article valide est requis')
      return
    }

    // Préparer les données avec validation stricte
    const preparedArticles = validArticles.map(article => {
      const unitPrice = parseFloat(article.unitPrice)
      const quantity = parseInt(article.quantity)
      
      console.log('Article préparé:', {
        code: article.code || 'JP',
        description: article.description.trim(),
        unit_price: unitPrice,
        quantity: quantity,
        unitPriceOriginal: article.unitPrice
      })
      
      return {
        code: article.code || 'JP',
        description: article.description.trim(),
        unit_price: unitPrice,
        quantity: quantity
      }
    })

    // Préparer les données
    const orderData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      articles: preparedArticles,
      totalAmount
    }

    console.log('🔍 MODAL - Données finales envoyées:', orderData)
    console.log('🔍 MODAL - Articles détaillés:', JSON.stringify(orderData.articles, null, 2))

    onSubmit(orderData)
  }

  const handleClose = () => {
    setCustomerName('')
    setCustomerPhone('')
    setArticles([
      { id: Date.now(), code: 'JP', description: '', unitPrice: '', quantity: 1 }
    ])
    onClose()
  }

  const isFormValid = () => {
    return customerName.trim() && 
           customerPhone.trim() && 
           articles.some(article => 
             article.description.trim() && 
             parseFloat(article.unitPrice) > 0 && 
             parseInt(article.quantity) > 0
           )
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Nouvelle vente ordinaire</Typography>
          <Chip 
            label={`Total: ${totalAmount.toLocaleString()} Ar`}
            color="primary"
            variant="outlined"
          />
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Informations client */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Informations client
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nom du client"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                size="small"
              />
              <TextField
                fullWidth
                label="Numéro de téléphone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                size="small"
              />
            </Stack>
          </Paper>

          {/* Articles */}
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Articles
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddArticle}
              >
                Ajouter un article
              </Button>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Prix unitaire</TableCell>
                    <TableCell align="center">Quantité</TableCell>
                    <TableCell align="right">Sous-total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {articles.map((article) => {
                    const subtotal = (parseFloat(article.unitPrice) || 0) * (parseInt(article.quantity) || 0)
                    return (
                      <TableRow key={article.id}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={article.code}
                            onChange={(e) => handleArticleChange(article.id, 'code', e.target.value)}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={article.description}
                            onChange={(e) => handleArticleChange(article.id, 'description', e.target.value)}
                            placeholder="Description de l'article"
                            required
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={article.unitPrice}
                            onChange={(e) => handleArticleChange(article.id, 'unitPrice', e.target.value)}
                            sx={{ width: 100 }}
                            inputProps={{ min: 0, step: 1 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={article.quantity}
                            onChange={(e) => handleArticleChange(article.id, 'quantity', e.target.value)}
                            sx={{ width: 80 }}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {subtotal.toLocaleString()} Ar
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveArticle(article.id)}
                            disabled={articles.length === 1}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Résumé de la commande */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Résumé de la commande
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">
                {articles.filter(a => a.description.trim()).length} article(s)
              </Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                Total: {totalAmount.toLocaleString()} Ar
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || !isFormValid()}
        >
          {loading ? 'Création...' : 'Créer la commande'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
