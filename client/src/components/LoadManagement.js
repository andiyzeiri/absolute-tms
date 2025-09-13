import React, { useState, useEffect } from 'react';
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
  Autocomplete
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

const LoadManagement = () => {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  // Demo data - in real app this would come from API
  const demoLoads = [
    {
      id: 'L-2024-001',
      loadNumber: 'L-2024-001',
      customer: 'ABC Logistics Inc.',
      origin: { city: 'Toronto', province: 'ON', address: '123 King St, Toronto, ON' },
      destination: { city: 'Vancouver', province: 'BC', address: '456 Main St, Vancouver, BC' },
      driver: 'John Stevens',
      vehicle: 'Truck-001',
      status: 'in_transit',
      pickupDate: '2024-01-15T10:00:00Z',
      deliveryDate: '2024-01-18T14:00:00Z',
      rate: 4250,
      weight: '12,500 lbs',
      commodity: 'Electronics',
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
      customer: 'Global Freight Solutions',
      origin: { city: 'Montreal', province: 'QC', address: '789 Rue Saint-Jacques, Montreal, QC' },
      destination: { city: 'Calgary', province: 'AB', address: '321 Centre St, Calgary, AB' },
      driver: 'Sarah Miller',
      vehicle: 'Truck-002',
      status: 'pending',
      pickupDate: '2024-01-20T08:00:00Z',
      deliveryDate: '2024-01-23T16:00:00Z',
      rate: 3890,
      weight: '8,750 lbs',
      commodity: 'Automotive Parts',
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
      customer: 'Maritime Transport Co.',
      origin: { city: 'Halifax', province: 'NS', address: '555 Barrington St, Halifax, NS' },
      destination: { city: 'Winnipeg', province: 'MB', address: '777 Portage Ave, Winnipeg, MB' },
      driver: 'Mike Johnson',
      vehicle: 'Truck-003',
      status: 'delivered',
      pickupDate: '2024-01-12T07:00:00Z',
      deliveryDate: '2024-01-15T15:00:00Z',
      rate: 5120,
      weight: '15,200 lbs',
      commodity: 'Food Products',
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
      origin: { city: 'Edmonton', province: 'AB', address: '101 Jasper Ave, Edmonton, AB' },
      destination: { city: 'Ottawa', province: 'ON', address: '202 Rideau St, Ottawa, ON' },
      driver: 'Lisa Chang',
      vehicle: 'Truck-004',
      status: 'delayed',
      pickupDate: '2024-01-16T09:00:00Z',
      deliveryDate: '2024-01-19T17:00:00Z',
      rate: 4750,
      weight: '11,800 lbs',
      commodity: 'Industrial Equipment',
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
    rate: '',
    weight: '',
    commodity: '',
    status: 'pending'
  });

  // Load loads from localStorage
  const loadLoadsFromStorage = () => {
    const savedLoads = localStorage.getItem('tms_loads');
    if (savedLoads) {
      setLoads(JSON.parse(savedLoads));
    } else {
      // Initialize with demo data if no saved loads exist
      setLoads(demoLoads.slice(0, 3));
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

  const loadCustomersFromStorage = () => {
    const savedCustomers = localStorage.getItem('tms_customers');
    if (savedCustomers) {
      const customersData = JSON.parse(savedCustomers);
      // Format customers for dropdown: company names
      const customerOptions = customersData.map(customer => ({
        id: customer.id,
        company: customer.company,
        contactPerson: customer.contactPerson,
        status: customer.status
      }));
      setAvailableCustomers(customerOptions);
    } else {
      // Initialize with demo customers if none exist
      const demoCustomers = [
        { id: 'C-001', company: 'Walmart Canada Corp', contactPerson: 'Robert Johnson', status: 'active' },
        { id: 'C-002', company: 'Canadian Tire Corporation', contactPerson: 'Michelle Davis', status: 'active' },
        { id: 'C-003', company: 'Shoppers Drug Mart', contactPerson: 'David Chen', status: 'active' },
        { id: 'C-004', company: 'Metro Inc.', contactPerson: 'Sarah Thompson', status: 'active' },
        { id: 'C-005', company: 'Home Depot Canada', contactPerson: 'Mark Wilson', status: 'pending' }
      ];
      setAvailableCustomers(demoCustomers);
    }
  };

  const loadBrokersFromStorage = () => {
    const savedBrokers = localStorage.getItem('tms_brokers');
    if (savedBrokers) {
      const brokersData = JSON.parse(savedBrokers);
      // Format brokers for dropdown: company names
      const brokerOptions = brokersData.map(broker => ({
        id: broker.id,
        company: broker.company,
        contactPerson: broker.contactPerson,
        status: broker.status
      }));
      setAvailableBrokers(brokerOptions);
    } else {
      // Initialize with demo brokers if none exist
      const demoBrokers = [
        { id: 'B-001', company: 'Global Freight Brokers', contactPerson: 'Michael Thompson', status: 'active' },
        { id: 'B-002', company: 'Prime Logistics Solutions', contactPerson: 'Sarah Chen', status: 'active' },
        { id: 'B-003', company: 'Atlantic Freight Partners', contactPerson: 'David Murphy', status: 'active' },
        { id: 'B-004', company: 'Prairie Express Brokers', contactPerson: 'Jennifer Wilson', status: 'active' },
        { id: 'B-005', company: 'Northern Transport Hub', contactPerson: 'Robert Lee', status: 'pending' }
      ];
      setAvailableBrokers(demoBrokers);
    }
  };

  useEffect(() => {
    loadLoadsFromStorage();
    loadDriversFromStorage();
    loadCustomersFromStorage();
    loadBrokersFromStorage();
    
    // Listen for driver, customer, and load updates
    const handleDriversUpdate = () => {
      loadDriversFromStorage();
    };

    const handleCustomersUpdate = () => {
      loadCustomersFromStorage();
    };

    const handleBrokersUpdate = () => {
      loadBrokersFromStorage();
    };
    
    const handleLoadsUpdate = () => {
      loadLoadsFromStorage();
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
      delivered: { bgcolor: '#D1FAE5', color: '#059669', label: 'Delivered' },
      delayed: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'Delayed' }
    };
    return statusColors[status] || statusColors.pending;
  };

  const filteredLoads = loads.filter(load => {
    const matchesSearch = load.loadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || load.status === filterStatus;
    return matchesSearch && matchesFilter;
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
        rate: load.rate.toString(),
        weight: load.weight,
        commodity: load.commodity,
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
        rate: '',
        weight: '',
        commodity: '',
        status: 'pending'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLoad(null);
  };

  const handleSaveLoad = () => {
    try {
      setLoading(true);
      
      const loadData = {
        id: dialogMode === 'add' ? `L-${new Date().getFullYear()}-${String(loads.length + 1).padStart(3, '0')}` : selectedLoad.id,
        loadNumber: formData.loadNumber,
        customer: formData.customer,
        broker: formData.broker,
        origin: {
          city: formData.originCity,
          province: formData.originProvince,
          address: `${formData.originCity}, ${formData.originProvince}`
        },
        destination: {
          city: formData.destinationCity,
          province: formData.destinationProvince,
          address: `${formData.destinationCity}, ${formData.destinationProvince}`
        },
        driver: formData.driver,
        vehicle: formData.vehicle || 'TRUCK-001',
        status: formData.status,
        pickupDate: formData.pickupDate ? new Date(formData.pickupDate).toISOString() : new Date().toISOString(),
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : new Date().toISOString(),
        rate: parseFloat(formData.rate) || 0,
        weight: formData.weight || '10,000 lbs',
        commodity: formData.commodity || 'General Freight',
        createdAt: dialogMode === 'add' ? new Date().toISOString() : selectedLoad.createdAt
      };
      
      let updatedLoads;
      if (dialogMode === 'add') {
        updatedLoads = [...loads, loadData];
        setSnackbar({ open: true, message: 'Load created successfully!', severity: 'success' });
      } else if (dialogMode === 'edit') {
        updatedLoads = loads.map(load => 
          load.id === selectedLoad.id ? loadData : load
        );
        setSnackbar({ open: true, message: 'Load updated successfully!', severity: 'success' });
      }
      
      setLoads(updatedLoads);
      saveLoadsToStorage(updatedLoads);
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

  const handleDeleteLoad = (loadId) => {
    const load = loads.find(l => l.id === loadId);
    const loadNumber = load ? load.loadNumber : 'Load';
    
    if (!window.confirm(`Are you sure you want to delete ${loadNumber}? This action cannot be undone.`)) {
      handleCloseMenu();
      return;
    }

    try {
      const updatedLoads = loads.filter(load => load.id !== loadId);
      setLoads(updatedLoads);
      saveLoadsToStorage(updatedLoads);
      setSnackbar({ 
        open: true, 
        message: `${loadNumber} deleted successfully!`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error deleting load:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to delete load', 
        severity: 'error' 
      });
    }
    handleCloseMenu();
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

      // Update the load with file info in localStorage (since we're using localStorage for demo)
      const updatedLoads = loads.map(load => {
        if (load.id === currentUpload.loadId) {
          return {
            ...load,
            [currentUpload.type]: fileInfo
          };
        }
        return load;
      });
      
      setLoads(updatedLoads);
      saveLoadsToStorage(updatedLoads);
      
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

      // Update local storage for demo mode
      const updatedLoads = loads.map(load => {
        if (load.id === currentPdfManager.loadId) {
          return {
            ...load,
            [currentPdfManager.type]: load[currentPdfManager.type].filter(pdf => pdf._id !== pdfId)
          };
        }
        return load;
      });
      
      setLoads(updatedLoads);
      saveLoadsToStorage(updatedLoads);
      
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
      console.log('Upload token:', token ? 'exists' : 'missing');
      console.log('Upload URL:', API_ENDPOINTS.LOAD_UPLOAD(currentPdfManager.loadId));
      
      if (!token) {
        throw new Error('Not authenticated - please log in with admin@absolutetms.com / demo123');
      }
      
      // Check if we're in demo mode
      const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true' || 
                         process.env.REACT_APP_API_URL === 'https://demo-mode-disabled' ||
                         token.startsWith('demo_');
      
      if (isDemoMode) {
        console.log('Demo mode: Simulating PDF upload');
        
        // Simulate successful upload in demo mode
        const fileInfo = {
          filename: selectedFile.name,
          path: `/uploads/demo-${Date.now()}-${selectedFile.name}`,
          uploadedAt: new Date().toISOString(),
          size: selectedFile.size,
          _id: 'demo_' + Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the load with file info in localStorage
        const updatedLoads = loads.map(load => {
          if (load.id === currentPdfManager.loadId) {
            return {
              ...load,
              [currentPdfManager.type]: [...(load[currentPdfManager.type] || []), fileInfo]
            };
          }
          return load;
        });
        
        setLoads(updatedLoads);
        saveLoadsToStorage(updatedLoads);
        
        setSnackbar({ 
          open: true, 
          message: `${currentPdfManager.type === 'proofOfDelivery' ? 'Proof of Delivery' : 'Rate Confirmation'} uploaded successfully! (Demo Mode)`, 
          severity: 'success' 
        });
        
        setSelectedFile(null);
        return;
      }
      
      // Make actual API call to upload the file (when not in demo mode)
      const response = await fetch(API_ENDPOINTS.LOAD_UPLOAD(currentPdfManager.loadId), {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      const fileInfo = result.data.file;

      // Update the load with file info in localStorage
      const updatedLoads = loads.map(load => {
        if (load.id === currentPdfManager.loadId) {
          return {
            ...load,
            [currentPdfManager.type]: [...(load[currentPdfManager.type] || []), fileInfo]
          };
        }
        return load;
      });
      
      setLoads(updatedLoads);
      saveLoadsToStorage(updatedLoads);
      
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

  const states = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Load Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Manage all your transportation loads and shipments
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
            New Load
          </Button>
        </Box>

        {/* Filters and Search */}
        <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
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
                      bgcolor: '#F9FAFB'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{ bgcolor: '#F9FAFB' }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_transit">In Transit</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="delayed">Delayed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Loads Table */}
      <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Load #</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Proof of Delivery</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Rate Confirmation</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Pickup Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLoads.map((load) => {
                const statusConfig = getStatusColor(load.status);
                return (
                  <TableRow key={load.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalShipping sx={{ color: '#4F46E5', mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                          {load.loadNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                        {load.customer}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ color: '#6B7280', mr: 0.5, fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {load.origin.city}, {load.origin.province} → {load.destination.city}, {load.destination.province}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#4F46E5', fontSize: '0.75rem', mr: 1 }}>
                          {load.driver.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {load.driver}
                        </Typography>
                      </Box>
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
                        <AttachMoney sx={{ color: '#6B7280', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                          {load.rate.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
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
                                color: '#059669',
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
                              borderColor: '#D1D5DB',
                              color: '#6B7280'
                            }}
                            onClick={() => handleOpenPdfManager(load.id, 'proofOfDelivery', load.loadNumber)}
                          >
                            Upload
                          </Button>
                        )}
                      </Box>
                    </TableCell>
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
                              borderColor: '#D1D5DB',
                              color: '#6B7280'
                            }}
                            onClick={() => handleOpenPdfManager(load.id, 'rateConfirmation', load.loadNumber)}
                          >
                            Upload
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ color: '#6B7280', mr: 0.5, fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {new Date(load.pickupDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, load.id)}
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

        {filteredLoads.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <LocalShipping sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
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
          borderBottom: '1px solid #E5E7EB',
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
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
                    bgcolor: '#EEF2FF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <Receipt sx={{ color: '#4F46E5', fontSize: 14 }} />
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
                        bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4F46E5'
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
                      return option.company || '';
                    }}
                    value={formData.customer}
                    onChange={(event, newValue) => {
                      const customerName = typeof newValue === 'string' ? newValue : (newValue?.company || '');
                      setFormData({ ...formData, customer: customerName });
                    }}
                    onInputChange={(event, newInputValue) => {
                      setFormData({ ...formData, customer: newInputValue });
                    }}
                    disabled={dialogMode === 'view'}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer Name"
                        placeholder="Type or select a customer..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
                            height: '56px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#4F46E5'
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
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
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
                      return option.company || '';
                    }}
                    value={formData.broker}
                    onChange={(event, newValue) => {
                      const brokerName = typeof newValue === 'string' ? newValue : (newValue?.company || '');
                      setFormData({ ...formData, broker: brokerName });
                    }}
                    onInputChange={(event, newInputValue) => {
                      setFormData({ ...formData, broker: newInputValue });
                    }}
                    disabled={dialogMode === 'view'}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Broker (Optional)"
                        placeholder="Type or select a broker..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
                            height: '56px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#4F46E5'
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
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
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
                <Grid item xs={12} md={5.75}>
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
                        bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2563EB'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5.75}>
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
                        bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
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
                    bgcolor: '#F0FDF4', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <LocationOn sx={{ color: '#059669', fontSize: 14 }} />
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
                        bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
                        height: '56px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#059669'
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
                            bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
                            height: '56px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#059669'
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
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
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
                        bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
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
                            bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
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
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
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
                            bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
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
                          <Person sx={{ mr: 2, fontSize: 20, color: '#6B7280' }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {option.name}
                            </Typography>
                          </Box>
                          {option.status && (
                            <Chip
                              size="small"
                              label={option.status}
                              sx={{ 
                                ml: 1, 
                                bgcolor: option.status === 'active' || option.status === 'available' ? '#D1FAE5' : '#FEE2E2',
                                color: option.status === 'active' || option.status === 'available' ? '#059669' : '#DC2626',
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
                      startAdornment: <AttachMoney sx={{ color: '#6B7280', mr: 0.5, fontSize: 18 }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
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
                        bgcolor: dialogMode === 'view' ? '#F9FAFB' : 'white',
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
                          <CheckCircle sx={{ mr: 2, fontSize: 18, color: '#059669' }} />
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
          </Box>
        </DialogContent>
        {dialogMode !== 'view' && (
          <DialogActions sx={{ 
            p: 4, 
            borderTop: '1px solid #E5E7EB',
            bgcolor: '#F9FAFB',
            display: 'flex',
            gap: 2
          }}>
            <Button 
              onClick={handleCloseDialog} 
              variant="outlined"
              sx={{ 
                color: '#6B7280',
                borderColor: '#D1D5DB',
                '&:hover': { 
                  borderColor: '#9CA3AF',
                  bgcolor: '#F3F4F6'
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
                bgcolor: '#4F46E5', 
                '&:hover': { bgcolor: '#3730A3' },
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
          borderBottom: '1px solid #E5E7EB',
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
                  borderColor: selectedFile ? '#059669' : '#D1D5DB',
                  bgcolor: selectedFile ? '#F0FDF4' : '#F9FAFB',
                  color: selectedFile ? '#059669' : '#6B7280',
                  flexDirection: 'column',
                  gap: 1,
                  '&:hover': {
                    borderColor: '#059669',
                    bgcolor: '#F0FDF4'
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
              <Box sx={{ mt: 3, p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #D1FAE5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <PictureAsPdf sx={{ color: '#059669', fontSize: 24 }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
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
          borderTop: '1px solid #E5E7EB',
          bgcolor: '#F9FAFB',
          display: 'flex',
          gap: 2
        }}>
          <Button 
            onClick={handleCloseUploadDialog} 
            variant="outlined"
            sx={{ 
              color: '#6B7280',
              borderColor: '#D1D5DB',
              '&:hover': { 
                borderColor: '#9CA3AF',
                bgcolor: '#F3F4F6'
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
              bgcolor: '#059669', 
              '&:hover': { bgcolor: '#047857' },
              '&:disabled': { bgcolor: '#D1D5DB' },
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
          borderBottom: '1px solid #E5E7EB',
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
                borderTop: '1px solid #E5E7EB',
                bgcolor: '#F9FAFB'
              }}>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
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
          borderTop: '1px solid #E5E7EB',
          bgcolor: '#F9FAFB',
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
              borderColor: '#059669',
              color: '#059669',
              '&:hover': {
                borderColor: '#047857',
                bgcolor: '#F0FDF4'
              }
            }}
          >
            Download PDF
          </Button>
          <Button 
            onClick={handleClosePdfViewer} 
            variant="contained"
            sx={{ 
              bgcolor: '#6B7280',
              '&:hover': { bgcolor: '#4B5563' }
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
          borderBottom: '1px solid #E5E7EB',
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
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
                  <Card key={pdf._id} sx={{ border: '1px solid #E5E7EB' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <PictureAsPdf sx={{ color: '#4F46E5', fontSize: 24 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                              {pdf.filename}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
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
                              borderColor: '#4F46E5',
                              color: '#4F46E5',
                              '&:hover': {
                                borderColor: '#3730A3',
                                bgcolor: '#EEF2FF'
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
                bgcolor: '#F9FAFB',
                borderRadius: 2,
                border: '2px dashed #D1D5DB'
              }}>
                <PictureAsPdf sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#6B7280', mb: 1 }}>
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
                    borderColor: selectedFile ? '#4F46E5' : '#D1D5DB',
                    bgcolor: selectedFile ? '#EEF2FF' : '#F9FAFB',
                    color: selectedFile ? '#4F46E5' : '#6B7280',
                    flexDirection: 'column',
                    gap: 1,
                    '&:hover': {
                      borderColor: '#4F46E5',
                      bgcolor: '#EEF2FF'
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
                      bgcolor: '#4F46E5', 
                      '&:hover': { bgcolor: '#3730A3' }
                    }}
                  >
                    {loading ? 'Uploading...' : 'Upload PDF'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedFile(null)}
                    sx={{
                      borderColor: '#6B7280',
                      color: '#6B7280'
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid #E5E7EB',
          bgcolor: '#F9FAFB'
        }}>
          <Button 
            onClick={handleClosePdfManager} 
            variant="contained"
            sx={{ 
              bgcolor: '#6B7280',
              '&:hover': { bgcolor: '#4B5563' }
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
};

export default LoadManagement;