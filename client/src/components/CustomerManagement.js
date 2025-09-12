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
  Snackbar,
  Rating
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  Download,
  Group,
  Phone,
  Email,
  AttachMoney,
  Star,
  Close,
  TrendingUp
} from '@mui/icons-material';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCustomerId, setMenuCustomerId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Demo customers data
  const demoCustomers = [
    {
      id: 'C-001',
      company: 'Walmart Canada Corp',
      contactPerson: 'Robert Johnson',
      email: 'r.johnson@walmart.ca',
      phone: '+1-905-555-0123',
      address: '1940 Argentia Rd, Mississauga, ON L5N 1P9',
      rating: 4.9,
      status: 'active',
      totalShipments: 1245,
      totalRevenue: 875000,
      lastShipment: '2024-01-14T16:30:00Z',
      joinedDate: '2019-06-15T00:00:00Z',
      paymentTerms: 'Net 30',
      creditLimit: 500000,
      industry: 'Retail',
      notes: 'Major retail client, priority handling'
    },
    {
      id: 'C-002',
      company: 'Canadian Tire Corporation',
      contactPerson: 'Michelle Davis',
      email: 'm.davis@canadiantire.ca',
      phone: '+1-416-555-0234',
      address: '2180 Yonge St, Toronto, ON M4S 2Z3',
      rating: 4.7,
      status: 'active',
      totalShipments: 892,
      totalRevenue: 650000,
      lastShipment: '2024-01-12T10:15:00Z',
      joinedDate: '2020-02-20T00:00:00Z',
      paymentTerms: 'Net 45',
      creditLimit: 300000,
      industry: 'Retail',
      notes: 'Seasonal volume spikes during holidays'
    },
    {
      id: 'C-003',
      company: 'Shoppers Drug Mart',
      contactPerson: 'David Chen',
      email: 'd.chen@shoppersdrugmart.ca',
      phone: '+1-647-555-0345',
      address: '243 Consumers Rd, North York, ON M2J 1R4',
      rating: 4.8,
      status: 'active',
      totalShipments: 567,
      totalRevenue: 420000,
      lastShipment: '2024-01-13T14:45:00Z',
      joinedDate: '2021-01-10T00:00:00Z',
      paymentTerms: 'Net 30',
      creditLimit: 250000,
      industry: 'Pharmacy',
      notes: 'Pharmaceutical deliveries, temperature controlled'
    },
    {
      id: 'C-004',
      company: 'Metro Inc.',
      contactPerson: 'Sarah Thompson',
      email: 's.thompson@metro.ca',
      phone: '+1-514-555-0456',
      address: '11755 Boul Côte de Liesse, Dorval, QC H9P 1A3',
      rating: 4.5,
      status: 'active',
      totalShipments: 378,
      totalRevenue: 285000,
      lastShipment: '2024-01-11T09:20:00Z',
      joinedDate: '2021-08-25T00:00:00Z',
      paymentTerms: 'Net 15',
      creditLimit: 200000,
      industry: 'Grocery',
      notes: 'Fresh produce deliveries, time-sensitive'
    },
    {
      id: 'C-005',
      company: 'Home Depot Canada',
      contactPerson: 'Mark Wilson',
      email: 'm.wilson@homedepot.ca',
      phone: '+1-604-555-0567',
      address: '1 Concorde Gate, Toronto, ON M3C 3N6',
      rating: 4.6,
      status: 'pending',
      totalShipments: 156,
      totalRevenue: 125000,
      lastShipment: '2024-01-08T11:30:00Z',
      joinedDate: '2023-10-15T00:00:00Z',
      paymentTerms: 'Net 60',
      creditLimit: 150000,
      industry: 'Home Improvement',
      notes: 'New customer, building materials shipments'
    }
  ];

  const [formData, setFormData] = useState({
    company: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    paymentTerms: 'Net 30',
    creditLimit: '',
    notes: '',
    status: 'active'
  });

  // Load customers from localStorage and calculate totals from load data
  const loadCustomersFromStorage = () => {
    const savedCustomers = localStorage.getItem('tms_customers');
    const savedLoads = localStorage.getItem('tms_loads');
    
    let customersData;
    if (savedCustomers) {
      customersData = JSON.parse(savedCustomers);
    } else {
      // Initialize with demo data if no saved customers exist
      customersData = demoCustomers;
      localStorage.setItem('tms_customers', JSON.stringify(demoCustomers));
    }

    // Calculate totals from load data
    if (savedLoads) {
      const loadsData = JSON.parse(savedLoads);
      customersData = calculateCustomerTotalsFromLoads(customersData, loadsData);
    }

    setCustomers(customersData);
  };

  // Calculate customer totals based on actual load data
  const calculateCustomerTotalsFromLoads = (customers, loads) => {
    return customers.map(customer => {
      // Find all loads for this customer
      const customerLoads = loads.filter(load => 
        load.customer === customer.company ||
        load.customer === customer.id ||
        load.customer === customer.contactPerson
      );

      // Calculate totals
      const totalShipments = customerLoads.length;
      const totalRevenue = customerLoads.reduce((sum, load) => sum + (load.rate || 0), 0);
      
      // Find last shipment date
      const lastShipmentDates = customerLoads
        .map(load => load.deliveryDate || load.pickupDate || load.createdAt)
        .filter(date => date)
        .sort((a, b) => new Date(b) - new Date(a));
      
      const lastShipment = lastShipmentDates.length > 0 ? lastShipmentDates[0] : customer.lastShipment;

      return {
        ...customer,
        totalShipments,
        totalRevenue,
        lastShipment
      };
    });
  };

  useEffect(() => {
    loadCustomersFromStorage();
    
    // Listen for customer updates and load updates
    const handleCustomersUpdate = () => {
      loadCustomersFromStorage();
    };

    const handleLoadsUpdate = () => {
      loadCustomersFromStorage(); // Recalculate customer totals when loads change
    };
    
    window.addEventListener('customersUpdated', handleCustomersUpdate);
    window.addEventListener('loadsUpdated', handleLoadsUpdate);
    
    return () => {
      window.removeEventListener('customersUpdated', handleCustomersUpdate);
      window.removeEventListener('loadsUpdated', handleLoadsUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save customers to localStorage whenever customers change
  useEffect(() => {
    if (customers.length > 0) {
      // Save the customer data without dispatching update event to avoid infinite loop
      localStorage.setItem('tms_customers', JSON.stringify(customers));
    }
  }, [customers]);

  // Helper function to save customers and dispatch update event
  const saveCustomersAndDispatch = (customersData) => {
    setCustomers(customersData);
    localStorage.setItem('tms_customers', JSON.stringify(customersData));
    // Dispatch custom event for other components that might listen
    window.dispatchEvent(new CustomEvent('customersUpdated'));
  };

  const getStatusColor = (status) => {
    const statusColors = {
      active: { bgcolor: '#D1FAE5', color: '#059669', label: 'Active' },
      pending: { bgcolor: '#FEF3C7', color: '#D97706', label: 'Pending' },
      inactive: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'Inactive' }
    };
    return statusColors[status] || statusColors.active;
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (mode, customer = null) => {
    setDialogMode(mode);
    setSelectedCustomer(customer);
    
    if (customer && mode === 'edit') {
      setFormData({
        company: customer.company,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        industry: customer.industry,
        paymentTerms: customer.paymentTerms,
        creditLimit: customer.creditLimit,
        notes: customer.notes,
        status: customer.status
      });
    } else {
      setFormData({
        company: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        industry: '',
        paymentTerms: 'Net 30',
        creditLimit: '',
        notes: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
  };

  const handleSaveCustomer = () => {
    if (dialogMode === 'add') {
      const newCustomer = {
        id: `C-${String(customers.length + 1).padStart(3, '0')}`,
        company: formData.company,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        industry: formData.industry,
        rating: 0,
        status: formData.status,
        totalShipments: 0,
        totalRevenue: 0,
        lastShipment: new Date().toISOString(),
        joinedDate: new Date().toISOString(),
        paymentTerms: formData.paymentTerms,
        creditLimit: parseInt(formData.creditLimit) || 0,
        notes: formData.notes
      };
      
      const updatedCustomers = [...customers, newCustomer];
      // Recalculate totals from loads for all customers
      const savedLoads = localStorage.getItem('tms_loads');
      const finalCustomers = savedLoads ? 
        calculateCustomerTotalsFromLoads(updatedCustomers, JSON.parse(savedLoads)) : 
        updatedCustomers;
      
      saveCustomersAndDispatch(finalCustomers);
      setSnackbar({ open: true, message: 'Customer added successfully!', severity: 'success' });
    } else if (dialogMode === 'edit') {
      const updatedCustomers = customers.map(customer => 
        customer.id === selectedCustomer.id ? {
          ...customer,
          company: formData.company,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          industry: formData.industry,
          status: formData.status,
          paymentTerms: formData.paymentTerms,
          creditLimit: parseInt(formData.creditLimit) || 0,
          notes: formData.notes
        } : customer
      );
      
      // Recalculate totals from loads for all customers
      const savedLoads = localStorage.getItem('tms_loads');
      const finalCustomers = savedLoads ? 
        calculateCustomerTotalsFromLoads(updatedCustomers, JSON.parse(savedLoads)) : 
        updatedCustomers;
      
      saveCustomersAndDispatch(finalCustomers);
      setSnackbar({ open: true, message: 'Customer updated successfully!', severity: 'success' });
    }
    handleCloseDialog();
  };

  const handleDeleteCustomer = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    const customerName = customer ? customer.company : 'Customer';
    
    if (!window.confirm(`Are you sure you want to delete ${customerName}? This action cannot be undone.`)) {
      handleCloseMenu();
      return;
    }

    const updatedCustomers = customers.filter(customer => customer.id !== customerId);
    
    // Recalculate totals from loads for remaining customers
    const savedLoads = localStorage.getItem('tms_loads');
    const finalCustomers = savedLoads ? 
      calculateCustomerTotalsFromLoads(updatedCustomers, JSON.parse(savedLoads)) : 
      updatedCustomers;
    
    saveCustomersAndDispatch(finalCustomers);
    setSnackbar({ open: true, message: `${customerName} deleted successfully!`, severity: 'success' });
    handleCloseMenu();
  };

  const handleMenuClick = (event, customerId) => {
    setAnchorEl(event.currentTarget);
    setMenuCustomerId(customerId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuCustomerId(null);
  };

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalRevenue, 0);
  const totalShipments = customers.reduce((sum, customer) => sum + customer.totalShipments, 0);

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Customer Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Manage customer relationships and shipping accounts
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
            Add Customer
          </Button>
        </Box>

        {/* Customer Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Group sx={{ fontSize: 32, color: '#4F46E5', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {customers.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Customers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Star sx={{ fontSize: 32, color: '#10B981', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {customers.filter(c => c.status === 'active').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 32, color: '#F59E0B', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  ${totalRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 32, color: '#EAB308', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {totalShipments.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Shipments
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
                  placeholder="Search customers..."
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
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{ bgcolor: '#F9FAFB' }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
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

      {/* Customers Table */}
      <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Industry</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Shipments</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Revenue</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const statusConfig = getStatusColor(customer.status);
                return (
                  <TableRow key={customer.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
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
                          {customer.company.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                            {customer.company}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            Since {new Date(customer.joinedDate).getFullYear()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', mb: 0.5 }}>
                          {customer.contactPerson}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Email sx={{ color: '#6B7280', mr: 0.5, fontSize: 14 }} />
                          <Typography variant="caption" sx={{ color: '#374151' }}>
                            {customer.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Phone sx={{ color: '#6B7280', mr: 0.5, fontSize: 14 }} />
                          <Typography variant="caption" sx={{ color: '#374151' }}>
                            {customer.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.industry}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: '#E5E7EB',
                          color: '#374151',
                          fontSize: '0.75rem'
                        }}
                      />
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating 
                          value={customer.rating} 
                          readOnly 
                          precision={0.1}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          ({customer.rating})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                        {customer.totalShipments.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoney sx={{ color: '#6B7280', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                          {customer.totalRevenue.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, customer.id)}
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

        {filteredCustomers.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Group sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
              No customers found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first customer'
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
          const customer = customers.find(c => c.id === menuCustomerId);
          handleOpenDialog('view', customer);
          handleCloseMenu();
        }}>
          <Group sx={{ mr: 2, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const customer = customers.find(c => c.id === menuCustomerId);
          handleOpenDialog('edit', customer);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 2, fontSize: 20 }} />
          Edit Customer
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteCustomer(menuCustomerId)}
          sx={{ color: '#DC2626' }}
        >
          <Delete sx={{ mr: 2, fontSize: 20 }} />
          Delete Customer
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
              {dialogMode === 'add' ? 'Add New Customer' : 
               dialogMode === 'edit' ? 'Edit Customer' : 'Customer Details'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="Retail">Retail</MenuItem>
                  <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                  <MenuItem value="Grocery">Grocery</MenuItem>
                  <MenuItem value="Pharmacy">Pharmacy</MenuItem>
                  <MenuItem value="Home Improvement">Home Improvement</MenuItem>
                  <MenuItem value="Electronics">Electronics</MenuItem>
                  <MenuItem value="Automotive">Automotive</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="Net 15">Net 15</MenuItem>
                  <MenuItem value="Net 30">Net 30</MenuItem>
                  <MenuItem value="Net 45">Net 45</MenuItem>
                  <MenuItem value="Net 60">Net 60</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Credit Limit ($)"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                disabled={dialogMode === 'view'}
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="Additional notes about this customer..."
              />
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
              onClick={handleSaveCustomer}
              sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
            >
              {dialogMode === 'add' ? 'Add Customer' : 'Save Changes'}
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

export default CustomerManagement;