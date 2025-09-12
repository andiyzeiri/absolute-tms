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
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  Download,
  DirectionsCar,
  LocationOn,
  Build,
  Warning,
  CheckCircle,
  Close,
  Speed,
  LocalGasStation
} from '@mui/icons-material';

const FleetManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuVehicleId, setMenuVehicleId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Demo vehicles data
  const demoVehicles = [
    {
      id: 'V-001',
      vehicleNumber: 'TRK-001',
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2022,
      type: 'Semi Truck',
      plateNumber: 'ON-123ABC',
      vin: '1FUJGHDV8NLAA1234',
      driver: 'John Stevens',
      status: 'active',
      location: 'Toronto, ON',
      mileage: 125000,
      fuelLevel: 75,
      lastService: '2024-01-10T00:00:00Z',
      nextService: '2024-03-10T00:00:00Z',
      insurance: {
        provider: 'Fleet Insurance Co.',
        policyNumber: 'FL-2024-001',
        expiryDate: '2024-12-31T00:00:00Z'
      },
      alerts: [
        { type: 'maintenance', message: 'Service due in 30 days', severity: 'medium' }
      ]
    },
    {
      id: 'V-002',
      vehicleNumber: 'TRK-002',
      make: 'Peterbilt',
      model: '579',
      year: 2021,
      type: 'Semi Truck',
      plateNumber: 'ON-456DEF',
      vin: '1XP5DB9X8MD123456',
      driver: 'Sarah Miller',
      status: 'in_transit',
      location: 'Calgary, AB',
      mileage: 98000,
      fuelLevel: 45,
      lastService: '2024-01-05T00:00:00Z',
      nextService: '2024-04-05T00:00:00Z',
      insurance: {
        provider: 'Fleet Insurance Co.',
        policyNumber: 'FL-2024-002',
        expiryDate: '2024-12-31T00:00:00Z'
      },
      alerts: []
    },
    {
      id: 'V-003',
      vehicleNumber: 'TRK-003',
      make: 'Kenworth',
      model: 'T680',
      year: 2020,
      type: 'Semi Truck',
      plateNumber: 'ON-789GHI',
      vin: '1XKYDP9X6LJ123456',
      driver: 'Mike Johnson',
      status: 'maintenance',
      location: 'Winnipeg, MB',
      mileage: 145000,
      fuelLevel: 20,
      lastService: '2024-01-15T00:00:00Z',
      nextService: '2024-02-15T00:00:00Z',
      insurance: {
        provider: 'Fleet Insurance Co.',
        policyNumber: 'FL-2024-003',
        expiryDate: '2024-11-30T00:00:00Z'
      },
      alerts: [
        { type: 'insurance', message: 'Insurance expires in 60 days', severity: 'high' },
        { type: 'fuel', message: 'Low fuel level', severity: 'medium' }
      ]
    },
    {
      id: 'V-004',
      vehicleNumber: 'VAN-004',
      make: 'Ford',
      model: 'Transit',
      year: 2023,
      type: 'Delivery Van',
      plateNumber: 'ON-101JKL',
      vin: '1FTBW2CM0PKA12345',
      driver: 'Lisa Chang',
      status: 'active',
      location: 'Ottawa, ON',
      mileage: 35000,
      fuelLevel: 85,
      lastService: '2024-01-08T00:00:00Z',
      nextService: '2024-04-08T00:00:00Z',
      insurance: {
        provider: 'Fleet Insurance Co.',
        policyNumber: 'FL-2024-004',
        expiryDate: '2025-01-15T00:00:00Z'
      },
      alerts: []
    }
  ];

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    make: '',
    model: '',
    year: '',
    type: '',
    plateNumber: '',
    vin: '',
    driver: '',
    status: 'active',
    mileage: '',
    fuelLevel: '',
    insuranceProvider: '',
    policyNumber: '',
    insuranceExpiry: ''
  });

  useEffect(() => {
    setVehicles(demoVehicles);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusConfig = (status) => {
    const statusConfigs = {
      active: { bgcolor: '#D1FAE5', color: '#059669', label: 'Active' },
      in_transit: { bgcolor: '#DBEAFE', color: '#2563EB', label: 'In Transit' },
      maintenance: { bgcolor: '#FEF3C7', color: '#D97706', label: 'Maintenance' },
      inactive: { bgcolor: '#F3F4F6', color: '#6B7280', label: 'Inactive' }
    };
    return statusConfigs[status] || statusConfigs.active;
  };

  const getAlertSeverityColor = (severity) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B', 
      high: '#EF4444',
      critical: '#DC2626'
    };
    return colors[severity] || colors.medium;
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.driver?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || vehicle.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (mode, vehicle = null) => {
    setDialogMode(mode);
    setSelectedVehicle(vehicle);
    
    if (vehicle && mode === 'edit') {
      setFormData({
        vehicleNumber: vehicle.vehicleNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        plateNumber: vehicle.plateNumber,
        vin: vehicle.vin,
        driver: vehicle.driver || '',
        status: vehicle.status,
        mileage: vehicle.mileage,
        fuelLevel: vehicle.fuelLevel,
        insuranceProvider: vehicle.insurance.provider,
        policyNumber: vehicle.insurance.policyNumber,
        insuranceExpiry: vehicle.insurance.expiryDate.split('T')[0]
      });
    } else {
      // Reset form for new vehicle
      setFormData({
        vehicleNumber: `TRK-${String(vehicles.length + 1).padStart(3, '0')}`,
        make: '',
        model: '',
        year: '',
        type: '',
        plateNumber: '',
        vin: '',
        driver: '',
        status: 'active',
        mileage: '',
        fuelLevel: '',
        insuranceProvider: '',
        policyNumber: '',
        insuranceExpiry: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVehicle(null);
  };

  const handleSaveVehicle = () => {
    if (dialogMode === 'add') {
      const newVehicle = {
        id: `V-${String(vehicles.length + 1).padStart(3, '0')}`,
        vehicleNumber: formData.vehicleNumber,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        type: formData.type,
        plateNumber: formData.plateNumber,
        vin: formData.vin,
        driver: formData.driver,
        status: formData.status,
        location: 'Base Location',
        mileage: parseInt(formData.mileage),
        fuelLevel: parseInt(formData.fuelLevel),
        lastService: new Date().toISOString(),
        nextService: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        insurance: {
          provider: formData.insuranceProvider,
          policyNumber: formData.policyNumber,
          expiryDate: new Date(formData.insuranceExpiry).toISOString()
        },
        alerts: []
      };
      setVehicles([...vehicles, newVehicle]);
      setSnackbar({ open: true, message: 'Vehicle added successfully!', severity: 'success' });
    } else if (dialogMode === 'edit') {
      const updatedVehicles = vehicles.map(vehicle => 
        vehicle.id === selectedVehicle.id ? {
          ...vehicle,
          vehicleNumber: formData.vehicleNumber,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          type: formData.type,
          plateNumber: formData.plateNumber,
          vin: formData.vin,
          driver: formData.driver,
          status: formData.status,
          mileage: parseInt(formData.mileage),
          fuelLevel: parseInt(formData.fuelLevel),
          insurance: {
            ...vehicle.insurance,
            provider: formData.insuranceProvider,
            policyNumber: formData.policyNumber,
            expiryDate: new Date(formData.insuranceExpiry).toISOString()
          }
        } : vehicle
      );
      setVehicles(updatedVehicles);
      setSnackbar({ open: true, message: 'Vehicle updated successfully!', severity: 'success' });
    }
    handleCloseDialog();
  };

  const handleDeleteVehicle = (vehicleId) => {
    const updatedVehicles = vehicles.filter(vehicle => vehicle.id !== vehicleId);
    setVehicles(updatedVehicles);
    setSnackbar({ open: true, message: 'Vehicle deleted successfully!', severity: 'success' });
    handleCloseMenu();
  };

  const handleMenuClick = (event, vehicleId) => {
    setAnchorEl(event.currentTarget);
    setMenuVehicleId(vehicleId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuVehicleId(null);
  };

  const vehicleTypes = ['Semi Truck', 'Delivery Van', 'Box Truck', 'Flatbed', 'Tanker', 'Refrigerated'];
  const makes = ['Freightliner', 'Peterbilt', 'Kenworth', 'Volvo', 'Mack', 'International', 'Ford', 'Mercedes'];

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Fleet Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Manage your fleet vehicles, maintenance, and tracking
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
            Add Vehicle
          </Button>
        </Box>

        {/* Fleet Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <DirectionsCar sx={{ fontSize: 32, color: '#4F46E5', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {vehicles.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Vehicles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 32, color: '#10B981', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {vehicles.filter(v => v.status === 'active').length}
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
                <Build sx={{ fontSize: 32, color: '#F59E0B', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {vehicles.filter(v => v.status === 'maintenance').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  In Maintenance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Warning sx={{ fontSize: 32, color: '#EF4444', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {vehicles.filter(v => v.alerts && v.alerts.length > 0).length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  With Alerts
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
                  placeholder="Search vehicles..."
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
                    <MenuItem value="in_transit">In Transit</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
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

      {/* Vehicles Table */}
      <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Mileage</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Fuel</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Alerts</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVehicles.map((vehicle) => {
                const statusConfig = getStatusConfig(vehicle.status);
                return (
                  <TableRow key={vehicle.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsCar sx={{ color: '#4F46E5', mr: 2, fontSize: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                            {vehicle.vehicleNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {vehicle.driver ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#4F46E5', fontSize: '0.75rem', mr: 1 }}>
                            {vehicle.driver.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="body2" sx={{ color: '#374151' }}>
                            {vehicle.driver}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                          Unassigned
                        </Typography>
                      )}
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
                        <LocationOn sx={{ color: '#6B7280', mr: 0.5, fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {vehicle.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Speed sx={{ color: '#6B7280', mr: 0.5, fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {vehicle.mileage?.toLocaleString()} mi
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalGasStation sx={{ color: '#6B7280', mr: 1, fontSize: 16 }} />
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={vehicle.fuelLevel} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: '#E5E7EB',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: vehicle.fuelLevel < 25 ? '#EF4444' : vehicle.fuelLevel < 50 ? '#F59E0B' : '#10B981'
                              }
                            }} 
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#6B7280', minWidth: '30px' }}>
                          {vehicle.fuelLevel}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {vehicle.alerts && vehicle.alerts.length > 0 ? (
                        <Badge badgeContent={vehicle.alerts.length} color="error">
                          <Warning sx={{ color: getAlertSeverityColor(vehicle.alerts[0].severity), fontSize: 20 }} />
                        </Badge>
                      ) : (
                        <CheckCircle sx={{ color: '#10B981', fontSize: 20 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, vehicle.id)}
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

        {filteredVehicles.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <DirectionsCar sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
              No vehicles found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first vehicle'
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
          const vehicle = vehicles.find(v => v.id === menuVehicleId);
          handleOpenDialog('view', vehicle);
          handleCloseMenu();
        }}>
          <DirectionsCar sx={{ mr: 2, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const vehicle = vehicles.find(v => v.id === menuVehicleId);
          handleOpenDialog('edit', vehicle);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 2, fontSize: 20 }} />
          Edit Vehicle
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          <Build sx={{ mr: 2, fontSize: 20 }} />
          Schedule Maintenance
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteVehicle(menuVehicleId)}
          sx={{ color: '#DC2626' }}
        >
          <Delete sx={{ mr: 2, fontSize: 20 }} />
          Delete Vehicle
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
              {dialogMode === 'add' ? 'Add New Vehicle' : 
               dialogMode === 'edit' ? 'Edit Vehicle' : 'Vehicle Details'}
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
                label="Vehicle Number"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  {vehicleTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Make</InputLabel>
                <Select
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  {makes.map(make => (
                    <MenuItem key={make} value={make}>{make}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                disabled={dialogMode === 'view'}
                inputProps={{ min: 1980, max: new Date().getFullYear() + 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plate Number"
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="VIN Number"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assigned Driver"
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
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
                  <MenuItem value="in_transit">In Transit</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fuel Level (%)"
                type="number"
                value={formData.fuelLevel}
                onChange={(e) => setFormData({ ...formData, fuelLevel: e.target.value })}
                disabled={dialogMode === 'view'}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Insurance Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Insurance Provider"
                value={formData.insuranceProvider}
                onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Policy Number"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Insurance Expiry"
                type="date"
                value={formData.insuranceExpiry}
                onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
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
              onClick={handleSaveVehicle}
              sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
            >
              {dialogMode === 'add' ? 'Add Vehicle' : 'Save Changes'}
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

export default FleetManagement;