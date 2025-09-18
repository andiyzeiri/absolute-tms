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
  Menu,
  Divider,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  Download,
  People,
  Phone,
  Email,
  Badge as BadgeIcon,
  Close,
  DriveEta,
  AttachMoney,
  AddCircle,
  RemoveCircle
} from '@mui/icons-material';
import axios from 'axios';

const DriverManagement = () => {
  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [drivers, setDrivers] = useState(() => {
    // Try to load drivers from localStorage first
    const savedDrivers = localStorage.getItem('tms_drivers');
    return savedDrivers ? JSON.parse(savedDrivers) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuDriverId, setMenuDriverId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Demo drivers data
  const demoDrivers = [
    {
      id: 'D-001',
      firstName: 'John',
      lastName: 'Stevens',
      email: 'john.stevens@company.com',
      phone: '4165550123',
      licenseNumber: 'ON-DL-123456789',
      licenseExpiry: '2025-06-15T00:00:00Z',
      status: 'active',
      rating: 4.8,
      completedTrips: 245,
      totalMiles: 125000,
      joinDate: '2022-03-15T00:00:00Z',
      dateHired: '2022-03-15',
      dateOfBirth: '1985-07-22',
      age: 38,
      yearsExperience: 15,
      fein: '12-3456789',
      businessName: 'Stevens Transport LLC',
      address: {
        street: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 1A1'
      },
      emergencyContact: {
        name: 'Jane Stevens',
        phone: '4165550124',
        relationship: 'Spouse'
      },
      currentLocation: 'Toronto, ON',
      assignedVehicle: 'TRK-001',
      certificates: ['Dangerous Goods', 'Long Haul'],
      alerts: [],
      billsDue: [
        { id: 1, description: 'Fuel Card Payment', amount: 450.00 },
        { id: 2, description: 'Insurance Deductible', amount: 250.00 }
      ],
      driverType: 'owner_operator'
    },
    {
      id: 'D-002',
      firstName: 'Sarah',
      lastName: 'Miller',
      email: 'sarah.miller@company.com',
      phone: '4035550156',
      licenseNumber: 'AB-DL-987654321',
      licenseExpiry: '2024-12-20T00:00:00Z',
      status: 'on_trip',
      rating: 4.6,
      completedTrips: 189,
      totalMiles: 98000,
      joinDate: '2022-07-22T00:00:00Z',
      dateHired: '2022-07-22',
      dateOfBirth: '1990-11-08',
      age: 33,
      yearsExperience: 8,
      fein: '98-7654321',
      businessName: 'Miller Logistics Inc',
      address: {
        street: '456 Oak Ave',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1J9'
      },
      emergencyContact: {
        name: 'Robert Miller',
        phone: '4035550157',
        relationship: 'Father'
      },
      currentLocation: 'Calgary, AB',
      assignedVehicle: 'TRK-002',
      certificates: ['FAST Card', 'Hazmat'],
      alerts: [
        { type: 'license', message: 'License expires in 60 days', severity: 'medium' }
      ],
      billsDue: [
        { id: 1, description: 'Equipment Rental', amount: 320.00 },
        { id: 2, description: 'License Renewal', amount: 180.00 }
      ],
      driverType: 'company_driver'
    },
    {
      id: 'D-003',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@company.com',
      phone: '2045550189',
      licenseNumber: 'MB-DL-456789123',
      licenseExpiry: '2025-03-10T00:00:00Z',
      status: 'available',
      rating: 4.9,
      completedTrips: 312,
      totalMiles: 175000,
      joinDate: '2021-11-08T00:00:00Z',
      dateHired: '2021-11-08',
      dateOfBirth: '1978-04-15',
      age: 45,
      yearsExperience: 22,
      fein: '45-6789123',
      businessName: 'Johnson Heavy Haul',
      address: {
        street: '789 Elm St',
        city: 'Winnipeg',
        province: 'MB',
        postalCode: 'R3C 1A5'
      },
      emergencyContact: {
        name: 'Lisa Johnson',
        phone: '2045550190',
        relationship: 'Wife'
      },
      currentLocation: 'Winnipeg, MB',
      assignedVehicle: 'TRK-003',
      certificates: ['Dangerous Goods', 'Long Haul', 'FAST Card'],
      alerts: [],
      billsDue: [
        { id: 1, description: 'Medical Exam', amount: 150.00 }
      ],
      driverType: 'company_driver'
    },
    {
      id: 'D-004',
      firstName: 'Lisa',
      lastName: 'Chang',
      email: 'lisa.chang@company.com',
      phone: '6135550234',
      licenseNumber: 'ON-DL-789123456',
      licenseExpiry: '2024-09-30T00:00:00Z',
      status: 'off_duty',
      rating: 4.7,
      completedTrips: 156,
      totalMiles: 67000,
      joinDate: '2023-02-14T00:00:00Z',
      dateHired: '2023-02-14',
      dateOfBirth: '1992-09-30',
      age: 31,
      yearsExperience: 5,
      fein: '78-9123456',
      businessName: 'Chang Delivery Services',
      address: {
        street: '321 Pine St',
        city: 'Ottawa',
        province: 'ON',
        postalCode: 'K1A 0A6'
      },
      emergencyContact: {
        name: 'David Chang',
        phone: '6135550235',
        relationship: 'Brother'
      },
      currentLocation: 'Ottawa, ON',
      assignedVehicle: 'VAN-004',
      certificates: ['Urban Delivery'],
      alerts: [
        { type: 'license', message: 'License expires in 30 days', severity: 'high' }
      ],
      billsDue: [
        { id: 1, description: 'Training Course', amount: 275.00 },
        { id: 2, description: 'Uniform Allowance', amount: 120.00 }
      ],
      driverType: 'owner_operator'
    }
  ];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    assignedVehicle: '',
    billsDue: [],
    dateHired: '',
    dateOfBirth: '',
    age: '',
    yearsExperience: '',
    fein: '',
    businessName: '',
    driverType: 'company_driver'
  });
  
  const [newBill, setNewBill] = useState({ description: '', amount: '' });

  // Fetch drivers from API
  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/drivers');
      const driversData = response.data.data || [];
      
      // Transform API data to match expected format
      const transformedDrivers = driversData.map(driver => ({
        id: driver._id,
        firstName: driver.name.split(' ')[0],
        lastName: driver.name.split(' ').slice(1).join(' '),
        email: driver.email,
        phone: '5555550000', // Default since not in API
        licenseNumber: 'DL-' + driver._id.slice(-6),
        licenseExpiry: '2025-12-31T00:00:00Z',
        status: 'active',
        rating: 4.5,
        completedTrips: Math.floor(Math.random() * 100) + 50,
        totalMiles: Math.floor(Math.random() * 50000) + 25000,
        joinDate: '2023-01-01T00:00:00Z',
        address: {
          street: '123 Main St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 1A1'
        },
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '5555550000',
          relationship: 'Family'
        },
        currentLocation: 'Toronto, ON',
        assignedVehicle: 'TRK-' + Math.floor(Math.random() * 100).toString().padStart(3, '0'),
        certificates: driver.driverType === 'owner_operator' ? ['Owner Operator', 'Long Haul'] : ['Company Driver'],
        alerts: [],
        billsDue: [], // Initialize empty bills array for API drivers
        dateHired: '2023-01-01',
        dateOfBirth: '1985-01-01',
        age: 38,
        yearsExperience: 10,
        fein: '00-0000000',
        businessName: 'Independent Contractor',
        driverType: driver.driverType,
        yearlyGross: driver.yearlyGross,
        profit: driver.profit,
        profitMargin: driver.profitMargin
      }));
      
      setDrivers(transformedDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Fallback to demo data if API fails
      setDrivers(demoDrivers); // Show all demo drivers
      setSnackbar({ 
        open: true, 
        message: 'Using demo data - API not available', 
        severity: 'warning' 
      });
    }
  };

  useEffect(() => {
    // Only fetch from API if no saved drivers exist
    if (drivers.length === 0) {
      fetchDrivers();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save drivers to localStorage whenever drivers state changes
  useEffect(() => {
    if (drivers.length > 0) {
      localStorage.setItem('tms_drivers', JSON.stringify(drivers));
      // Dispatch custom event to notify other components (like Dashboard)
      window.dispatchEvent(new CustomEvent('driversUpdated'));
    }
  }, [drivers]);


  const filteredDrivers = drivers.filter(driver => {
    const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleOpenDialog = (mode, driver = null) => {
    setDialogMode(mode);
    setSelectedDriver(driver);
    
    if (driver && mode === 'edit') {
      setFormData({
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry.split('T')[0],
        street: driver.address.street,
        city: driver.address.city,
        province: driver.address.province,
        postalCode: driver.address.postalCode,
        assignedVehicle: driver.assignedVehicle || '',
        billsDue: driver.billsDue || [],
        dateHired: driver.dateHired || '',
        dateOfBirth: driver.dateOfBirth || '',
        age: driver.age || '',
        yearsExperience: driver.yearsExperience || '',
        fein: driver.fein || '',
        businessName: driver.businessName || '',
        driverType: driver.driverType || 'company_driver'
      });
    } else {
      // Reset form for new driver
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        licenseExpiry: '',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        assignedVehicle: '',
        billsDue: [],
        dateHired: '',
        dateOfBirth: '',
        age: '',
        yearsExperience: '',
        fein: '',
        businessName: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDriver(null);
    setNewBill({ description: '', amount: '' });
  };

  const handleSaveDriver = async () => {
    try {
      if (dialogMode === 'add') {
        // Generate a unique ID for the new driver
        const newId = 'D-' + String(drivers.length + 1).padStart(3, '0');
        
        const newDriver = {
          id: newId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry,
          status: 'available',
          rating: 0,
          completedTrips: 0,
          totalMiles: 0,
          joinDate: new Date().toISOString(),
          dateHired: formData.dateHired,
          dateOfBirth: formData.dateOfBirth,
          age: parseInt(formData.age) || 0,
          yearsExperience: parseInt(formData.yearsExperience) || 0,
          fein: formData.fein,
          businessName: formData.businessName,
          address: {
            street: formData.street,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode
          },
          emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
          },
          currentLocation: `${formData.city}, ${formData.province}`,
          assignedVehicle: formData.assignedVehicle || 'Unassigned',
          certificates: [],
          alerts: [],
          billsDue: formData.billsDue || [],
          driverType: formData.driverType,
          yearlyGross: 0,
          profit: 0,
          profitMargin: 0
        };
        
        // Add to local state (will automatically save to localStorage via useEffect)
        setDrivers([...drivers, newDriver]);
        setSnackbar({ open: true, message: 'Driver added successfully!', severity: 'success' });
        
      } else if (dialogMode === 'edit') {
        // Update local driver data with form changes
        const updatedDrivers = drivers.map(driver => 
          driver.id === selectedDriver.id ? {
            ...driver,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            licenseNumber: formData.licenseNumber,
            licenseExpiry: formData.licenseExpiry,
            address: {
              street: formData.street,
              city: formData.city,
              province: formData.province,
              postalCode: formData.postalCode
            },
            assignedVehicle: formData.assignedVehicle,
            billsDue: formData.billsDue,
            dateHired: formData.dateHired,
            dateOfBirth: formData.dateOfBirth,
            age: parseInt(formData.age) || driver.age,
            yearsExperience: parseInt(formData.yearsExperience) || driver.yearsExperience,
            fein: formData.fein,
            businessName: formData.businessName,
            driverType: formData.driverType
          } : driver
        );
        setDrivers(updatedDrivers);
        
        // Also update financial data in API if available
        if (selectedDriver && selectedDriver.id) {
          try {
            await axios.put(`/api/drivers/${selectedDriver.id}/financials`, {
              yearlyGross: selectedDriver.yearlyGross || 0,
              yearlyProfit: selectedDriver.profit || 0,
              driverType: selectedDriver.driverType || 'company_driver'
            });
          } catch (apiError) {
            console.log('API update failed, but local data was updated:', apiError);
          }
        }
        
        setSnackbar({ open: true, message: 'Driver updated successfully!', severity: 'success' });
      }
    } catch (error) {
      console.error('Error saving driver:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to save driver', 
        severity: 'error' 
      });
    }
    handleCloseDialog();
  };

  const handleDeleteDriver = async (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    const driverName = driver ? capitalizeWords(`${driver.firstName} ${driver.lastName}`) : 'Driver';
    
    if (!window.confirm(`Are you sure you want to delete ${driverName}? This action cannot be undone.`)) {
      handleCloseMenu();
      return;
    }

    try {
      await axios.delete(`/api/drivers/${driverId}`);
      await fetchDrivers(); // Refresh the list
      setSnackbar({ 
        open: true, 
        message: `${driverName} deleted successfully!`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error deleting driver:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to delete driver', 
        severity: 'error' 
      });
    }
    handleCloseMenu();
  };

  const handleMenuClick = (event, driverId) => {
    setAnchorEl(event.currentTarget);
    setMenuDriverId(driverId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuDriverId(null);
  };

  const statesProvinces = [
    // Canadian Provinces/Territories
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
    // US States
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
  ];

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      // Handle US numbers with country code
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone; // Return original if can't format
  };


  const addBill = () => {
    if (newBill.description && newBill.amount) {
      const bill = {
        id: Date.now(),
        description: newBill.description,
        amount: parseFloat(newBill.amount)
      };
      setFormData({ ...formData, billsDue: [...formData.billsDue, bill] });
      setNewBill({ description: '', amount: '' });
    }
  };

  const removeBill = (billId) => {
    setFormData({ 
      ...formData, 
      billsDue: formData.billsDue.filter(bill => bill.id !== billId) 
    });
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Driver Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Manage your drivers, licenses, and assignments
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
            Add Driver
          </Button>
        </Box>

        {/* Driver Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <People sx={{ fontSize: 32, color: '#4F46E5', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {drivers.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Drivers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 32, color: '#DC2626', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  ${drivers.reduce((acc, d) => acc + (d.billsDue ? d.billsDue.reduce((sum, bill) => sum + bill.amount, 0) : 0), 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Bills Due
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
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: '#9CA3AF', mr: 1 }} />
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB' } }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
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

      {/* Drivers Table */}
      <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>License</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Business</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Bills Due</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDrivers.map((driver) => {
                return (
                  <TableRow key={driver.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                          {capitalizeWords(`${driver.firstName} ${driver.lastName}`)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          Age {driver.age} • {driver.yearsExperience} years exp
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Email sx={{ color: '#6B7280', mr: 0.5, fontSize: 14 }} />
                          <Typography variant="caption" sx={{ color: '#374151' }}>
                            {driver.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Phone sx={{ color: '#6B7280', mr: 0.5, fontSize: 14 }} />
                          <Typography variant="caption" sx={{ color: '#374151' }}>
                            {formatPhoneNumber(driver.phone)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BadgeIcon sx={{ color: '#6B7280', mr: 1, fontSize: 16 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#111827', fontWeight: 500 }}>
                            {driver.licenseNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: new Date(driver.licenseExpiry) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) ? '#EF4444' : '#6B7280' 
                          }}>
                            Expires: {new Date(driver.licenseExpiry).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                        {driver.address.street}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {driver.address.city}, {driver.address.province} {driver.address.postalCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                        {driver.businessName || 'N/A'}
                      </Typography>
                      {driver.fein && (
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          FEIN: {driver.fein}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                        {driver.assignedVehicle || 'Unassigned'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {driver.billsDue && driver.billsDue.length > 0 ? (
                          <>
                            <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 600 }}>
                              ${driver.billsDue.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                              {driver.billsDue.length} bill{driver.billsDue.length !== 1 ? 's' : ''}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            No bills
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, driver.id)}
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

        {filteredDrivers.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <People sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
              No drivers found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {searchTerm 
                ? 'Try adjusting your search'
                : 'Get started by adding your first driver'
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
          const driver = drivers.find(d => d.id === menuDriverId);
          handleOpenDialog('view', driver);
          handleCloseMenu();
        }}>
          <People sx={{ mr: 2, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const driver = drivers.find(d => d.id === menuDriverId);
          handleOpenDialog('edit', driver);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 2, fontSize: 20 }} />
          Edit Driver
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          <DriveEta sx={{ mr: 2, fontSize: 20 }} />
          Assign Trip
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteDriver(menuDriverId)}
          sx={{ color: '#DC2626' }}
        >
          <Delete sx={{ mr: 2, fontSize: 20 }} />
          Delete Driver
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
              {dialogMode === 'add' ? 'Add New Driver' : 
               dialogMode === 'edit' ? 'Edit Driver' : 'Driver Details'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Personal Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                value={formatPhoneNumber(formData.phone)}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, phone: cleaned });
                }}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  const dob = e.target.value;
                  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : '';
                  setFormData({ ...formData, dateOfBirth: dob, age: age.toString() });
                }}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                disabled={dialogMode === 'view'}
                type="number"
              />
            </Grid>

            {/* Employment Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Employment Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date Hired"
                type="date"
                value={formData.dateHired}
                onChange={(e) => setFormData({ ...formData, dateHired: e.target.value })}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Years Experience"
                type="number"
                value={formData.yearsExperience}
                onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="Years of driving experience"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="FEIN"
                value={formData.fein}
                onChange={(e) => setFormData({ ...formData, fein: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="Federal Employer ID Number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="Business or company name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Driver Type</InputLabel>
                <Select
                  value={formData.driverType}
                  onChange={(e) => setFormData({ ...formData, driverType: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="company_driver">Company Driver</MenuItem>
                  <MenuItem value="owner_operator">Owner Operator</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* License Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                License Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Number"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Expiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>State/Province</InputLabel>
                <Select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  {statesProvinces.map(stateProvince => (
                    <MenuItem key={stateProvince} value={stateProvince}>{stateProvince}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>

            {/* Assignment */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Assignment
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assigned Vehicle"
                value={formData.assignedVehicle}
                onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="e.g., TRK-001"
              />
            </Grid>

            {/* Bills Due */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Bills Due
              </Typography>
            </Grid>
            
            {dialogMode !== 'view' && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Bill Description"
                    value={newBill.description}
                    onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                    placeholder="e.g., Fuel Card Payment"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Amount ($)"
                    type="number"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <Button
                    variant="contained"
                    onClick={addBill}
                    disabled={!newBill.description || !newBill.amount}
                    sx={{ height: '56px', bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                    startIcon={<AddCircle />}
                  >
                    Add Bill
                  </Button>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              {formData.billsDue.length > 0 ? (
                <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, bgcolor: '#F9FAFB' }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                      Total Bills Due: ${formData.billsDue.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <List>
                    {formData.billsDue.map((bill) => (
                      <ListItem key={bill.id} sx={{ py: 1 }}>
                        <AttachMoney sx={{ color: '#DC2626', mr: 1, fontSize: 20 }} />
                        <ListItemText
                          primary={bill.description}
                          secondary={`$${bill.amount.toFixed(2)}`}
                        />
                        {dialogMode !== 'view' && (
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => removeBill(bill.id)}
                              size="small"
                              sx={{ color: '#DC2626' }}
                            >
                              <RemoveCircle />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                  No bills due
                </Typography>
              )}
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
              onClick={handleSaveDriver}
              sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
            >
              {dialogMode === 'add' ? 'Add Driver' : 'Save Changes'}
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

export default DriverManagement;