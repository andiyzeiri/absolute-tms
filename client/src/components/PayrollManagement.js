import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Menu,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  Download,
  AttachMoney,
  CalendarToday,
  Person,
  Receipt,
  Close,
  Payment
} from '@mui/icons-material';

const PayrollManagement = () => {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRecordId, setMenuRecordId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    driverId: '',
    driverName: '',
    payPeriod: '',
    grossPay: '',
    miles: '',
    ratePerMile: '',
    bonus: '',
    deductions: '',
    netPay: '',
    payDate: '',
    status: 'pending'
  });

  // Load drivers from localStorage
  const loadDriversFromStorage = () => {
    const savedDrivers = localStorage.getItem('tms_drivers');
    if (savedDrivers) {
      const driversData = JSON.parse(savedDrivers);
      setDrivers(driversData);
    }
  };

  // Load payroll records from localStorage
  const loadPayrollFromStorage = () => {
    const savedPayroll = localStorage.getItem('tms_payroll');
    if (savedPayroll) {
      setPayrollRecords(JSON.parse(savedPayroll));
    } else {
      // Initialize with demo data if no saved payroll exists
      const demoPayroll = generateDemoPayroll();
      setPayrollRecords(demoPayroll);
    }
  };

  const generateDemoPayroll = () => {
    const savedDrivers = localStorage.getItem('tms_drivers');
    if (!savedDrivers) return [];
    
    const driversData = JSON.parse(savedDrivers);
    const demoPayroll = [];
    
    driversData.forEach((driver, index) => {
      const grossPay = 3500 + (index * 250);
      const deductions = 450 + (index * 25);
      
      demoPayroll.push({
        id: `PAY-${String(index + 1).padStart(3, '0')}`,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        payPeriod: '2024-01-01 to 2024-01-15',
        grossPay: grossPay,
        miles: 2100 + (index * 200),
        ratePerMile: 0.55,
        bonus: index > 1 ? 200 : 0,
        deductions: deductions,
        netPay: grossPay - deductions,
        payDate: '2024-01-20',
        status: index === 0 ? 'paid' : 'pending'
      });
    });
    
    return demoPayroll;
  };

  useEffect(() => {
    loadDriversFromStorage();
    loadPayrollFromStorage();
    
    // Listen for driver updates
    const handleDriversUpdate = () => {
      loadDriversFromStorage();
    };
    
    window.addEventListener('driversUpdated', handleDriversUpdate);
    
    return () => {
      window.removeEventListener('driversUpdated', handleDriversUpdate);
    };
  }, []);

  // Save payroll to localStorage whenever it changes
  useEffect(() => {
    if (payrollRecords.length > 0) {
      localStorage.setItem('tms_payroll', JSON.stringify(payrollRecords));
    }
  }, [payrollRecords]);

  const getStatusColor = (status) => {
    const statusColors = {
      pending: { bgcolor: '#FEF3C7', color: '#D97706', label: 'Pending' },
      paid: { bgcolor: '#D1FAE5', color: '#059669', label: 'Paid' },
      cancelled: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'Cancelled' }
    };
    return statusColors[status] || statusColors.pending;
  };

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.payPeriod.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPeriod === 'all' || record.payPeriod.includes(filterPeriod);
    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (mode, record = null) => {
    setDialogMode(mode);
    setSelectedRecord(record);
    
    if (record && mode === 'edit') {
      setFormData({
        driverId: record.driverId,
        driverName: record.driverName,
        payPeriod: record.payPeriod,
        grossPay: record.grossPay.toString(),
        miles: record.miles.toString(),
        ratePerMile: record.ratePerMile.toString(),
        bonus: record.bonus.toString(),
        deductions: record.deductions.toString(),
        netPay: record.netPay.toString(),
        payDate: record.payDate,
        status: record.status
      });
    } else {
      setFormData({
        driverId: '',
        driverName: '',
        payPeriod: '',
        grossPay: '',
        miles: '',
        ratePerMile: '0.55',
        bonus: '0',
        deductions: '',
        netPay: '',
        payDate: '',
        status: 'pending'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
  };

  const calculateNetPay = () => {
    const miles = parseFloat(formData.miles) || 0;
    const ratePerMile = parseFloat(formData.ratePerMile) || 0;
    const bonus = parseFloat(formData.bonus) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    
    const grossPay = (miles * ratePerMile) + bonus;
    const netPay = grossPay - deductions;
    
    return { grossPay: grossPay.toFixed(2), netPay: netPay.toFixed(2) };
  };

  const handleSaveRecord = () => {
    const { grossPay, netPay } = calculateNetPay();
    
    if (dialogMode === 'add') {
      const newRecord = {
        id: `PAY-${String(payrollRecords.length + 1).padStart(3, '0')}`,
        driverId: formData.driverId,
        driverName: formData.driverName,
        payPeriod: formData.payPeriod,
        grossPay: parseFloat(grossPay),
        miles: parseFloat(formData.miles) || 0,
        ratePerMile: parseFloat(formData.ratePerMile) || 0,
        bonus: parseFloat(formData.bonus) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        netPay: parseFloat(netPay),
        payDate: formData.payDate,
        status: formData.status
      };
      setPayrollRecords([...payrollRecords, newRecord]);
      setSnackbar({ open: true, message: 'Payroll record added successfully!', severity: 'success' });
    } else if (dialogMode === 'edit') {
      const updatedRecords = payrollRecords.map(record => 
        record.id === selectedRecord.id ? {
          ...record,
          driverId: formData.driverId,
          driverName: formData.driverName,
          payPeriod: formData.payPeriod,
          grossPay: parseFloat(grossPay),
          miles: parseFloat(formData.miles) || 0,
          ratePerMile: parseFloat(formData.ratePerMile) || 0,
          bonus: parseFloat(formData.bonus) || 0,
          deductions: parseFloat(formData.deductions) || 0,
          netPay: parseFloat(netPay),
          payDate: formData.payDate,
          status: formData.status
        } : record
      );
      setPayrollRecords(updatedRecords);
      setSnackbar({ open: true, message: 'Payroll record updated successfully!', severity: 'success' });
    }
    handleCloseDialog();
  };

  const handleDeleteRecord = (recordId) => {
    const record = payrollRecords.find(r => r.id === recordId);
    const recordName = record ? `${record.driverName} - ${record.payPeriod}` : 'Record';
    
    if (!window.confirm(`Are you sure you want to delete ${recordName}? This action cannot be undone.`)) {
      handleCloseMenu();
      return;
    }

    const updatedRecords = payrollRecords.filter(record => record.id !== recordId);
    setPayrollRecords(updatedRecords);
    setSnackbar({ open: true, message: 'Payroll record deleted successfully!', severity: 'success' });
    handleCloseMenu();
  };

  const handleMenuClick = (event, recordId) => {
    setAnchorEl(event.currentTarget);
    setMenuRecordId(recordId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuRecordId(null);
  };

  const totalGrossPay = payrollRecords.reduce((sum, record) => sum + record.grossPay, 0);
  const totalNetPay = payrollRecords.reduce((sum, record) => sum + record.netPay, 0);
  const pendingPayments = payrollRecords.filter(r => r.status === 'pending').length;

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Payroll Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Manage driver payments and payroll records
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('add')}
            sx={{ 
              bgcolor: '#4F46E5',
              '&:hover': { bgcolor: '#3730A3' }
            }}
          >
            Add Payroll Record
          </Button>
        </Box>

        {/* Payroll Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Receipt sx={{ fontSize: 32, color: '#4F46E5', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {payrollRecords.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Records
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Payment sx={{ fontSize: 32, color: '#F59E0B', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {pendingPayments}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Pending Payments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 32, color: '#10B981', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  ${totalGrossPay.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Gross Pay
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 32, color: '#059669', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  ${totalNetPay.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Net Pay
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search payroll records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: '#9CA3AF', mr: 1 }} />
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB' } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Period Filter</InputLabel>
                  <Select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    sx={{ bgcolor: '#F9FAFB' }}
                  >
                    <MenuItem value="all">All Periods</MenuItem>
                    <MenuItem value="2024-01">January 2024</MenuItem>
                    <MenuItem value="2024-02">February 2024</MenuItem>
                    <MenuItem value="2024-03">March 2024</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#D1D5DB' } }}
                  >
                    More Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#D1D5DB' } }}
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Payroll Table */}
      <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Pay Period</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Miles</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Gross Pay</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Deductions</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Net Pay</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((record) => {
                const statusConfig = getStatusColor(record.status);
                return (
                  <TableRow key={record.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ 
                          width: 40, 
                          height: 40, 
                          bgcolor: '#4F46E5', 
                          mr: 2,
                          fontSize: '1rem',
                          fontWeight: 600
                        }}>
                          {record.driverName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                            {record.driverName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            ID: {record.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#111827', fontWeight: 500 }}>
                        {record.payPeriod}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        Pay Date: {record.payDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                        {record.miles.toLocaleString()} mi
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        @ ${record.ratePerMile}/mi
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                        ${record.grossPay.toLocaleString()}
                      </Typography>
                      {record.bonus > 0 && (
                        <Typography variant="caption" sx={{ color: '#10B981' }}>
                          +${record.bonus} bonus
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 600 }}>
                        -${record.deductions.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>
                        ${record.netPay.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusConfig.label}
                        size="small"
                        sx={{
                          bgcolor: statusConfig.bgcolor,
                          color: statusConfig.color,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, record.id)}
                        sx={{ color: '#6B7280' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredRecords.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Receipt sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
              No payroll records found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {searchTerm || filterPeriod !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first payroll record'
              }
            </Typography>
          </Box>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          const record = payrollRecords.find(r => r.id === menuRecordId);
          handleOpenDialog('view', record);
          handleCloseMenu();
        }}>
          <Receipt sx={{ mr: 2, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const record = payrollRecords.find(r => r.id === menuRecordId);
          handleOpenDialog('edit', record);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 2, fontSize: 20 }} />
          Edit Record
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteRecord(menuRecordId)}
          sx={{ color: '#DC2626' }}
        >
          <Delete sx={{ mr: 2, fontSize: 20 }} />
          Delete Record
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {dialogMode === 'add' ? 'Add New Payroll Record' : 
               dialogMode === 'edit' ? 'Edit Payroll Record' : 'Payroll Record Details'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Driver</InputLabel>
                <Select
                  value={formData.driverId}
                  onChange={(e) => {
                    const selectedDriver = drivers.find(d => d.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      driverId: e.target.value,
                      driverName: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : ''
                    });
                  }}
                  disabled={dialogMode === 'view'}
                >
                  {drivers.map(driver => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pay Period"
                value={formData.payPeriod}
                onChange={(e) => setFormData({ ...formData, payPeriod: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="e.g., 2024-01-01 to 2024-01-15"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Miles Driven"
                type="number"
                value={formData.miles}
                onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rate per Mile ($)"
                type="number"
                step="0.01"
                value={formData.ratePerMile}
                onChange={(e) => setFormData({ ...formData, ratePerMile: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bonus ($)"
                type="number"
                value={formData.bonus}
                onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Deductions ($)"
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pay Date"
                type="date"
                value={formData.payDate}
                onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 1 }}>
                  Calculated Pay
                </Typography>
                <Typography variant="h6" sx={{ color: '#059669', fontWeight: 700 }}>
                  Net Pay: ${calculateNetPay().netPay}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Gross: ${calculateNetPay().grossPay}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        {dialogMode !== 'view' && (
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#6B7280' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveRecord}
              sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
            >
              {dialogMode === 'add' ? 'Add Record' : 'Save Changes'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PayrollManagement;