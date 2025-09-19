import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
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
  Business,
  Phone,
  Email,
  AttachMoney,
  Star,
  Close,
  TrendingUp
} from '@mui/icons-material';

const BrokerManagement = () => {
  const [brokers, setBrokers] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuBrokerId, setMenuBrokerId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Demo brokers data
  const demoBrokers = [
    {
      id: 'B-001',
      company: 'Global Freight Brokers',
      contactPerson: 'Michael Thompson',
      email: 'michael@globalfreight.com',
      phone: '+1-416-555-0156',
      address: '456 Logistics Blvd, Toronto, ON M5J 2N8',
      rating: 4.8,
      status: 'active',
      totalShipments: 245,
      totalRevenue: 697250,
      lastShipment: '2024-01-15T10:30:00Z',
      joinedDate: '2022-03-20T00:00:00Z',
      paymentTerms: 'Net 30',
      creditLimit: 50000,
      industry: 'Freight Brokerage',
      notes: 'Preferred broker for Ontario routes'
    },
    {
      id: 'B-002',
      company: 'Prime Logistics Solutions',
      contactPerson: 'Sarah Chen',
      email: 'sarah.chen@primelogistics.com',
      phone: '+1-604-555-0234',
      address: '789 Commerce St, Vancouver, BC V6B 4A1',
      rating: 4.6,
      status: 'active',
      totalShipments: 189,
      totalRevenue: 604800,
      lastShipment: '2024-01-12T14:15:00Z',
      joinedDate: '2023-01-15T00:00:00Z',
      paymentTerms: 'Net 15',
      creditLimit: 75000,
      industry: 'Transportation',
      notes: 'Excellent for cross-border shipments'
    },
    {
      id: 'B-003',
      company: 'Atlantic Freight Partners',
      contactPerson: 'David Murphy',
      email: 'd.murphy@atlanticfreight.ca',
      phone: '+1-902-555-0345',
      address: '321 Harbor Dr, Halifax, NS B3J 3K9',
      rating: 4.7,
      status: 'active',
      totalShipments: 156,
      totalRevenue: 468000,
      lastShipment: '2024-01-14T09:45:00Z',
      joinedDate: '2023-06-10T00:00:00Z',
      paymentTerms: 'Net 30',
      creditLimit: 40000,
      industry: 'Logistics',
      notes: 'Maritime provinces specialist'
    },
    {
      id: 'B-004',
      company: 'Prairie Express Brokers',
      contactPerson: 'Jennifer Wilson',
      email: 'j.wilson@prairieexpress.com',
      phone: '+1-306-555-0456',
      address: '987 Industrial Way, Saskatoon, SK S7M 0W4',
      rating: 4.4,
      status: 'active',
      totalShipments: 123,
      totalRevenue: 369000,
      lastShipment: '2024-01-13T16:20:00Z',
      joinedDate: '2023-09-25T00:00:00Z',
      paymentTerms: 'Net 45',
      creditLimit: 35000,
      industry: 'Freight Brokerage',
      notes: 'Agricultural products specialist'
    },
    {
      id: 'B-005',
      company: 'Northern Transport Hub',
      contactPerson: 'Robert Lee',
      email: 'r.lee@northernhub.ca',
      phone: '+1-867-555-0567',
      address: '654 Yukon Rd, Whitehorse, YT Y1A 3E4',
      rating: 4.2,
      status: 'pending',
      totalShipments: 78,
      totalRevenue: 234000,
      lastShipment: '2024-01-10T12:30:00Z',
      joinedDate: '2023-11-15T00:00:00Z',
      paymentTerms: 'Net 60',
      creditLimit: 25000,
      industry: 'Transportation',
      notes: 'Remote locations and mining equipment'
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

  // Load brokers from API
  const loadBrokers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.BROKERS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setBrokers(response.data.data);
      } else {
        setBrokers([]); // No demo data fallback - empty array for real data only
      }
    } catch (error) {
      console.error('Error loading brokers:', error);
      setBrokers([]); // No demo data fallback - empty array for real data only
    }
  };

  // Calculate broker totals based on actual load data
  const calculateBrokerTotalsFromLoads = (brokers, loads) => {
    return brokers.map(broker => {
      // Find all loads for this broker
      const brokerLoads = loads.filter(load => 
        load.broker === broker.company ||
        load.broker === broker.id ||
        load.broker === broker.contactPerson
      );

      // Calculate totals
      const totalShipments = brokerLoads.length;
      const totalRevenue = brokerLoads.reduce((sum, load) => sum + (load.rate || 0), 0);
      
      // Find last shipment date
      const lastShipmentDates = brokerLoads
        .map(load => load.deliveryDate || load.pickupDate || load.createdAt)
        .filter(date => date)
        .sort((a, b) => new Date(b) - new Date(a));
      
      const lastShipment = lastShipmentDates.length > 0 ? lastShipmentDates[0] : broker.lastShipment;

      return {
        ...broker,
        totalShipments,
        totalRevenue,
        lastShipment
      };
    });
  };

  useEffect(() => {
    loadBrokers();
    
    // Listen for broker updates and load updates
    const handleBrokersUpdate = () => {
      loadBrokers();
    };

    const handleLoadsUpdate = () => {
      loadBrokers(); // Recalculate broker totals when loads change
    };
    
    window.addEventListener('brokersUpdated', handleBrokersUpdate);
    window.addEventListener('loadsUpdated', handleLoadsUpdate);
    
    return () => {
      window.removeEventListener('brokersUpdated', handleBrokersUpdate);
      window.removeEventListener('loadsUpdated', handleLoadsUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save brokers to localStorage whenever brokers change
  useEffect(() => {
    if (brokers.length > 0) {
      // Save the broker data without dispatching update event to avoid infinite loop
      localStorage.setItem('tms_brokers', JSON.stringify(brokers));
    }
  }, [brokers]);

  // Helper function to save brokers and dispatch update event
  const saveBrokersAndDispatch = (brokersData) => {
    setBrokers(brokersData);
    localStorage.setItem('tms_brokers', JSON.stringify(brokersData));
    // Dispatch custom event for other components that might listen
    window.dispatchEvent(new CustomEvent('brokersUpdated'));
  };

  const getStatusColor = (status) => {
    const statusColors = {
      active: { bgcolor: '#D1FAE5', color: '#059669', label: 'Active' },
      pending: { bgcolor: '#FEF3C7', color: '#D97706', label: 'Pending' },
      inactive: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'Inactive' }
    };
    return statusColors[status] || statusColors.active;
  };

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = broker.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         broker.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         broker.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || broker.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (mode, broker = null) => {
    setDialogMode(mode);
    setSelectedBroker(broker);
    
    if (broker && mode === 'edit') {
      setFormData({
        company: broker.company,
        contactPerson: broker.contactPerson,
        email: broker.email,
        phone: broker.phone,
        address: broker.address,
        industry: broker.industry,
        paymentTerms: broker.paymentTerms,
        creditLimit: broker.creditLimit,
        notes: broker.notes,
        status: broker.status,
        motorCarrier: broker.motorCarrier || ''
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
    setSelectedBroker(null);
  };

  const handleSaveBroker = () => {
    if (dialogMode === 'add') {
      const newBroker = {
        id: `B-${String(brokers.length + 1).padStart(3, '0')}`,
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
        notes: formData.notes,
        motorCarrier: formData.motorCarrier || ''
      };
      
      const updatedBrokers = [...brokers, newBroker];
      // Recalculate totals from loads for all brokers
      const savedLoads = localStorage.getItem('tms_loads');
      const finalBrokers = savedLoads ? 
        calculateBrokerTotalsFromLoads(updatedBrokers, JSON.parse(savedLoads)) : 
        updatedBrokers;
      
      saveBrokersAndDispatch(finalBrokers);
      setSnackbar({ open: true, message: 'Broker added successfully!', severity: 'success' });
    } else if (dialogMode === 'edit') {
      const updatedBrokers = brokers.map(broker => 
        broker.id === selectedBroker.id ? {
          ...broker,
          company: formData.company,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          industry: formData.industry,
          status: formData.status,
          paymentTerms: formData.paymentTerms,
          creditLimit: parseInt(formData.creditLimit) || 0,
          notes: formData.notes,
          motorCarrier: formData.motorCarrier || ''
        } : broker
      );
      
      // Recalculate totals from loads for all brokers
      const savedLoads = localStorage.getItem('tms_loads');
      const finalBrokers = savedLoads ? 
        calculateBrokerTotalsFromLoads(updatedBrokers, JSON.parse(savedLoads)) : 
        updatedBrokers;
      
      saveBrokersAndDispatch(finalBrokers);
      setSnackbar({ open: true, message: 'Broker updated successfully!', severity: 'success' });
    }
    handleCloseDialog();
  };

  const handleDeleteBroker = (brokerId) => {
    const broker = brokers.find(b => b.id === brokerId);
    const brokerName = broker ? broker.company : 'Broker';
    
    if (!window.confirm(`Are you sure you want to delete ${brokerName}? This action cannot be undone.`)) {
      handleCloseMenu();
      return;
    }

    const updatedBrokers = brokers.filter(broker => broker.id !== brokerId);
    
    // Recalculate totals from loads for remaining brokers
    const savedLoads = localStorage.getItem('tms_loads');
    const finalBrokers = savedLoads ? 
      calculateBrokerTotalsFromLoads(updatedBrokers, JSON.parse(savedLoads)) : 
      updatedBrokers;
    
    saveBrokersAndDispatch(finalBrokers);
    setSnackbar({ open: true, message: `${brokerName} deleted successfully!`, severity: 'success' });
    handleCloseMenu();
  };

  const handleMenuClick = (event, brokerId) => {
    setAnchorEl(event.currentTarget);
    setMenuBrokerId(brokerId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuBrokerId(null);
  };

  const totalRevenue = brokers.reduce((sum, broker) => sum + broker.totalRevenue, 0);
  const totalShipments = brokers.reduce((sum, broker) => sum + broker.totalShipments, 0);

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Broker Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Manage freight broker relationships and load assignments
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
            Add Broker
          </Button>
        </Box>

        {/* Broker Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Business sx={{ fontSize: 32, color: '#4F46E5', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {brokers.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Brokers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Star sx={{ fontSize: 32, color: '#10B981', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {brokers.filter(b => b.status === 'active').length}
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
                  placeholder="Search brokers..."
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

      {/* Brokers Table */}
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
              {filteredBrokers.map((broker) => {
                const statusConfig = getStatusColor(broker.status);
                return (
                  <TableRow key={broker.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
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
                          {broker.company.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                            {broker.company}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            Since {new Date(broker.joinedDate).getFullYear()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', mb: 0.5 }}>
                          {broker.contactPerson}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Email sx={{ color: '#6B7280', mr: 0.5, fontSize: 14 }} />
                          <Typography variant="caption" sx={{ color: '#374151' }}>
                            {broker.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Phone sx={{ color: '#6B7280', mr: 0.5, fontSize: 14 }} />
                          <Typography variant="caption" sx={{ color: '#374151' }}>
                            {broker.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={broker.industry}
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
                          value={broker.rating} 
                          readOnly 
                          precision={0.1}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          ({broker.rating})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                        {broker.totalShipments.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoney sx={{ color: '#6B7280', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                          {broker.totalRevenue.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, broker.id)}
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

        {filteredBrokers.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Business sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
              No brokers found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first broker'
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
          const broker = brokers.find(b => b.id === menuBrokerId);
          handleOpenDialog('view', broker);
          handleCloseMenu();
        }}>
          <Business sx={{ mr: 2, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const broker = brokers.find(b => b.id === menuBrokerId);
          handleOpenDialog('edit', broker);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 2, fontSize: 20 }} />
          Edit Broker
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteBroker(menuBrokerId)}
          sx={{ color: '#DC2626' }}
        >
          <Delete sx={{ mr: 2, fontSize: 20 }} />
          Delete Broker
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
              {dialogMode === 'add' ? 'Add New Broker' : 
               dialogMode === 'edit' ? 'Edit Broker' : 'Broker Details'}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Motor Carrier (MC)"
                value={formData.motorCarrier}
                onChange={(e) => setFormData({ ...formData, motorCarrier: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="e.g. MC-123456"
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
                  <MenuItem value="Freight Brokerage">Freight Brokerage</MenuItem>
                  <MenuItem value="Transportation">Transportation</MenuItem>
                  <MenuItem value="Logistics">Logistics</MenuItem>
                  <MenuItem value="3PL">3PL</MenuItem>
                  <MenuItem value="Warehousing">Warehousing</MenuItem>
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
                placeholder="Additional notes about this broker..."
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
              onClick={handleSaveBroker}
              sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
            >
              {dialogMode === 'add' ? 'Add Broker' : 'Save Changes'}
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

export default BrokerManagement;