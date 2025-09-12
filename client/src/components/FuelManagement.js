import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Pagination,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  LocalGasStation,
  Download,
  Refresh,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Pending,
  FilterList,
  Search,
  SyncAlt,
  Timeline,
  PieChart
} from '@mui/icons-material';
import axios from 'axios';

const FuelManagement = () => {
  // State management
  const [fuelData, setFuelData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    driverName: '',
    vehicleId: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialog states
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  // Alerts
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  // Load fuel transactions
  const loadFuelTransactions = async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 25,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await axios.get('/api/fuel/transactions', { params });
      
      if (response.data.success) {
        setFuelData(response.data.data.transactions);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalRecords(response.data.data.pagination.totalRecords);
      }
      
    } catch (error) {
      console.error('Error loading fuel transactions:', error);
      showAlert('Failed to load fuel transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load fuel statistics
  const loadFuelStats = async () => {
    try {
      const response = await axios.get('/api/fuel/stats');
      
      if (response.data.success) {
        setStats(response.data.data);
      }
      
    } catch (error) {
      console.error('Error loading fuel stats:', error);
    }
  };

  // Import fuel data manually
  const importFuelData = async () => {
    try {
      setImporting(true);
      showAlert('Starting fuel data import...', 'info');
      
      const response = await axios.post('/api/fuel/import');
      
      if (response.data.success) {
        const { stats, filesProcessed } = response.data.data;
        showAlert(
          `Import completed! Processed ${filesProcessed} files, imported ${stats.successfulImports} transactions`,
          'success'
        );
        
        // Reload data
        await loadFuelTransactions();
        await loadFuelStats();
        
      } else {
        showAlert(`Import failed: ${response.data.message}`, 'error');
      }
      
    } catch (error) {
      console.error('Error importing fuel data:', error);
      showAlert('Import failed: ' + error.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  // Test SFTP connection
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      
      const response = await axios.get('/api/fuel/test-connection');
      
      if (response.data.success) {
        setConnectionStatus({
          success: true,
          message: response.data.message,
          filesFound: response.data.data.filesFound
        });
        showAlert(`Connection successful! Found ${response.data.data.filesFound} files`, 'success');
      } else {
        setConnectionStatus({
          success: false,
          message: response.data.message
        });
        showAlert(`Connection failed: ${response.data.message}`, 'error');
      }
      
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus({
        success: false,
        message: error.message
      });
      showAlert('Connection test failed: ' + error.message, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('fuelFile', file);

    try {
      setImporting(true);
      showAlert(`Uploading and processing ${file.name}...`, 'info');

      const response = await axios.post('/api/fuel/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        showAlert(
          `File processed successfully! Found ${response.data.data.recordsProcessed} records`,
          'success'
        );
        
        // Reload data
        await loadFuelTransactions();
        await loadFuelStats();
      } else {
        showAlert(`Upload failed: ${response.data.message}`, 'error');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      showAlert('File upload failed: ' + error.message, 'error');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Update transaction status
  const updateTransactionStatus = async (transactionId, status, notes = '') => {
    try {
      const response = await axios.put(`/api/fuel/transactions/${transactionId}/status`, {
        status,
        notes
      });
      
      if (response.data.success) {
        showAlert('Transaction status updated successfully', 'success');
        await loadFuelTransactions();
        setShowTransactionDialog(false);
      }
      
    } catch (error) {
      console.error('Error updating transaction status:', error);
      showAlert('Failed to update transaction status', 'error');
    }
  };

  // Utility functions
  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'VALIDATED': return 'primary';
      case 'PENDING': return 'warning';
      case 'DISPUTED': return 'error';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle />;
      case 'VALIDATED': return <CheckCircle />;
      case 'PENDING': return <Pending />;
      case 'DISPUTED': return <Warning />;
      case 'REJECTED': return <Error />;
      default: return <Pending />;
    }
  };

  // Effects
  useEffect(() => {
    loadFuelTransactions();
    loadFuelStats();
  }, [page, filters]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#059669' }}>
          <LocalGasStation sx={{ mr: 1, verticalAlign: 'middle' }} />
          Fuel Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={testingConnection ? <CircularProgress size={20} /> : <SyncAlt />}
            onClick={testConnection}
            disabled={testingConnection}
            sx={{ borderColor: '#059669', color: '#059669' }}
          >
            Test Connection
          </Button>
          
          <input
            accept=".csv,.pdf,.xls,.xlsx"
            style={{ display: 'none' }}
            id="upload-fuel-file"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="upload-fuel-file">
            <Button
              component="span"
              variant="outlined"
              startIcon={<Download />}
              sx={{ borderColor: '#059669', color: '#059669' }}
            >
              Upload File
            </Button>
          </label>
          
          <Button
            variant="contained"
            startIcon={importing ? <CircularProgress size={20} /> : <Download />}
            onClick={importFuelData}
            disabled={importing}
            sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
          >
            {importing ? 'Importing...' : 'Import Data'}
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocalGasStation sx={{ color: '#059669', mr: 1 }} />
                  <Typography variant="h6">Total Transactions</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.overview.totalTransactions?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment sx={{ color: '#059669', mr: 1 }} />
                  <Typography variant="h6">Total Gallons</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.overview.totalGallons?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PieChart sx={{ color: '#059669', mr: 1 }} />
                  <Typography variant="h6">Total Cost</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(stats.overview.totalAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Timeline sx={{ color: '#059669', mr: 1 }} />
                  <Typography variant="h6">Avg Price/Gal</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(stats.overview.averagePrice)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Actions Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => setShowStatsDialog(true)}
          >
            Statistics
          </Button>
        </Box>
        
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {totalRecords} total transactions
        </Typography>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Driver Name"
                  value={filters.driverName}
                  onChange={(e) => setFilters({ ...filters, driverName: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Status"
                  select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="VALIDATED">Validated</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="DISPUTED">Disputed</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Fuel Transactions Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Gallons</TableCell>
                <TableCell align="right">Price/Gal</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : fuelData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No fuel transactions found
                  </TableCell>
                </TableRow>
              ) : (
                fuelData.map((transaction) => (
                  <TableRow key={transaction._id} hover>
                    <TableCell>
                      {formatDate(transaction.transactionDate)}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {transaction.transactionTime}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {transaction.driverName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Card: {transaction.cardNumber}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.vehicleId || transaction.vehicleNumber || 'N/A'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {transaction.merchantName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.merchantAddress?.city}, {transaction.merchantAddress?.state}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.productDescription}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {transaction.quantity?.toFixed(2)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(transaction.unitPrice)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(transaction.totalAmount)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Tooltip title={`${transaction.validationFlags?.length || 0} validation flags`}>
                        <Badge badgeContent={transaction.validationFlags?.length || 0} color="warning">
                          <Chip
                            icon={getStatusIcon(transaction.status)}
                            label={transaction.status}
                            color={getStatusColor(transaction.status)}
                            size="small"
                          />
                        </Badge>
                      </Tooltip>
                    </TableCell>
                    
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionDialog(true);
                        }}
                      >
                        <Search />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog
        open={showTransactionDialog}
        onClose={() => setShowTransactionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Transaction Details
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Transaction ID</Typography>
                <Typography variant="body1">{selectedTransaction.transactionId}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                <Typography variant="body1">
                  {formatDate(selectedTransaction.transactionDate)} {selectedTransaction.transactionTime}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Driver</Typography>
                <Typography variant="body1">{selectedTransaction.driverName}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                <Typography variant="body1">
                  {selectedTransaction.vehicleId || selectedTransaction.vehicleNumber || 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{selectedTransaction.merchantName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTransaction.merchantAddress?.street}, {selectedTransaction.merchantAddress?.city}, {selectedTransaction.merchantAddress?.state} {selectedTransaction.merchantAddress?.zipCode}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                <Typography variant="body1">{selectedTransaction.productDescription}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                <Typography variant="body1">{selectedTransaction.quantity?.toFixed(2)} {selectedTransaction.unitOfMeasure}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Unit Price</Typography>
                <Typography variant="body1">{formatCurrency(selectedTransaction.unitPrice)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                <Typography variant="body1" fontWeight="bold">{formatCurrency(selectedTransaction.totalAmount)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Tax Amount</Typography>
                <Typography variant="body1">{formatCurrency(selectedTransaction.taxAmount)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Net Amount</Typography>
                <Typography variant="body1">{formatCurrency(selectedTransaction.netAmount)}</Typography>
              </Grid>
              
              {selectedTransaction.validationFlags && selectedTransaction.validationFlags.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Validation Flags</Typography>
                  {selectedTransaction.validationFlags.map((flag, index) => (
                    <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight="medium">{flag.flag}</Typography>
                      <Typography variant="body2">{flag.description}</Typography>
                    </Alert>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransactionDialog(false)}>
            Close
          </Button>
          {selectedTransaction && (
            <>
              <Button
                color="success"
                variant="contained"
                onClick={() => updateTransactionStatus(selectedTransaction._id, 'APPROVED')}
              >
                Approve
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={() => updateTransactionStatus(selectedTransaction._id, 'DISPUTED')}
              >
                Dispute
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FuelManagement;