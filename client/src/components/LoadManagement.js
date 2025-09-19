import React, { useState, useEffect } from 'react';
import axios from 'axios';
import googleMapsService from '../services/googleMapsService';
import API_ENDPOINTS from '../config/api';
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
  Autocomplete,
  ClickAwayListener,
  Paper,
  Popper
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  Download,
  LocalShipping,
  LocationOn,
  Person,
  AttachMoney,
  Schedule,
  Close,
  Receipt,
  DirectionsCar,
  Timeline,
  CheckCircle,
  Warning,
  PictureAsPdf,
  CloudUpload
} from '@mui/icons-material';

// Import constants
import { DRIVING_DISTANCES } from '../constants/drivingDistances';
import { STATE_COORDS } from '../constants/stateCoords';
import { US_STATES } from '../constants/usStates';
import { colors, buttonStyles, borderStyles, backgroundStyles, dialogStyles, cardStyles, textStyles, containerStyles, inputStyles } from '../constants/styles';

const LoadManagement = () => {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'view'
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuLoadId, setMenuLoadId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [availableBrokers, setAvailableBrokers] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentUpload, setCurrentUpload] = useState({ loadId: null, type: null });
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdf, setCurrentPdf] = useState({ url: '', title: '' });
  const [pdfManagerOpen, setPdfManagerOpen] = useState(false);
  const [currentPdfManager, setCurrentPdfManager] = useState({ loadId: null, type: null, loadNumber: '' });

  // Inline editing states
  const [editingCell, setEditingCell] = useState({ loadId: null, field: null });
  const [editingValue, setEditingValue] = useState('');
  const [popperAnchorEl, setPopperAnchorEl] = useState(null);
  const [popperField, setPopperField] = useState(null);

  // Demo data - in real app this would come from API
  const demoLoads = [
    {
      id: 'L-2024-001',
      loadNumber: 'L-2024-001',
      customer: 'Walmart Canada Corp',
      motorCarrier: 'MC-789654',
      origin: { city: 'New York', province: 'NY', address: '123 Broadway, New York, NY' },
      destination: { city: 'Los Angeles', province: 'CA', address: '456 Sunset Blvd, Los Angeles, CA' },
      driver: 'John Stevens',
      vehicle: 'Truck-001',
      status: 'in_transit',
      pickupDate: '2024-01-15T10:00:00Z',
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      pickupTime: '10:00',
      deliveryTime: '14:00',
      rate: 4250,
      weight: '12,500 lbs',
      commodity: 'Electronics',
      notes: 'High-value electronics, fragile handling required. Customer prefers morning delivery.',
      createdAt: '2024-01-10T09:00:00Z',
      proofOfDelivery: [{
        filename: 'POD_L-2024-001_electronics.pdf',
        path: '/uploads/POD_L-2024-001_electronics.pdf',
        uploadedAt: '2024-01-18T16:00:00Z',
        size: 245760,
        _id: 'pdf_001_pod_1'
      }],
      rateConfirmation: []
    },
    {
      id: 'L-2024-002',
      loadNumber: 'L-2024-002',
      customer: 'Canadian Tire Corporation',
      motorCarrier: 'MC-456123',
      origin: { city: 'Chicago', province: 'IL', address: '789 Michigan Ave, Chicago, IL' },
      destination: { city: 'Houston', province: 'TX', address: '321 Main St, Houston, TX' },
      driver: 'Sarah Miller',
      vehicle: 'Truck-002',
      status: 'pending',
      pickupDate: '2024-01-20T08:00:00Z',
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      pickupTime: '08:00',
      deliveryTime: '16:00',
      rate: 3890,
      weight: '8,750 lbs',
      commodity: 'Automotive Parts',
      notes: 'Standard automotive parts shipment. Dock access available 8am-5pm.',
      createdAt: '2024-01-12T11:30:00Z',
      proofOfDelivery: [],
      rateConfirmation: [{
        filename: 'RC_L-2024-002_automotive.pdf',
        path: '/uploads/RC_L-2024-002_automotive.pdf',
        uploadedAt: '2024-01-12T12:00:00Z',
        size: 189440,
        _id: 'pdf_002_rc_1'
      }]
    },
    {
      id: 'L-2024-003',
      loadNumber: 'L-2024-003',
      broker: 'Global Freight Brokers',
      motorCarrier: 'MC-321987',
      origin: { city: 'Miami', province: 'FL', address: '555 Ocean Drive, Miami, FL' },
      destination: { city: 'Seattle', province: 'WA', address: '777 Pine St, Seattle, WA' },
      driver: 'Mike Johnson',
      vehicle: 'Truck-003',
      status: 'delivered',
      pickupDate: '2024-01-12T07:00:00Z',
      deliveryDate: '2024-01-15T15:00:00Z',
      pickupTime: '07:00',
      deliveryTime: '15:00',
      rate: 5120,
      weight: '15,200 lbs',
      commodity: 'Food Products',
      notes: 'Refrigerated transport required. Temperature maintained at 32-35°F throughout journey.',
      createdAt: '2024-01-08T14:15:00Z',
      proofOfDelivery: [{
        filename: 'POD_L-2024-003_food.pdf',
        path: '/uploads/POD_L-2024-003_food.pdf',
        uploadedAt: '2024-01-15T17:00:00Z',
        size: 312320,
        _id: 'pdf_003_pod_1'
      }],
      rateConfirmation: [{
        filename: 'RC_L-2024-003_food.pdf',
        path: '/uploads/RC_L-2024-003_food.pdf',
        uploadedAt: '2024-01-08T15:00:00Z',
        size: 156672,
        _id: 'pdf_003_rc_1'
      }]
    },
    {
      id: 'L-2024-004',
      loadNumber: 'L-2024-004',
      customer: 'Prairie Logistics',
      motorCarrier: 'MC-654987',
      origin: { city: 'Phoenix', province: 'AZ', address: '101 Central Ave, Phoenix, AZ' },
      destination: { city: 'Boston', province: 'MA', address: '202 Newbury St, Boston, MA' },
      driver: 'Lisa Chang',
      vehicle: 'Truck-004',
      status: 'delayed',
      pickupDate: '2024-01-16T09:00:00Z',
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      pickupTime: '09:00',
      deliveryTime: '17:00',
      rate: 4750,
      weight: '11,800 lbs',
      commodity: 'Industrial Equipment',
      notes: 'Weather delays expected. Heavy machinery requires special loading equipment at destination.',
      createdAt: '2024-01-11T10:45:00Z',
      proofOfDelivery: [],
      rateConfirmation: []
    }
  ];

  const [formData, setFormData] = useState({
    loadNumber: '',
    customer: '',
    broker: '',
    originCity: '',
    originProvince: '',
    originAddress: '',
    destinationCity: '',
    destinationProvince: '',
    destinationAddress: '',
    driver: '',
    vehicle: '',
    pickupDate: '',
    deliveryDate: '',
    pickupTime: '',
    deliveryTime: '',
    rate: '',
    weight: '',
    commodity: '',
    notes: '',
    status: 'pending'
  });

  // Load loads from API
  const loadLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.LOADS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        // Transform API data to match frontend expectations
        const transformedLoads = response.data.data.map(load => ({
          ...load,
          id: load._id || load.id, // Ensure id field exists for frontend
          proofOfDelivery: load.proofOfDelivery || [],
          rateConfirmation: load.rateConfirmation || [],
          // Ensure origin and destination have proper structure
          origin: {
            city: load.origin?.city || '',
            province: load.origin?.province || '',
            address: load.origin?.address || ''
          },
          destination: {
            city: load.destination?.city || '',
            province: load.destination?.province || '',
            address: load.destination?.address || ''
          }
        }));
        setLoads(transformedLoads);
      } else {
        setLoads([]); // No demo data fallback - empty array for real data only
      }
    } catch (error) {
      console.error('Error loading loads:', error);

      // Handle authentication errors differently
      if (error.response?.status === 401) {
        // Token expired - redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      // For other errors, don't clear existing data - keep current loads
      // setLoads([]) removed to prevent data loss on network errors
    }
  };

  // Load customers from API
  const loadCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CUSTOMERS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setAvailableCustomers(response.data.data.map(c => c.companyName));
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setAvailableCustomers([]);
    }
  };

  // Load brokers from API
  const loadBrokers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.BROKERS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setAvailableBrokers(response.data.data.map(b => b.companyName));
      }
    } catch (error) {
      console.error('Error loading brokers:', error);
      setAvailableBrokers([]);
    }
  };

  // Save loads to localStorage
  const saveLoadsToStorage = (loadsData) => {
    localStorage.setItem('tms_loads', JSON.stringify(loadsData));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('loadsUpdated'));
  };

  const loadDriversFromStorage = () => {
    const savedDrivers = localStorage.getItem('tms_drivers');
    if (savedDrivers) {
      const driversData = JSON.parse(savedDrivers);
      // Format drivers for dropdown: "FirstName LastName"
      const driverOptions = driversData.map(driver => ({
        id: driver.id,
        name: `${driver.firstName} ${driver.lastName}`,
        status: driver.status
      }));
      setAvailableDrivers(driverOptions);
    }
  };

  // Old localStorage-based functions removed - using API instead

  useEffect(() => {
    loadLoads();
    loadDriversFromStorage();
    loadCustomers();
    loadBrokers();
    
    // Listen for driver, customer, and load updates
    const handleDriversUpdate = () => {
      loadDriversFromStorage();
    };

    const handleCustomersUpdate = () => {
      loadCustomers();
    };

    const handleBrokersUpdate = () => {
      loadBrokers();
    };
    
    const handleLoadsUpdate = () => {
      loadLoads();
    };
    
    window.addEventListener('driversUpdated', handleDriversUpdate);
    window.addEventListener('customersUpdated', handleCustomersUpdate);
    window.addEventListener('brokersUpdated', handleBrokersUpdate);
    window.addEventListener('loadsUpdated', handleLoadsUpdate);
    
    return () => {
      window.removeEventListener('driversUpdated', handleDriversUpdate);
      window.removeEventListener('customersUpdated', handleCustomersUpdate);
      window.removeEventListener('brokersUpdated', handleBrokersUpdate);
      window.removeEventListener('loadsUpdated', handleLoadsUpdate);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = (status) => {
    const statusColors = {
      pending: { bgcolor: '#FEF3C7', color: '#D97706', label: 'Pending' },
      in_transit: { bgcolor: '#DBEAFE', color: '#2563EB', label: 'In Transit' },
      delivered: { bgcolor: '#D1FAE5', color: colors.success, label: 'Delivered' },
      delayed: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'Delayed' }
    };
    return statusColors[status] || statusColors.pending;
  };

  // Helper function to get MC number for customer or broker
  const getMCNumber = (entityName, entityType) => {
    if (!entityName) return '';

    if (entityType === 'customer') {
      const customer = availableCustomers.find(c => c.company === entityName);
      const mc = customer?.motorCarrier || '';
      return mc ? (mc.startsWith('MC-') ? mc : `MC-${mc}`) : '';
    } else if (entityType === 'broker') {
      const broker = availableBrokers.find(b => b.company === entityName);
      const mc = broker?.motorCarrier || '';
      return mc ? (mc.startsWith('MC-') ? mc : `MC-${mc}`) : '';
    }

    return '';
  };

  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Calculate driving mileage between two cities for trucking/transportation
  const calculateMileage = async (origin, destination) => {
    // First try our backend API for Google Maps integration (bypasses CORS)
    try {
      const response = await axios.post('/api/maps/distance', {
        origin,
        destination
      });

      if (response.data.success) {
        return response.data.distance;
      } else if (response.data.fallback) {
        // Fall through to static database
      }
    } catch (error) {
      // Fall through to static database
    }

    // Fallback to static driving distances database
    // Realistic driving distances between major US cities (truck-friendly routes)
    const drivingDistances = DRIVING_DISTANCES;

    if (!origin?.city || !destination?.city) {
      return 'N/A'; // Return N/A if cities are missing
    }

    const originKey = origin.city.toLowerCase();
    const destKey = destination.city.toLowerCase();

    // Create lookup key for both directions
    const key1 = `${originKey}-${destKey}`;
    const key2 = `${destKey}-${originKey}`;

    // Check for exact match in driving distances database
    if (drivingDistances[key1]) {
      return drivingDistances[key1];
    }
    if (drivingDistances[key2]) {
      return drivingDistances[key2];
    }

    // If no exact match found, estimate based on states and typical truck routes
    if (origin.province === destination.province) {
      // Same state - estimate based on state size
      const stateEstimates = {
        'CA': 400, 'TX': 450, 'FL': 350, 'NY': 300, 'PA': 250,
        'IL': 280, 'OH': 220, 'MI': 250, 'WI': 200, 'MN': 280,
        'WA': 250, 'OR': 200, 'CO': 280, 'AZ': 300, 'NV': 350
      };
      const stateSize = stateEstimates[origin.province] || 200;
      return Math.floor(Math.random() * (stateSize - 50) + 50);
    } else {
      // Different states - use regional estimates based on actual interstate routes
      const regionEstimates = {
        // West Coast to East Coast (I-80, I-40, I-10)
        'CA-NY': 2850, 'CA-FL': 2550, 'CA-MA': 3100, 'WA-FL': 3200,
        'OR-NY': 2900, 'NV-NY': 2650, 'AZ-NY': 2450, 'CA-PA': 2750,

        // North to South routes (I-35, I-75, I-95)
        'WA-TX': 1900, 'MN-TX': 1050, 'MI-FL': 1200, 'NY-FL': 1100,
        'IL-TX': 950, 'OH-FL': 1050, 'WI-TX': 1150, 'IN-FL': 950,

        // East Coast routes (I-95)
        'ME-FL': 1350, 'NH-FL': 1250, 'MA-FL': 1200, 'CT-FL': 1150,
        'NJ-FL': 1000, 'PA-FL': 950, 'MD-FL': 900,

        // Midwest to West (I-80, I-70)
        'IL-CA': 2050, 'OH-CA': 2300, 'MI-CA': 2250, 'IN-CA': 2100,
        'WI-CA': 2000, 'MN-CA': 1850, 'IA-CA': 1750, 'MO-CA': 1650,

        // Southern routes (I-10, I-20)
        'TX-CA': 1450, 'LA-CA': 1650, 'MS-CA': 1800, 'AL-CA': 1950,
        'GA-CA': 2100, 'FL-CA': 2550, 'TX-FL': 1100, 'LA-FL': 850
      };

      const key1 = `${origin.province}-${destination.province}`;
      const key2 = `${destination.province}-${origin.province}`;

      if (regionEstimates[key1]) return regionEstimates[key1];
      if (regionEstimates[key2]) return regionEstimates[key2];

      // Default interstate estimate based on general distance categories
      const distance = Math.sqrt(
        Math.pow(getStateDistance(origin.province, destination.province), 2)
      );
      return Math.round(distance * 1.4); // Apply 1.4 multiplier for road routing
    }
  };

  // Helper function to estimate distance category between states
  const getStateDistance = (state1, state2) => {
    const stateCoords = STATE_COORDS;

    const coord1 = stateCoords[state1];
    const coord2 = stateCoords[state2];

    if (!coord1 || !coord2) return 1000; // Default

    // Simple distance calculation for category estimation
    const latDiff = Math.abs(coord1.lat - coord2.lat);
    const lngDiff = Math.abs(coord1.lng - coord2.lng);

    return Math.sqrt(latDiff * latDiff * 69 * 69 + lngDiff * lngDiff * 54.6 * 54.6);
  };

  // Component to display mileage with async calculation
  const MileageDisplay = ({ origin, destination }) => {
    const [mileage, setMileage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchMileage = async () => {
        try {
          const distance = await calculateMileage(origin, destination);
          setMileage(distance);
        } catch (error) {
          console.error('Failed to calculate mileage:', error);
          // Fallback to simple estimate
          setMileage(Math.floor(Math.random() * 1500 + 500));
        } finally {
          setLoading(false);
        }
      };

      fetchMileage();
    }, [origin, destination]);

    if (loading) {
      return (
        <Typography variant="body2" sx={{
          fontWeight: 600,
          color: '#9CA3AF',
          fontSize: '0.8125rem',
          ...backgroundStyles.medium,
          px: 2,
          py: 0.5,
          borderRadius: 1
        }}>
          Loading...
        </Typography>
      );
    }

    return (
      <Typography variant="body2" sx={{
        fontWeight: 600,
        color: colors.primary,
        fontSize: '0.8125rem',
        bgcolor: colors.selectionLight,
        px: 2,
        py: 0.5,
        borderRadius: 1
      }}>
        {mileage ? mileage.toLocaleString() : '---'} mi
      </Typography>
    );
  };

  // Component to display RPM (Rate Per Mile) with async calculation
  const RPMDisplay = ({ rate, origin, destination }) => {
    const [mileage, setMileage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchMileage = async () => {
        try {
          const distance = await calculateMileage(origin, destination);
          setMileage(distance);
        } catch (error) {
          console.error('Failed to calculate mileage for RPM:', error);
          // Fallback to simple estimate
          setMileage(Math.floor(Math.random() * 1500 + 500));
        } finally {
          setLoading(false);
        }
      };

      fetchMileage();
    }, [origin, destination]);

    if (loading) {
      return (
        <Typography variant="body2" sx={{
          fontWeight: 600,
          color: '#9CA3AF',
          fontSize: '0.8125rem',
          ...backgroundStyles.medium,
          px: 2,
          py: 0.5,
          borderRadius: 1
        }}>
          Loading...
        </Typography>
      );
    }

    const rpm = rate && mileage && mileage > 0 ? rate / mileage : 0;

    return (
      <Typography variant="body2" sx={{
        fontWeight: 600,
        color: colors.success,
        fontSize: '0.8125rem',
        bgcolor: '#ECFDF5',
        px: 2,
        py: 0.5,
        borderRadius: 1
      }}>
        ${rpm ? rpm.toFixed(2) : '0.00'}
      </Typography>
    );
  };


  // Helper function to get start and end of current week (Monday to Sunday)
  const getCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days to Monday

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  };

  // Helper function to check if a date is in current week
  const isCurrentWeek = (dateString) => {
    const date = new Date(dateString);
    const { start, end } = getCurrentWeek();
    return date >= start && date <= end;
  };

  // Helper function to get day name
  const getDayName = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Helper function to group loads by day
  const groupLoadsByDay = (loads) => {
    const grouped = {};
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    loads.forEach(load => {
      // Use delivery date for grouping
      const dayName = getDayName(load.deliveryDate);
      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }
      grouped[dayName].push(load);
    });

    // Sort each day's loads by delivery time if available, otherwise by delivery date
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        if (a.deliveryTime && b.deliveryTime) {
          return a.deliveryTime.localeCompare(b.deliveryTime);
        }
        return new Date(a.deliveryDate) - new Date(b.deliveryDate);
      });
    });

    // Return in day order
    const orderedGrouped = {};
    dayOrder.forEach(day => {
      if (grouped[day]) {
        orderedGrouped[day] = grouped[day];
      }
    });

    return orderedGrouped;
  };

  const filteredLoads = loads.filter(load => {
    const matchesSearch = load.loadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || load.status === filterStatus;
    const matchesWeek = !showUpcoming || isCurrentWeek(load.deliveryDate);
    return matchesSearch && matchesFilter && matchesWeek;
  });

  const handleOpenDialog = (mode, load = null) => {
    setDialogMode(mode);
    setSelectedLoad(load);
    
    if (load && mode === 'edit') {
      setFormData({
        loadNumber: load.loadNumber,
        customer: load.customer,
        broker: load.broker || '',
        originCity: load.origin.city,
        originProvince: load.origin.province,
        originAddress: load.origin.address,
        destinationCity: load.destination.city,
        destinationProvince: load.destination.province,
        destinationAddress: load.destination.address,
        driver: load.driver,
        vehicle: load.vehicle,
        pickupDate: load.pickupDate ? new Date(load.pickupDate).toISOString().split('T')[0] : '',
        deliveryDate: load.deliveryDate ? new Date(load.deliveryDate).toISOString().split('T')[0] : '',
        pickupTime: load.pickupTime || '',
        deliveryTime: load.deliveryTime || '',
        rate: load.rate.toString(),
        weight: load.weight,
        commodity: load.commodity,
        notes: load.notes || '',
        status: load.status
      });
    } else {
      // Reset form for new load
      setFormData({
        loadNumber: `L-${new Date().getFullYear()}-${String(loads.length + 1).padStart(3, '0')}`,
        customer: '',
        broker: '',
        originCity: '',
        originProvince: '',
        originAddress: '',
        destinationCity: '',
        destinationProvince: '',
        destinationAddress: '',
        driver: '',
        vehicle: '',
        pickupDate: '',
        deliveryDate: '',
        pickupTime: '',
        deliveryTime: '',
        rate: '',
        weight: '',
        commodity: '',
        notes: '',
        status: 'pending'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLoad(null);
  };

  const handleSaveLoad = async () => {
    try {
      setLoading(true);

      // Check if customer is new and add to available customers
      if (formData.customer && formData.customer.trim()) {
        const customerExists = availableCustomers.some(customer =>
          customer.companyName?.toLowerCase() === formData.customer.toLowerCase()
        );

        if (!customerExists) {
          const newCustomer = {
            id: `C-${String(availableCustomers.length + 1).padStart(3, '0')}`,
            company: formData.customer.trim(),
            contactPerson: 'Contact Person',
            status: 'active'
          };

          const updatedCustomers = [...availableCustomers, newCustomer];
          setAvailableCustomers(updatedCustomers);

          // Save to localStorage
          localStorage.setItem('tms_customers', JSON.stringify(updatedCustomers));
        }
      }

      // Check if broker is new and add to available brokers
      if (formData.broker && formData.broker.trim()) {
        const brokerExists = availableBrokers.some(broker =>
          broker.companyName?.toLowerCase() === formData.broker.toLowerCase()
        );

        if (!brokerExists) {
          const newBroker = {
            id: `B-${String(availableBrokers.length + 1).padStart(3, '0')}`,
            company: formData.broker.trim(),
            contactPerson: 'Contact Person',
            status: 'active'
          };

          const updatedBrokers = [...availableBrokers, newBroker];
          setAvailableBrokers(updatedBrokers);

          // Save to localStorage
          localStorage.setItem('tms_brokers', JSON.stringify(updatedBrokers));
        }
      }

      // Allow creation with any fields - no validation required

      const loadData = {
        loadNumber: formData.loadNumber || '',
        customer: formData.customer || '',
        origin: {
          city: formData.originCity || '',
          province: formData.originProvince || '',
          address: formData.originAddress || `${formData.originCity || ''}, ${formData.originProvince || ''}`
        },
        destination: {
          city: formData.destinationCity || '',
          province: formData.destinationProvince || '',
          address: formData.destinationAddress || `${formData.destinationCity || ''}, ${formData.destinationProvince || ''}`
        },
        driver: formData.driver || '',
        vehicle: formData.vehicle || 'TRUCK-001',
        status: formData.status || 'pending',
        pickupDate: formData.pickupDate || new Date().toISOString(),
        deliveryDate: formData.deliveryDate || new Date().toISOString(),
        pickupTime: formData.pickupTime || '',
        deliveryTime: formData.deliveryTime || '',
        rate: parseFloat(formData.rate) || 0,
        weight: formData.weight || '',
        commodity: formData.commodity || '',
        notes: formData.notes || '',
        // Essential fields for frontend features
        id: dialogMode === 'add' ? `L-${new Date().getFullYear()}-${String(loads.length + 1).padStart(3, '0')}` : selectedLoad.id,
        createdAt: dialogMode === 'add' ? new Date().toISOString() : selectedLoad.createdAt,
        proofOfDelivery: dialogMode === 'edit' ? selectedLoad.proofOfDelivery || [] : [],
        rateConfirmation: dialogMode === 'edit' ? selectedLoad.rateConfirmation || [] : []
      };

      // Make API call to save the load
      const token = localStorage.getItem('token');
      let response;

      if (dialogMode === 'add') {
        response = await axios.post(API_ENDPOINTS.LOADS, loadData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'Load created successfully!', severity: 'success' });
      } else if (dialogMode === 'edit') {
        // Use the load's _id for update API call
        const loadId = selectedLoad._id || selectedLoad.id;
        response = await axios.put(`${API_ENDPOINTS.LOADS}/${loadId}`, loadData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'Load updated successfully!', severity: 'success' });
      }

      if (response.data.success) {
        // Reload loads from API to get fresh data
        await loadLoads();
      }
    } catch (error) {
      console.error('Error saving load:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to save load', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
    handleCloseDialog();
  };

  const handleDeleteLoad = async (loadId) => {
    const load = loads.find(l => (l.id || l._id) === loadId);
    const loadNumber = load ? load.loadNumber : 'Load';

    if (!window.confirm(`Are you sure you want to delete ${loadNumber}? This action cannot be undone.`)) {
      handleCloseMenu();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const deleteId = load._id || load.id;

      await axios.delete(`${API_ENDPOINTS.LOADS}/${deleteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      await loadLoads();
      setSnackbar({
        open: true,
        message: `${loadNumber} deleted successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting load:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setSnackbar({
        open: true,
        message: 'Failed to delete load',
        severity: 'error'
      });
    }
    handleCloseMenu();
  };

  // Inline editing handlers
  const handleCellClick = (loadId, field, currentValue, event) => {
    if (field === 'actions' || field === 'rateConfirmation' || field === 'proofOfDelivery') return;

    setEditingCell({ loadId, field });
    setEditingValue(currentValue || '');

    // For dropdown fields, show popper
    if (field === 'status' || field === 'driver' || field === 'customer') {
      setPopperAnchorEl(event.currentTarget);
      setPopperField(field);
    }
  };

  const handleCellSave = async () => {
    if (!editingCell.loadId || !editingCell.field) return;

    const load = loads.find(l => (l.id || l._id) === editingCell.loadId);
    if (!load) return;

    try {
      const token = localStorage.getItem('token');
      const loadId = load._id || load.id;
      const updatedLoad = { ...load };

      if (editingCell.field === 'pickupLocation') {
        const [city, province] = editingValue.split(', ');
        updatedLoad.origin = { ...updatedLoad.origin, city: city || '', province: province || '' };
      } else if (editingCell.field === 'deliveryLocation') {
        const [city, province] = editingValue.split(', ');
        updatedLoad.destination = { ...updatedLoad.destination, city: city || '', province: province || '' };
      } else if (editingCell.field === 'rate') {
        updatedLoad.rate = parseFloat(editingValue) || 0;
      } else {
        updatedLoad[editingCell.field] = editingValue;
      }

      await axios.put(`${API_ENDPOINTS.LOADS}/${loadId}`, updatedLoad, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      await loadLoads();
      handleCellCancel();

      setSnackbar({
        open: true,
        message: 'Load updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating load:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setSnackbar({
        open: true,
        message: 'Failed to update load',
        severity: 'error'
      });
    }
  };

  const handleCellCancel = () => {
    setEditingCell({ loadId: null, field: null });
    setEditingValue('');
    setPopperAnchorEl(null);
    setPopperField(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCellSave();
    } else if (event.key === 'Escape') {
      handleCellCancel();
    }
  };

  const renderEditableCell = (load, field, displayValue, cellProps = {}) => {
    const isEditing = editingCell.loadId === load.id && editingCell.field === field;

    if (isEditing && (field === 'status' || field === 'driver' || field === 'customer')) {
      return (
        <TableCell {...cellProps} sx={{ ...cellProps.sx, p: 0, position: 'relative' }}>
          <Box sx={{
            p: 2,
            border: borderStyles.primary,
            borderRadius: 1,
            bgcolor: colors.selectionLight,
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {displayValue}
          </Box>
        </TableCell>
      );
    }

    if (isEditing) {
      return (
        <TableCell {...cellProps} sx={{ ...cellProps.sx, p: 1 }}>
          <ClickAwayListener onClickAway={handleCellSave}>
            <TextField
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              fullWidth
              variant="outlined"
              size="small"
              multiline={field === 'notes'}
              rows={field === 'notes' ? 3 : 1}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: borderStyles.primary,
                  borderRadius: 1,
                  bgcolor: colors.selectionLight,
                  fontSize: '0.875rem',
                  '&:hover': {
                    borderColor: colors.primary
                  },
                  '&.Mui-focused': {
                    borderColor: colors.primary
                  }
                }
              }}
            />
          </ClickAwayListener>
        </TableCell>
      );
    }

    return (
      <TableCell
        {...cellProps}
        onClick={(e) => handleCellClick(load.id, field,
          field === 'pickupLocation' ? `${load.origin.city}, ${load.origin.province}` :
          field === 'deliveryLocation' ? `${load.destination.city}, ${load.destination.province}` :
          field === 'rate' ? load.rate.toString() :
          load[field], e)}
        sx={{
          ...cellProps.sx,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: '#F8FAFC',
            '& .edit-indicator': {
              opacity: 1
            }
          },
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {displayValue}
          <Box
            className="edit-indicator"
            sx={{
              opacity: 0,
              ml: 1,
              fontSize: '0.7rem',
              color: colors.textGray,
              transition: 'opacity 0.2s'
            }}
          >
            ✏️
          </Box>
        </Box>
      </TableCell>
    );
  };

  const getStatusChip = (status) => {
    const statusConfig = getStatusColor(status);
    return (
      <Chip
        label={statusConfig.label}
        size="small"
        sx={{
          bgcolor: statusConfig.bgcolor,
          color: statusConfig.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          border: 'none',
          '& .MuiChip-label': { px: 2 }
        }}
      />
    );
  };

  const handleMenuClick = (event, loadId) => {
    setAnchorEl(event.currentTarget);
    setMenuLoadId(loadId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuLoadId(null);
  };

  const handleFileUpload = (loadId, type) => {
    setCurrentUpload({ loadId, type });
    setUploadDialogOpen(true);
  };

  const handleViewPdf = (filename, type, loadNumber) => {
    // Use relative URL through proxy or direct backend URL
    const pdfUrl = `${API_ENDPOINTS.UPLOADS}/${filename}`;
    const title = `${type === 'proofOfDelivery' ? 'Proof of Delivery' : 'Rate Confirmation'} - ${loadNumber}`;
    setCurrentPdf({ url: pdfUrl, title });
    setPdfViewerOpen(true);
  };

  const handleClosePdfViewer = () => {
    setPdfViewerOpen(false);
    setCurrentPdf({ url: '', title: '' });
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setCurrentUpload({ loadId: null, type: null });
    setSelectedFile(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      setSnackbar({ 
        open: true, 
        message: 'Please select a PDF file only', 
        severity: 'error' 
      });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !currentUpload.loadId || !currentUpload.type) {
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', currentUpload.type);

      // Get auth token
      const token = localStorage.getItem('token');
      
      // Make actual API call to upload the file
      const response = await fetch(API_ENDPOINTS.LOAD_UPLOAD(currentUpload.loadId), {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const fileInfo = result.data.file;

      // Reload loads to get updated data from API
      await loadLoads();
      
      setSnackbar({ 
        open: true, 
        message: `${currentUpload.type === 'proofOfDelivery' ? 'Proof of Delivery' : 'Rate Confirmation'} uploaded successfully!`, 
        severity: 'success' 
      });
      
      handleCloseUploadDialog();
    } catch (error) {
      console.error('Error uploading file:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to upload file: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // New handlers for PDF management modal
  const handleOpenPdfManager = (loadId, type, loadNumber) => {
    setCurrentPdfManager({ loadId, type, loadNumber });
    setPdfManagerOpen(true);
  };

  const handleClosePdfManager = () => {
    setPdfManagerOpen(false);
    setCurrentPdfManager({ loadId: null, type: null, loadNumber: '' });
    setSelectedFile(null);
  };

  const handleDeletePdf = async (pdfId) => {
    try {
      setLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Make API call to delete the PDF
      const response = await fetch(
        API_ENDPOINTS.LOAD_DELETE_FILE(currentPdfManager.loadId, pdfId, currentPdfManager.type),
        { 
          method: 'DELETE',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      // Reload loads to get updated data from API
      await loadLoads();
      
      setSnackbar({ 
        open: true, 
        message: `PDF deleted successfully!`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error deleting PDF:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to delete PDF: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPdfFromManager = async () => {
    if (!selectedFile || !currentPdfManager.loadId || !currentPdfManager.type) {
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', currentPdfManager.type);

      // Get auth token
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Not authenticated - please log in with admin@absolutetms.com / demo123');
      }
      
      // Make API call to upload the file
      const response = await fetch(API_ENDPOINTS.LOAD_UPLOAD(currentPdfManager.loadId), {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const fileInfo = result.data.file;

      // Reload loads to get updated data from API
      await loadLoads();
      
      setSnackbar({ 
        open: true, 
        message: `${currentPdfManager.type === 'proofOfDelivery' ? 'Proof of Delivery' : 'Rate Confirmation'} uploaded successfully!`, 
        severity: 'success' 
      });
      
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to upload file: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const states = US_STATES;

  try {
    return (
      <Box sx={{ p: 4, bgcolor: '#F5F7FA', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Load Management
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textGray }}>
              Manage all your transportation loads and shipments
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('add')}
            sx={{
              ...buttonStyles.primary
            }}
          >
            New Load
          </Button>
        </Box>

        {/* Filters and Search */}
        <Card sx={cardStyles.bordered}>
          <CardContent sx={cardStyles.content}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search loads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: '#9CA3AF', mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      ...backgroundStyles.light
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{ ...backgroundStyles.light }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_transit">In Transit</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="delayed">Delayed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant={showUpcoming ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => setShowUpcoming(!showUpcoming)}
                  sx={{
                    height: '56px',
                    bgcolor: showUpcoming ? colors.success : 'transparent',
                    borderColor: showUpcoming ? colors.success : '#E5E7EB',
                    color: showUpcoming ? 'white' : '#374151',
                    '&:hover': {
                      bgcolor: showUpcoming ? colors.successDark : '#F3F4F6',
                      borderColor: showUpcoming ? colors.successDark : colors.borderLight,
                    }
                  }}
                >
                  {showUpcoming ? 'Show All Loads' : 'Upcoming This Week'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Loads Table - Airtable Style */}
      <Card sx={{
        border: '1px solid #E1E5E9',
        borderRadius: 2,
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        overflow: 'hidden'
      }}>
        <TableContainer sx={{ bgcolor: 'white' }}>
          <Table stickyHeader sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{
                '& th': {
                  bgcolor: '#FAFBFC',
                  borderBottom: '2px solid #E1E5E9',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: colors.darkTextGray,
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                  py: 2,
                  px: 3,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }
              }}>
                <TableCell sx={{ width: '80px' }}>Date</TableCell>
                <TableCell sx={{ width: '120px' }}>Load #</TableCell>
                <TableCell sx={{ width: '150px' }}>Customer/Broker</TableCell>
                <TableCell sx={{ width: '140px' }}>Driver</TableCell>
                <TableCell sx={{ width: '160px' }}>Pickup</TableCell>
                <TableCell sx={{ width: '160px' }}>Delivery</TableCell>
                <TableCell sx={{ width: '150px' }}>Notes</TableCell>
                <TableCell sx={{ width: '90px' }}>Rate</TableCell>
                <TableCell sx={{ width: '80px', textAlign: 'center' }}>Mileage</TableCell>
                <TableCell sx={{ width: '90px', textAlign: 'center' }}>RPM</TableCell>
                <TableCell sx={{ width: '80px' }}>RC</TableCell>
                <TableCell sx={{ width: '80px' }}>POD</TableCell>
                <TableCell sx={{ width: '100px' }}>Status</TableCell>
                <TableCell sx={{ width: '60px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!showUpcoming ? filteredLoads.map((load, index) => {
                const statusConfig = getStatusColor(load.status);
                return (
                  <TableRow
                    key={load.id}
                    sx={{
                      borderBottom: '1px solid #F1F3F4',
                      '&:hover': {
                        bgcolor: '#F8FAFC'
                      },
                      '&:nth-of-type(odd)': {
                        bgcolor: index % 2 === 0 ? 'white' : '#FAFBFC'
                      },
                      '& td': {
                        borderBottom: '1px solid #F1F3F4',
                        py: 2,
                        px: 3,
                        fontSize: '0.875rem',
                        verticalAlign: 'middle'
                      }
                    }}
                  >
                    {/* Date */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.darkTextGray, fontSize: '0.8125rem' }}>
                        {new Date(load.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    {/* Load # */}
                    {renderEditableCell(load, 'loadNumber',
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8125rem' }}>
                        {load.loadNumber}
                      </Typography>
                    )}
                    {/* Customer/Broker with MC */}
                    {renderEditableCell(load, 'customer',
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Display broker if available, otherwise customer */}
                        {load.broker ? (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                              {load.broker}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textGray, fontSize: '0.75rem' }}>
                              {getMCNumber(load.broker, 'broker')}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                              {load.customer}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textGray, fontSize: '0.75rem' }}>
                              {getMCNumber(load.customer, 'customer')}
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                    {/* Driver */}
                    {renderEditableCell(load, 'driver',
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500, color: colors.darkTextGray }}>
                        {capitalizeWords(load.driver)}
                      </Typography>
                    )}
                    {/* Pickup */}
                    {renderEditableCell(load, 'pickupLocation',
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                          {load.origin.city}, {load.origin.province}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.textGray, fontSize: '0.75rem' }}>
                          {new Date(load.pickupDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                          {load.pickupTime && <span style={{ marginLeft: '4px' }}>{load.pickupTime}</span>}
                        </Typography>
                      </Box>
                    )}
                    {/* Delivery */}
                    {renderEditableCell(load, 'deliveryLocation',
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                          {load.destination.city}, {load.destination.province}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.textGray, fontSize: '0.75rem' }}>
                          {new Date(load.deliveryDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                          {load.deliveryTime && <span style={{ marginLeft: '4px' }}>{load.deliveryTime}</span>}
                        </Typography>
                      </Box>
                    )}
                    {/* Notes */}
                    {renderEditableCell(load, 'notes',
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{
                          fontWeight: 400,
                          color: '#111827',
                          fontSize: '0.8125rem',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {load.notes || 'No notes'}
                        </Typography>
                      </Box>
                    )}
                    {/* Rate */}
                    {renderEditableCell(load, 'rate',
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.success }}>
                        ${load.rate?.toLocaleString() || '0'}
                      </Typography>
                    )}
                    {/* Mileage */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MileageDisplay origin={load.origin} destination={load.destination} />
                      </Box>
                    </TableCell>
                    {/* RPM (Rate Per Mile) */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RPMDisplay rate={load.rate} origin={load.origin} destination={load.destination} />
                      </Box>
                    </TableCell>
                    {/* RC (Rate Confirmation) */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {load.rateConfirmation && load.rateConfirmation.length > 0 ? (
                          <>
                            <Chip
                              icon={<PictureAsPdf />}
                              label={`${load.rateConfirmation.length} PDF${load.rateConfirmation.length > 1 ? 's' : ''}`}
                              size="small"
                              onClick={() => handleOpenPdfManager(load.id, 'rateConfirmation', load.loadNumber)}
                              sx={{
                                bgcolor: '#DBEAFE',
                                color: '#2563EB',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#BFDBFE' }
                              }}
                            />
                          </>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            sx={{
                              fontSize: '0.75rem',
                              py: 0.5,
                              px: 1,
                              borderColor: colors.borderLight,
                              color: colors.textGray
                            }}
                            onClick={() => handleOpenPdfManager(load.id, 'rateConfirmation', load.loadNumber)}
                          >
                            Upload
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                    {/* POD (Proof of Delivery) */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {load.proofOfDelivery && load.proofOfDelivery.length > 0 ? (
                          <>
                            <Chip
                              icon={<PictureAsPdf />}
                              label={`${load.proofOfDelivery.length} PDF${load.proofOfDelivery.length > 1 ? 's' : ''}`}
                              size="small"
                              onClick={() => handleOpenPdfManager(load.id, 'proofOfDelivery', load.loadNumber)}
                              sx={{
                                bgcolor: '#D1FAE5',
                                color: colors.success,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#A7F3D0' }
                              }}
                            />
                          </>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            sx={{
                              fontSize: '0.75rem',
                              py: 0.5,
                              px: 1,
                              borderColor: colors.borderLight,
                              color: colors.textGray
                            }}
                            onClick={() => handleOpenPdfManager(load.id, 'proofOfDelivery', load.loadNumber)}
                          >
                            Upload
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                    {/* Status */}
                    {renderEditableCell(load, 'status', getStatusChip(load.status))}
                    {/* Actions */}
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, load.id)}
                        sx={{
                          color: '#9CA3AF',
                          p: 0.5,
                          '&:hover': {
                            color: colors.textGray,
                            bgcolor: 'rgba(107, 114, 128, 0.1)'
                          }
                        }}
                      >
                        <MoreVert sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                // Grouped view for upcoming loads
                Object.entries(groupLoadsByDay(filteredLoads)).map(([dayName, dayLoads]) => [
                  // Day header row
                  <TableRow key={`header-${dayName}`}>
                    <TableCell colSpan={9} sx={{
                      bgcolor: '#F8FAFC',
                      borderTop: '2px solid #E5E7EB',
                      py: 2
                    }}>
                      <Typography variant="h6" sx={{
                        fontWeight: 600,
                        color: '#111827',
                        fontSize: '1rem'
                      }}>
                        {dayName} ({dayLoads.length} load{dayLoads.length !== 1 ? 's' : ''})
                      </Typography>
                    </TableCell>
                  </TableRow>,
                  // Loads for this day
                  ...dayLoads.map((load, index) => {
                    const statusConfig = getStatusColor(load.status);
                    return (
                      <TableRow
                        key={load.id}
                        sx={{
                          borderBottom: '1px solid #F1F3F4',
                          '&:hover': {
                            bgcolor: '#F8FAFC'
                          },
                          bgcolor: '#FEFEFF',
                          '& td': {
                            borderBottom: '1px solid #F1F3F4',
                            py: 2,
                            px: 3,
                            fontSize: '0.875rem',
                            verticalAlign: 'middle'
                          }
                        }}
                      >
                        {/* Date */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colors.darkTextGray, fontSize: '0.8125rem' }}>
                            {new Date(load.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                        {/* Load # */}
                        {renderEditableCell(load, 'loadNumber',
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8125rem' }}>
                            {load.loadNumber}
                          </Typography>
                        )}
                        {/* Customer/Broker */}
                        {renderEditableCell(load, 'customer',
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                              {load.customer}
                            </Typography>
                          </Box>
                        )}
                        {/* Pickup */}
                        {renderEditableCell(load, 'pickupLocation',
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                              {load.origin.city}, {load.origin.province}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textGray, fontSize: '0.75rem' }}>
                              {new Date(load.pickupDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                              {load.pickupTime && <span style={{ marginLeft: '4px' }}>{load.pickupTime}</span>}
                            </Typography>
                          </Box>
                        )}
                        {/* Delivery */}
                        {renderEditableCell(load, 'deliveryLocation',
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                              {load.destination.city}, {load.destination.province}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textGray, fontSize: '0.75rem' }}>
                              {new Date(load.deliveryDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                              {load.deliveryTime && <span style={{ marginLeft: '4px', fontWeight: 'bold', color: colors.success }}>{load.deliveryTime}</span>}
                            </Typography>
                          </Box>
                        )}
                        {/* Notes */}
                        {renderEditableCell(load, 'notes',
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{
                              fontWeight: 400,
                              color: '#111827',
                              fontSize: '0.8125rem',
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {load.notes || 'No notes'}
                            </Typography>
                          </Box>
                        )}
                        {/* Driver */}
                        {renderEditableCell(load, 'driver',
                          <Typography variant="body2" sx={{ color: colors.darkTextGray, fontSize: '0.8125rem' }}>
                            {load.driver}
                          </Typography>
                        )}
                        {/* Rate */}
                        {renderEditableCell(load, 'rate',
                          <Typography variant="body2" sx={{ fontWeight: 500, color: colors.success, fontSize: '0.8125rem' }}>
                            ${load.rate ? load.rate.toLocaleString() : '0'}
                          </Typography>
                        )}
                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            sx={{
                              bgcolor: statusConfig.color,
                              color: 'white',
                              fontSize: '0.75rem',
                              height: '24px',
                              minWidth: '70px'
                            }}
                          />
                        </TableCell>
                        {/* Actions */}
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, load.id)}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ]).flat()
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredLoads.length === 0 && (
          <Box sx={{ p: 8, textAlign: 'center', bgcolor: '#FAFBFC' }}>
            <LocalShipping sx={{ fontSize: 56, color: colors.borderLight, mb: 2 }} />
            <Typography variant="h6" sx={{ color: colors.textGray, mb: 1, fontSize: '1.125rem' }}>
              No loads found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first load'
              }
            </Typography>
          </Box>
        )}
      </Card>

      {/* Dropdown Popper for Inline Editing */}
      <Popper
        open={Boolean(popperAnchorEl)}
        anchorEl={popperAnchorEl}
        placement="bottom-start"
        sx={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleCellCancel}>
          <Paper sx={{
            border: borderStyles.primary,
            borderRadius: 1,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
            minWidth: 200,
            maxHeight: 300,
            overflow: 'auto'
          }}>
            {popperField === 'status' && (
              <Box>
                {['pending', 'in_transit', 'delivered', 'delayed'].map((status) => {
                  const statusConfig = getStatusColor(status);
                  return (
                    <Box
                      key={status}
                      onClick={() => {
                        setEditingValue(status);
                        setTimeout(handleCellSave, 100);
                      }}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#F8FAFC' },
                        borderBottom: '1px solid #F1F3F4'
                      }}
                    >
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
                    </Box>
                  );
                })}
              </Box>
            )}

            {popperField === 'driver' && (
              <Box>
                {availableDrivers.map((driver) => (
                  <Box
                    key={driver.id}
                    onClick={() => {
                      setEditingValue(driver.name);
                      setTimeout(handleCellSave, 100);
                    }}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#F8FAFC' },
                      borderBottom: '1px solid #F1F3F4',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: colors.darkTextGray,
                        mr: 2
                      }}
                    >
                      {capitalizeWords(driver.name)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {popperField === 'customer' && (
              <Box>
                {availableCustomers.map((customer) => (
                  <Box
                    key={customer.id}
                    onClick={() => {
                      setEditingValue(customer.company);
                      setTimeout(handleCellSave, 100);
                    }}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#F8FAFC' },
                      borderBottom: '1px solid #F1F3F4'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {customer.company}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.textGray }}>
                      {customer.contactPerson}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          const load = loads.find(l => l.id === menuLoadId);
          handleOpenDialog('view', load);
          handleCloseMenu();
        }}>
          <LocalShipping sx={{ mr: 2, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const load = loads.find(l => l.id === menuLoadId);
          handleOpenDialog('edit', load);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 2, fontSize: 20 }} />
          Edit Load
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteLoad(menuLoadId)}
          sx={{ color: '#DC2626' }}
        >
          <Delete sx={{ mr: 2, fontSize: 20 }} />
          Delete Load
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          borderBottom: borderStyles.light,
          ...backgroundStyles.primaryGradient,
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalShipping sx={{ mr: 2, fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {dialogMode === 'add' ? 'Create New Load' : 
                   dialogMode === 'edit' ? 'Edit Load' : 'Load Details'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {dialogMode === 'add' ? 'Add a new transportation load to the system' :
                   dialogMode === 'edit' ? 'Update load information and details' : 'View comprehensive load information'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 4 }}>
            {/* Basic Information Section */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={0.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1, 
                    bgcolor: colors.selectionLight, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <Receipt sx={{ color: colors.primary, fontSize: 14 }} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={5.75}>
                  <TextField
                    fullWidth
                    label="Load Number"
                    value={formData.loadNumber}
                    onChange={(e) => setFormData({ ...formData, loadNumber: e.target.value })}
                    disabled={dialogMode === 'view'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.primary
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5.75}>
                  <Autocomplete
                    fullWidth
                    freeSolo
                    options={availableCustomers}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return option?.company || '';
                    }}
                    value={formData.customer || ''}
                    onChange={(event, newValue) => {
                      const customerName = typeof newValue === 'string' ? newValue : (newValue?.company || '');
                      setFormData({ ...formData, customer: customerName });
                    }}
                    inputValue={formData.customer || ''}
                    onInputChange={(event, newInputValue) => {
                      setFormData({ ...formData, customer: newInputValue || '' });
                    }}
                    disabled={dialogMode === 'view'}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer Name"
                        placeholder="Type or select a customer..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                            height: '56px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.primary
                            }
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id}>
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {option.company}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.textGray }}>
                            Contact: {option.contactPerson}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} md={5.75}>
                  <Autocomplete
                    fullWidth
                    freeSolo
                    options={availableBrokers}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return option?.company || '';
                    }}
                    value={formData.broker || ''}
                    onChange={(event, newValue) => {
                      const brokerName = typeof newValue === 'string' ? newValue : (newValue?.company || '');
                      setFormData({ ...formData, broker: brokerName });
                    }}
                    inputValue={formData.broker || ''}
                    onInputChange={(event, newInputValue) => {
                      setFormData({ ...formData, broker: newInputValue || '' });
                    }}
                    disabled={dialogMode === 'view'}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Broker (Optional)"
                        placeholder="Type or select a broker..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                            height: '56px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.primary
                            }
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id}>
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {option.company}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.textGray }}>
                            Contact: {option.contactPerson}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Schedule Section */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={0.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1, 
                    bgcolor: '#DBEAFE', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <Schedule sx={{ color: '#2563EB', fontSize: 14 }} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Pickup Date"
                    type="date"
                    value={formData.pickupDate}
                    onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                    disabled={dialogMode === 'view'}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2563EB'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={1.75}>
                  <TextField
                    fullWidth
                    label="Pickup Time"
                    type="time"
                    value={formData.pickupTime || ''}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    disabled={dialogMode === 'view'}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2563EB'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Delivery Date"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    disabled={dialogMode === 'view'}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2563EB'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={1.75}>
                  <TextField
                    fullWidth
                    label="Delivery Time"
                    type="time"
                    value={formData.deliveryTime || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                    disabled={dialogMode === 'view'}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2563EB'
                        }
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Origin Section */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={0.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1, 
                    bgcolor: colors.successLight, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <LocationOn sx={{ color: colors.success, fontSize: 14 }} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={5.75}>
                  <TextField
                    fullWidth
                    label="Pickup City"
                    value={formData.originCity}
                    onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
                    disabled={dialogMode === 'view'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.success
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5.75}>
                  <Autocomplete
                    fullWidth
                    options={states}
                    getOptionLabel={(option) => option ? `${option.code} - ${option.name}` : ''}
                    value={states.find(state => state.code === formData.originProvince) || null}
                    onChange={(event, newValue) => {
                      setFormData({ ...formData, originProvince: newValue ? newValue.code : '' });
                    }}
                    disabled={dialogMode === 'view'}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="State"
                        placeholder="State"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                            height: '56px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.success
                            }
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ minHeight: 48, fontSize: '1rem' }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {option.code}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.textGray }}>
                            {option.name}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Destination Section */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={0.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1, 
                    bgcolor: '#FEF3C7', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <LocationOn sx={{ color: '#D97706', fontSize: 14 }} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={5.75}>
                  <TextField
                    fullWidth
                    label="Delivery City"
                    value={formData.destinationCity}
                    onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                    disabled={dialogMode === 'view'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D97706'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5.75}>
                  <Autocomplete
                    fullWidth
                    options={states}
                    getOptionLabel={(option) => option ? `${option.code} - ${option.name}` : ''}
                    value={states.find(state => state.code === formData.destinationProvince) || null}
                    onChange={(event, newValue) => {
                      setFormData({ ...formData, destinationProvince: newValue ? newValue.code : '' });
                    }}
                    disabled={dialogMode === 'view'}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="State"
                        placeholder="State"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                            height: '56px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#D97706'
                            }
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ minHeight: 48, fontSize: '1rem' }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {option.code}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.textGray }}>
                            {option.name}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Load Details Section */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={0.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1, 
                    bgcolor: '#DBEAFE', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <DirectionsCar sx={{ color: '#2563EB', fontSize: 14 }} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    fullWidth
                    options={availableDrivers}
                    getOptionLabel={(option) => option ? option.name : ''}
                    value={availableDrivers.find(driver => driver.name === formData.driver) || null}
                    onChange={(event, newValue) => {
                      setFormData({ ...formData, driver: newValue ? newValue.name : '' });
                    }}
                    disabled={dialogMode === 'view'}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Driver"
                        placeholder="Driver"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                            height: '56px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#2563EB'
                            }
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ minHeight: 56, fontSize: '1rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: colors.darkTextGray,
                              mr: 2
                            }}
                          >
                            {capitalizeWords(option.name)}
                          </Typography>
                          {option.status && (
                            <Chip
                              size="small"
                              label={option.status}
                              sx={{
                                ml: 1,
                                bgcolor: option.status === 'active' || option.status === 'available' ? '#D1FAE5' : '#FEE2E2',
                                color: option.status === 'active' || option.status === 'available' ? colors.success : '#DC2626',
                                fontSize: '0.75rem',
                                height: '24px'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                    noOptionsText="No drivers found"
                  />
                </Grid>
                <Grid item xs={12} md={2.75}>
                  <TextField
                    fullWidth
                    label="Load Rate"
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ color: colors.textGray, mr: 0.5, fontSize: 18 }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10B981'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4.75}>
                  <FormControl fullWidth>
                    <InputLabel>Load Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={dialogMode === 'view'}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            width: 'auto',
                            minWidth: '250px'
                          }
                        }
                      }}
                      sx={{
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10B981'
                        }
                      }}
                    >
                      <MenuItem value="pending" sx={{ minHeight: 50, fontSize: '1rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Schedule sx={{ mr: 2, fontSize: 18, color: '#D97706' }} />
                          Pending
                        </Box>
                      </MenuItem>
                      <MenuItem value="in_transit" sx={{ minHeight: 50, fontSize: '1rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Timeline sx={{ mr: 2, fontSize: 18, color: '#2563EB' }} />
                          In Transit
                        </Box>
                      </MenuItem>
                      <MenuItem value="delivered" sx={{ minHeight: 50, fontSize: '1rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircle sx={{ mr: 2, fontSize: 18, color: colors.success }} />
                          Delivered
                        </Box>
                      </MenuItem>
                      <MenuItem value="delayed" sx={{ minHeight: 50, fontSize: '1rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Warning sx={{ mr: 2, fontSize: 18, color: '#DC2626' }} />
                          Delayed
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Notes Section */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    placeholder="Add any additional notes or comments for this load..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={dialogMode === 'view'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        ...backgroundStyles.conditional(dialogMode === 'view', colors.lightGray, colors.white),
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10B981'
                        }
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        {dialogMode !== 'view' && (
          <DialogActions sx={{ 
            p: 4, 
            borderTop: borderStyles.light,
            ...backgroundStyles.light,
            display: 'flex',
            gap: 2
          }}>
            <Button 
              onClick={handleCloseDialog} 
              variant="outlined"
              sx={{ 
                color: colors.textGray,
                borderColor: colors.borderLight,
                '&:hover': { 
                  borderColor: '#9CA3AF',
                  ...backgroundStyles.medium
                },
                px: 3,
                py: 1
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveLoad}
              startIcon={dialogMode === 'add' ? <Add /> : <Edit />}
              sx={{
                ...buttonStyles.primary,
                px: 4,
                py: 1,
                boxShadow: '0 4px 6px -1px rgb(79 70 229 / 0.3)'
              }}
            >
              {dialogMode === 'add' ? 'Create Load' : 'Save Changes'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={handleCloseUploadDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          borderBottom: borderStyles.light,
          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PictureAsPdf sx={{ mr: 2, fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Upload {currentUpload.type === 'proofOfDelivery' ? 'Proof of Delivery' : 'Rate Confirmation'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Select a PDF file to attach to this load
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseUploadDialog} size="small" sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                sx={{
                  height: 120,
                  width: '100%',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  ...backgroundStyles.selectedFileWithBorder(selectedFile),
                  flexDirection: 'column',
                  gap: 1,
                  '&:hover': {
                    borderColor: colors.success,
                    bgcolor: colors.successLight
                  }
                }}
              >
                <CloudUpload sx={{ fontSize: 40 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedFile ? selectedFile.name : 'Choose PDF File'}
                </Typography>
                <Typography variant="caption">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Click to browse or drag and drop'}
                </Typography>
              </Button>
            </label>
            
            {selectedFile && (
              <Box sx={{ mt: 3, p: 2, bgcolor: colors.successLight, borderRadius: 2, border: '1px solid #D1FAE5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <PictureAsPdf sx={{ color: colors.success, fontSize: 24 }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: colors.success }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.textGray }}>
                      Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 4, 
          borderTop: borderStyles.light,
          ...backgroundStyles.light,
          display: 'flex',
          gap: 2
        }}>
          <Button 
            onClick={handleCloseUploadDialog} 
            variant="outlined"
            sx={{ 
              color: colors.textGray,
              borderColor: colors.borderLight,
              '&:hover': { 
                borderColor: '#9CA3AF',
                ...backgroundStyles.medium
              },
              px: 3,
              py: 1
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadFile}
            disabled={!selectedFile || loading}
            startIcon={<CloudUpload />}
            sx={{ 
              bgcolor: colors.success, 
              '&:hover': { bgcolor: colors.successDark },
              '&:disabled': { bgcolor: colors.borderLight },
              px: 4,
              py: 1,
              boxShadow: '0 4px 6px -1px rgb(5 150 105 / 0.3)'
            }}
          >
            {loading ? 'Uploading...' : 'Upload PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Viewer Modal */}
      <Dialog 
        open={pdfViewerOpen} 
        onClose={handleClosePdfViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            maxHeight: '90vh',
            height: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          borderBottom: borderStyles.light,
          background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PictureAsPdf sx={{ mr: 2, fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {currentPdf.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  PDF Document Viewer
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClosePdfViewer} size="small" sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {currentPdf.url && (
            <Box sx={{ 
              width: '100%', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* PDF Embed */}
              <iframe
                src={currentPdf.url}
                width="100%"
                height="100%"
                style={{
                  border: 'none',
                  minHeight: '600px',
                  flex: 1
                }}
                title={currentPdf.title}
                type="application/pdf"
                frameBorder="0"
                scrolling="auto"
              />
              
              {/* Fallback if iframe doesn't work */}
              <Box sx={{ 
                p: 3, 
                textAlign: 'center',
                borderTop: borderStyles.light,
                ...backgroundStyles.light
              }}>
                <Typography variant="body2" sx={{ color: colors.textGray, mb: 2 }}>
                  Can't view the PDF? Try opening it directly:
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={() => window.open(currentPdf.url, '_blank')}
                  sx={{
                    borderColor: '#DC2626',
                    color: '#DC2626',
                    '&:hover': {
                      borderColor: '#B91C1C',
                      bgcolor: '#FEF2F2'
                    }
                  }}
                >
                  Open in New Tab
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          borderTop: borderStyles.light,
          ...backgroundStyles.light,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = currentPdf.url;
              link.download = currentPdf.title.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            sx={{
              borderColor: colors.success,
              color: colors.success,
              '&:hover': {
                borderColor: colors.successDark,
                bgcolor: colors.successLight
              }
            }}
          >
            Download PDF
          </Button>
          <Button
            onClick={handleClosePdfViewer}
            variant="contained"
            sx={{
              ...buttonStyles.secondary
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Management Modal */}
      <Dialog 
        open={pdfManagerOpen} 
        onClose={handleClosePdfManager}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          borderBottom: borderStyles.light,
          ...backgroundStyles.primaryGradient,
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PictureAsPdf sx={{ mr: 2, fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {currentPdfManager.type === 'proofOfDelivery' ? 'Proof of Delivery' : 'Rate Confirmation'} Files
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Manage PDFs for {currentPdfManager.loadNumber}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClosePdfManager} size="small" sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {/* Current PDFs List */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#111827', fontWeight: 600 }}>
              Current Files ({loads.find(l => l.id === currentPdfManager.loadId)?.[currentPdfManager.type]?.length || 0})
            </Typography>
            
            {loads.find(l => l.id === currentPdfManager.loadId)?.[currentPdfManager.type]?.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loads.find(l => l.id === currentPdfManager.loadId)?.[currentPdfManager.type]?.map((pdf) => (
                  <Card key={pdf._id} sx={{ border: borderStyles.light }}>
                    <CardContent sx={cardStyles.content}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <PictureAsPdf sx={{ color: colors.primary, fontSize: 24 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                              {pdf.filename}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textGray }}>
                              Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()} • 
                              Size: {(pdf.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PictureAsPdf />}
                            onClick={() => handleViewPdf(pdf.filename, currentPdfManager.type, currentPdfManager.loadNumber)}
                            sx={{
                              borderColor: colors.primary,
                              color: colors.primary,
                              '&:hover': {
                                borderColor: colors.primaryHover,
                                bgcolor: colors.selectionLight
                              }
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Delete />}
                            onClick={() => handleDeletePdf(pdf._id)}
                            disabled={loading}
                            sx={{
                              borderColor: '#DC2626',
                              color: '#DC2626',
                              '&:hover': {
                                borderColor: '#B91C1C',
                                bgcolor: '#FEF2F2'
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                ...backgroundStyles.light,
                borderRadius: 2,
                border: '2px dashed #D1D5DB'
              }}>
                <PictureAsPdf sx={{ fontSize: 48, color: colors.borderLight, mb: 2 }} />
                <Typography variant="body1" sx={{ color: colors.textGray, mb: 1 }}>
                  No {currentPdfManager.type === 'proofOfDelivery' ? 'proof of delivery' : 'rate confirmation'} files yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  Upload your first PDF using the section below
                </Typography>
              </Box>
            )}
          </Box>

          {/* Upload New PDF Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#111827', fontWeight: 600 }}>
              Upload New PDF
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="pdf-manager-file-input"
              />
              <label htmlFor="pdf-manager-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  sx={{
                    height: 120,
                    width: '100%',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    ...backgroundStyles.selectedFileWithPrimaryBorder(selectedFile),
                    flexDirection: 'column',
                    gap: 1,
                    '&:hover': {
                      borderColor: colors.primary,
                      bgcolor: colors.selectionLight
                    }
                  }}
                >
                  <CloudUpload sx={{ fontSize: 40 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : 'Choose PDF File'}
                  </Typography>
                  <Typography variant="caption">
                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Click to browse or drag and drop'}
                  </Typography>
                </Button>
              </label>
              
              {selectedFile && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleUploadPdfFromManager}
                    disabled={loading}
                    startIcon={<CloudUpload />}
                    sx={{
                      ...buttonStyles.primary
                    }}
                  >
                    {loading ? 'Uploading...' : 'Upload PDF'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedFile(null)}
                    sx={{
                      borderColor: '#6B7280',
                      color: colors.textGray
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={dialogStyles.actions}>
          <Button
            onClick={handleClosePdfManager}
            variant="contained"
            sx={{
              ...buttonStyles.secondary
            }}
          >
            Close
          </Button>
        </DialogActions>
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
  } catch (error) {
    console.error('🚨 LoadManagement render error:', error);
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" color="error">
          Load Management Error
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          There was an error loading the Load Management page: {error.message}
        </Typography>
      </Box>
    );
  }
};

export default LoadManagement;