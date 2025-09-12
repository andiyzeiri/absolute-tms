import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Paper,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  PictureAsPdf,
  Save,
  Settings,
  Refresh,
  Close,
  Description,
  Email,
  Print,
  Download,
  Business,
  LocalShipping,
  AttachMoney,
  CalendarMonth,
  Person,
  Phone
} from '@mui/icons-material';

const RateConfirmations = () => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [editingBroker, setEditingBroker] = useState(false);
  const pdfRef = useRef();

  // Broker Information State
  const [brokerData, setBrokerData] = useState({
    companyName: 'Absolute Trucking Inc',
    address: '123 Transport Avenue, Toronto, ON M5V 1A1',
    phone: '(416) 555-0100',
    email: 'dispatch@absolutetrucking.com',
    mcNumber: '123456',
    dotNumber: '789012'
  });

  // Rate confirmation form data
  const [formData, setFormData] = useState({
    // Header Information
    confirmationNumber: `RC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerContact: '',
    customerPhone: '',
    customerEmail: '',
    
    // Shipper Details
    shipperName: '',
    shipperStreet: '',
    shipperCity: '',
    shipperState: '',
    shipperZip: '',
    shipperDate: '',
    shipperAppointmentTime: '',
    shipperPickupNumber: '',
    
    // Receiver Details  
    receiverName: '',
    receiverStreet: '',
    receiverCity: '',
    receiverState: '',
    receiverZip: '',
    receiverDate: '',
    receiverAppointmentTime: '',
    receiverPickupNumber: '',
    
    // Shipment Details
    pickupLocation: '',
    pickupDate: '',
    pickupTime: '',
    deliveryLocation: '',
    deliveryDate: '',
    deliveryTime: '',
    equipment: '',
    commodity: '',
    weight: '',
    dimensions: '',
    specialInstructions: '',
    
    // Rate Information
    lineHaul: '',
    fuelSurcharge: '',
    accessorials: '',
    totalRate: '',
    currency: 'CAD',
    
    // Terms
    paymentTerms: 'Net 30',
    cancellationPolicy: 'Subject to standard cancellation terms',
    notes: ''
  });

  // Settings for keeping table prefilled
  const [settings, setSettings] = useState({
    keepPrefilled: false,
    defaultCustomerName: '',
    defaultCustomerContact: '',
    defaultCustomerPhone: '',
    defaultCustomerEmail: '',
    defaultEquipment: '',
    defaultPaymentTerms: 'Net 30',
    defaultCurrency: 'CAD'
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('rateConfirmationSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      
      // If keep prefilled is enabled, apply default values
      if (parsedSettings.keepPrefilled) {
        setFormData(prev => ({
          ...prev,
          customerName: parsedSettings.defaultCustomerName || '',
          customerContact: parsedSettings.defaultCustomerContact || '',
          customerPhone: parsedSettings.defaultCustomerPhone || '',
          customerEmail: parsedSettings.defaultCustomerEmail || '',
          equipment: parsedSettings.defaultEquipment || '',
          paymentTerms: parsedSettings.defaultPaymentTerms || 'Net 30',
          currency: parsedSettings.defaultCurrency || 'CAD'
        }));
      }
    }
  }, []);

  // Calculate total rate automatically
  useEffect(() => {
    const lineHaul = parseFloat(formData.lineHaul) || 0;
    const fuelSurcharge = parseFloat(formData.fuelSurcharge) || 0;
    const accessorials = parseFloat(formData.accessorials) || 0;
    const total = lineHaul + fuelSurcharge + accessorials;
    
    setFormData(prev => ({
      ...prev,
      totalRate: total.toFixed(2)
    }));
  }, [formData.lineHaul, formData.fuelSurcharge, formData.accessorials]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBrokerInputChange = (field, value) => {
    setBrokerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveBrokerInfo = () => {
    setEditingBroker(false);
    setSnackbar({ open: true, message: 'Broker information updated successfully!', severity: 'success' });
  };

  const handleCancelBrokerEdit = () => {
    setEditingBroker(false);
    // Reset to original values if needed
  };

  // Helper function to format full address
  const formatAddress = (street, city, state, zip) => {
    const parts = [street, city, state, zip].filter(part => part && part.trim());
    if (parts.length === 0) return '';
    
    // Format as: Street, City, State Zip
    if (parts.length >= 3) {
      const streetPart = parts[0];
      const cityPart = parts[1];
      const stateZip = parts.slice(2).join(' ');
      return `${streetPart}, ${cityPart}, ${stateZip}`;
    }
    
    return parts.join(', ');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('rateConfirmationSettings', JSON.stringify(settings));
    setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    setOpenSettingsDialog(false);
    
    // If keep prefilled is enabled, apply defaults to current form
    if (settings.keepPrefilled) {
      setFormData(prev => ({
        ...prev,
        customerName: settings.defaultCustomerName || '',
        customerContact: settings.defaultCustomerContact || '',
        customerPhone: settings.defaultCustomerPhone || '',
        customerEmail: settings.defaultCustomerEmail || '',
        equipment: settings.defaultEquipment || '',
        paymentTerms: settings.defaultPaymentTerms || 'Net 30',
        currency: settings.defaultCurrency || 'CAD'
      }));
    }
  };

  const handleClearForm = () => {
    const newConfirmationNumber = `RC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const baseForm = {
      confirmationNumber: newConfirmationNumber,
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerContact: '',
      customerPhone: '',
      customerEmail: '',
      shipperName: '',
      shipperStreet: '',
      shipperCity: '',
      shipperState: '',
      shipperZip: '',
      shipperDate: '',
      shipperAppointmentTime: '',
      shipperPickupNumber: '',
      receiverName: '',
      receiverStreet: '',
      receiverCity: '',
      receiverState: '',
      receiverZip: '',
      receiverDate: '',
      receiverAppointmentTime: '',
      receiverPickupNumber: '',
      pickupLocation: '',
      pickupDate: '',
      pickupTime: '',
      deliveryLocation: '',
      deliveryDate: '',
      deliveryTime: '',
      equipment: '',
      commodity: '',
      weight: '',
      dimensions: '',
      specialInstructions: '',
      lineHaul: '',
      fuelSurcharge: '',
      accessorials: '',
      totalRate: '',
      currency: 'CAD',
      paymentTerms: 'Net 30',
      cancellationPolicy: 'Subject to standard cancellation terms',
      notes: ''
    };

    // Apply defaults if keepPrefilled is enabled
    if (settings.keepPrefilled) {
      baseForm.customerName = settings.defaultCustomerName || '';
      baseForm.customerContact = settings.defaultCustomerContact || '';
      baseForm.customerPhone = settings.defaultCustomerPhone || '';
      baseForm.customerEmail = settings.defaultCustomerEmail || '';
      baseForm.equipment = settings.defaultEquipment || '';
      baseForm.paymentTerms = settings.defaultPaymentTerms || 'Net 30';
      baseForm.currency = settings.defaultCurrency || 'CAD';
    }

    setFormData(baseForm);
    setSnackbar({ open: true, message: 'Form cleared and reset!', severity: 'info' });
  };

  const handleGeneratePDF = () => {
    // Validate required fields
    const requiredFields = ['shipperName', 'totalRate'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      setSnackbar({ 
        open: true, 
        message: 'Please fill in all required fields (Shipper Name, Total Rate)', 
        severity: 'error' 
      });
      return;
    }

    setOpenPreviewDialog(true);
  };

  const handleDownloadPDF = async () => {
    try {
      const element = pdfRef.current;
      
      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions for PDF (A4 size)
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if content is too long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download the PDF
      const fileName = `Rate_Confirmation_${formData.confirmationNumber}.pdf`;
      pdf.save(fileName);
      
      setSnackbar({ open: true, message: 'PDF downloaded successfully!', severity: 'success' });
      setOpenPreviewDialog(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({ open: true, message: 'Error generating PDF. Please try again.', severity: 'error' });
    }
  };

  const handleEmailPDF = async () => {
    try {
      // Generate PDF data for emailing
      const element = pdfRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const pdfBlob = pdf.output('blob');
      
      // In a real application, you would send this blob to your email service
      // For demo purposes, we'll show a success message
      setSnackbar({ 
        open: true, 
        message: `PDF prepared for email to ${formData.customerEmail || 'customer'}!`, 
        severity: 'success' 
      });
      setOpenPreviewDialog(false);
    } catch (error) {
      console.error('Error preparing PDF for email:', error);
      setSnackbar({ open: true, message: 'Error preparing PDF for email. Please try again.', severity: 'error' });
    }
  };

  const equipmentTypes = [
    'Dry Van (53ft)',
    'Reefer (53ft)',
    'Flatbed (48ft)',
    'Step Deck',
    'Lowboy',
    'Tanker',
    'Box Truck',
    'Straight Truck',
    'Other'
  ];

  const paymentTermsOptions = [
    'Net 15',
    'Net 30',
    'Net 45',
    'COD',
    'Prepaid',
    'Quick Pay'
  ];

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <img 
                src="https://media.licdn.com/dms/image/v2/D4E03AQE4zKkMdrxIMw/profile-displayphoto-shrink_200_200/B4EZTgmeIGHcAY-/0/1738934969354?e=2147483647&v=beta&t=RlSi52g85QR9U5o7WK077BwDbW_Q9lraBy6kFKEBuTM"
                alt="Company Logo"
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginRight: '16px',
                  backgroundColor: 'white',
                  padding: '4px'
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827' }}>
                Rate Confirmations
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#6B7280', ml: '76px' }}>
              Create and manage transportation rate confirmations with PDF generation
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setOpenSettingsDialog(true)}
              sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#D1D5DB' } }}
            >
              Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleClearForm}
              sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#D1D5DB' } }}
            >
              Clear Form
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdf />}
              onClick={handleGeneratePDF}
              sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
            >
              Generate PDF
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Rate Confirmation Form */}
        <Grid item xs={12}>
          {/* Broker Information */}
          <Card sx={{ border: '1px solid #666666', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', mb: 1.5 }}>
            <Box sx={{ 
              bgcolor: '#1D3557', 
              color: 'white', 
              py: 0.5, 
              px: 1, 
              borderBottom: '1px solid #666666',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                BROKER
              </Typography>
              <Button
                size="small"
                startIcon={<Edit sx={{ fontSize: 16 }} />}
                onClick={() => setEditingBroker(true)}
                sx={{ 
                  color: 'white', 
                  fontSize: '11px',
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Edit
              </Button>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {!editingBroker ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <img 
                      src="https://media.licdn.com/dms/image/v2/D4E03AQE4zKkMdrxIMw/profile-displayphoto-shrink_200_200/B4EZTgmeIGHcAY-/0/1738934969354?e=2147483647&v=beta&t=RlSi52g85QR9U5o7WK077BwDbW_Q9lraBy6kFKEBuTM"
                      alt="Company Logo"
                      style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        padding: '3px',
                        marginRight: '12px',
                        marginTop: '2px'
                      }}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '15px', mb: 1, color: '#000000' }}>
                        {brokerData.companyName}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.3 }}>
                        {brokerData.address}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontSize: '11px', mb: 0.3, lineHeight: 1.3 }}>
                      Phone: {brokerData.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '11px', mb: 0.3, lineHeight: 1.3 }}>
                      Email: {brokerData.email}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '10px', lineHeight: 1.3, fontWeight: 600 }}>
                      MC#: {brokerData.mcNumber} | DOT#: {brokerData.dotNumber}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company Name"
                        value={brokerData.companyName}
                        onChange={(e) => handleBrokerInputChange('companyName', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={brokerData.address}
                        onChange={(e) => handleBrokerInputChange('address', e.target.value)}
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={brokerData.phone}
                        onChange={(e) => handleBrokerInputChange('phone', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={brokerData.email}
                        onChange={(e) => handleBrokerInputChange('email', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="MC Number"
                        value={brokerData.mcNumber}
                        onChange={(e) => handleBrokerInputChange('mcNumber', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="DOT Number"
                        value={brokerData.dotNumber}
                        onChange={(e) => handleBrokerInputChange('dotNumber', e.target.value)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancelBrokerEdit}
                      size="small"
                      sx={{ borderColor: '#E5E7EB', color: '#374151' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveBrokerInfo}
                      startIcon={<Save />}
                      size="small"
                      sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Header Information */}
          <Card sx={{ border: '1px solid #666666', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', mb: 1.5 }}>
            <Box sx={{ 
              bgcolor: '#1D3557', 
              color: 'white', 
              p: 1, 
              borderBottom: '1px solid #666666'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                HEADER INFORMATION
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Confirmation Number"
                    value={formData.confirmationNumber}
                    onChange={(e) => handleInputChange('confirmationNumber', e.target.value)}
                    sx={{ bgcolor: '#F9FAFB' }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                    >
                      <MenuItem value="CAD">CAD ($)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

              </Grid>
            </CardContent>
          </Card>

          {/* Shipper Information */}
          <Card sx={{ border: '1px solid #666666', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', mb: 1.5 }}>
            <Box sx={{ 
              bgcolor: '#1D3557', 
              color: 'white', 
              p: 1, 
              borderBottom: '1px solid #666666'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                SHIPPER
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Shipper Name *"
                    value={formData.shipperName}
                    onChange={(e) => handleInputChange('shipperName', e.target.value)}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.shipperStreet}
                    onChange={(e) => handleInputChange('shipperStreet', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.shipperCity}
                    onChange={(e) => handleInputChange('shipperCity', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={formData.shipperState}
                    onChange={(e) => handleInputChange('shipperState', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={formData.shipperZip}
                    onChange={(e) => handleInputChange('shipperZip', e.target.value)}
                  />
                </Grid>

                {/* Empty space for visual separation */}
                <Grid item xs={12} sx={{ height: 72 }}></Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={formData.shipperDate}
                    onChange={(e) => handleInputChange('shipperDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Appointment Time"
                    type="time"
                    value={formData.shipperAppointmentTime}
                    onChange={(e) => handleInputChange('shipperAppointmentTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Pickup Number"
                    value={formData.shipperPickupNumber}
                    onChange={(e) => handleInputChange('shipperPickupNumber', e.target.value)}
                  />
                </Grid>

              </Grid>
            </CardContent>
          </Card>

          {/* Receiver Information */}
          <Card sx={{ border: '1px solid #666666', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', mb: 1.5 }}>
            <Box sx={{ 
              bgcolor: '#1D3557', 
              color: 'white', 
              p: 1, 
              borderBottom: '1px solid #666666'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                RECEIVER
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Receiver Name"
                    value={formData.receiverName}
                    onChange={(e) => handleInputChange('receiverName', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.receiverStreet}
                    onChange={(e) => handleInputChange('receiverStreet', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.receiverCity}
                    onChange={(e) => handleInputChange('receiverCity', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={formData.receiverState}
                    onChange={(e) => handleInputChange('receiverState', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={formData.receiverZip}
                    onChange={(e) => handleInputChange('receiverZip', e.target.value)}
                  />
                </Grid>

                {/* Empty space for visual separation */}
                <Grid item xs={12} sx={{ height: 72 }}></Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={formData.receiverDate}
                    onChange={(e) => handleInputChange('receiverDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Appointment Time"
                    type="time"
                    value={formData.receiverAppointmentTime}
                    onChange={(e) => handleInputChange('receiverAppointmentTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Pickup Number"
                    value={formData.receiverPickupNumber}
                    onChange={(e) => handleInputChange('receiverPickupNumber', e.target.value)}
                  />
                </Grid>

              </Grid>
            </CardContent>
          </Card>

          {/* Load Details */}
          <Card sx={{ border: '1px solid #666666', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', mb: 1.5 }}>
            <Box sx={{ 
              bgcolor: '#1D3557', 
              color: 'white', 
              p: 1, 
              borderBottom: '1px solid #666666'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                LOAD DETAILS
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>







                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Equipment Type</InputLabel>
                    <Select
                      value={formData.equipment}
                      onChange={(e) => handleInputChange('equipment', e.target.value)}
                    >
                      {equipmentTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Commodity"
                    value={formData.commodity}
                    onChange={(e) => handleInputChange('commodity', e.target.value)}
                    placeholder="Description of goods being transported"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Weight"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="e.g., 45,000 lbs"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dimensions"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    placeholder="e.g., 48' x 102' x 8.5'"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Special Instructions"
                    multiline
                    rows={2}
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                    placeholder="Any special handling requirements or instructions"
                  />
                </Grid>

              </Grid>
            </CardContent>
          </Card>

          {/* Financial Information & Payout Terms */}
          <Card sx={{ border: '1px solid #666666', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', mb: 1.5 }}>
            <Box sx={{ 
              bgcolor: '#1D3557', 
              color: 'white', 
              p: 1, 
              borderBottom: '1px solid #666666'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                FINANCIAL INFORMATION & PAYOUT TERMS
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Line Haul Rate"
                    type="number"
                    value={formData.lineHaul}
                    onChange={(e) => handleInputChange('lineHaul', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Fuel Surcharge"
                    type="number"
                    value={formData.fuelSurcharge}
                    onChange={(e) => handleInputChange('fuelSurcharge', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Accessorials"
                    type="number"
                    value={formData.accessorials}
                    onChange={(e) => handleInputChange('accessorials', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Total Rate *"
                    value={formData.totalRate}
                    disabled
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        fontWeight: 600, 
                        fontSize: '1.1rem',
                        color: '#059669'
                      } 
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      value={formData.paymentTerms}
                      onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    >
                      {paymentTermsOptions.map(term => (
                        <MenuItem key={term} value={term}>{term}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cancellation Policy"
                    value={formData.cancellationPolicy}
                    onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional terms, conditions, or notes"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      <Dialog 
        open={openSettingsDialog} 
        onClose={() => setOpenSettingsDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Rate Confirmation Settings
            </Typography>
            <IconButton onClick={() => setOpenSettingsDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.keepPrefilled}
                    onChange={(e) => setSettings({ ...settings, keepPrefilled: e.target.checked })}
                  />
                }
                label="Keep form prefilled with default values"
              />
              <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                When enabled, new rate confirmations will be pre-filled with your default values below.
              </Typography>
            </Grid>

            {settings.keepPrefilled && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Default Customer Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Default Customer Name"
                    value={settings.defaultCustomerName}
                    onChange={(e) => setSettings({ ...settings, defaultCustomerName: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Default Contact Person"
                    value={settings.defaultCustomerContact}
                    onChange={(e) => setSettings({ ...settings, defaultCustomerContact: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Default Phone"
                    value={settings.defaultCustomerPhone}
                    onChange={(e) => setSettings({ ...settings, defaultCustomerPhone: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Default Email"
                    value={settings.defaultCustomerEmail}
                    onChange={(e) => setSettings({ ...settings, defaultCustomerEmail: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Default Shipment Settings
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Default Equipment</InputLabel>
                    <Select
                      value={settings.defaultEquipment}
                      onChange={(e) => setSettings({ ...settings, defaultEquipment: e.target.value })}
                    >
                      <MenuItem value="">None</MenuItem>
                      {equipmentTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Default Payment Terms</InputLabel>
                    <Select
                      value={settings.defaultPaymentTerms}
                      onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                    >
                      {paymentTermsOptions.map(term => (
                        <MenuItem key={term} value={term}>{term}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Default Currency</InputLabel>
                    <Select
                      value={settings.defaultCurrency}
                      onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                    >
                      <MenuItem value="CAD">CAD ($)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenSettingsDialog(false)} sx={{ color: '#6B7280' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog 
        open={openPreviewDialog} 
        onClose={() => setOpenPreviewDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Rate Confirmation Preview
            </Typography>
            <IconButton onClick={() => setOpenPreviewDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Professional Two-Column Rate Confirmation */}
          <Paper ref={pdfRef} sx={{ 
            p: 0, 
            bgcolor: '#FFFFFF', 
            maxWidth: '8.5in', 
            mx: 'auto', 
            boxShadow: 'none',
            border: '1px solid #CCCCCC'
          }}>
            {/* Top Header Row - Load Info Left, Date Right */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#FFFFFF' }}>
              <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600, color: '#333333' }}>
                Load #{formData.confirmationNumber}
              </Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600, color: '#333333', lineHeight: 1.2 }}>
                  {new Date().toLocaleDateString()}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600, color: '#333333', lineHeight: 1.2 }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>

            {/* Compact Title Header */}
            <Box sx={{ textAlign: 'center', py: 2, px: 3, bgcolor: '#FAFAFA', borderTop: '1px solid #E0E0E0', borderBottom: '1px solid #E0E0E0' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '22px', letterSpacing: '0.5px', color: '#333333' }}>
                RATE CONFIRMATION
              </Typography>
            </Box>

            <Box sx={{ p: 3 }}>

              {/* Top Header - Broker Information */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ 
                  bgcolor: '#1D3557', 
                  color: 'white', 
                  py: 0.5, 
                  px: 1, 
                  border: '1px solid #666666'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                    BROKER
                  </Typography>
                </Box>
                <Box sx={{ 
                  border: '1px solid #666666', 
                  borderTop: 'none', 
                  p: 2,
                  bgcolor: '#FFFFFF'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '15px', mb: 1, color: '#000000' }}>
                        {brokerData.companyName}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.3 }}>
                        {brokerData.address}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontSize: '11px', mb: 0.3, lineHeight: 1.3 }}>
                        Phone: {brokerData.phone}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', mb: 0.3, lineHeight: 1.3 }}>
                        Email: {brokerData.email}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '10px', lineHeight: 1.3, fontWeight: 600 }}>
                        MC#: {brokerData.mcNumber} | DOT#: {brokerData.dotNumber}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Full-width boxes for Shipper and Receiver */}
              <Box sx={{ mb: 1.5 }}>
                {/* Shipper Information - Full Width */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: '#1D3557', 
                    color: 'white', 
                    py: 0.5, 
                    px: 1, 
                    border: '1px solid #666666'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                      SHIPPER
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    border: '1px solid #666666', 
                    borderTop: 'none', 
                    p: 2,
                    bgcolor: '#FFFFFF'
                  }}>
                    <Grid container spacing={3}>
                      <Grid item xs={7}>
                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '13px', mb: 1, color: '#000000' }}>
                          {formData.shipperName || 'SHIPPER NAME'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.3, mb: 1 }}>
                          {formatAddress(formData.shipperStreet, formData.shipperCity, formData.shipperState, formData.shipperZip) || 'Shipper Address'}
                        </Typography>
                      </Grid>
                      <Grid item xs={5}>
                        <Typography variant="body2" sx={{ fontSize: '11px', mb: 0.3, lineHeight: 1.3 }}>
                          Date: {formData.shipperDate ? new Date(formData.shipperDate).toLocaleDateString() : 'TBD'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px', mb: 0.3, lineHeight: 1.3 }}>
                          Appointment Time: {formData.shipperAppointmentTime || 'TBD'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.3 }}>
                          Pickup #: {formData.shipperPickupNumber || 'TBD'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
                
                {/* Receiver Information - Full Width */}
                <Box>
                  <Box sx={{ 
                    bgcolor: '#1D3557', 
                    color: 'white', 
                    py: 0.5, 
                    px: 1, 
                    border: '1px solid #666666'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                      RECEIVER
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    border: '1px solid #666666', 
                    borderTop: 'none', 
                    p: 2,
                    bgcolor: '#FFFFFF'
                  }}>
                    <Grid container spacing={3}>
                      <Grid item xs={7}>
                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '13px', mb: 1, color: '#000000' }}>
                          {formData.receiverName || 'TO BE ADVISED'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.3, mb: 1 }}>
                          {formatAddress(formData.receiverStreet, formData.receiverCity, formData.receiverState, formData.receiverZip) || 'Receiver Address'}
                        </Typography>
                      </Grid>
                      <Grid item xs={5}>
                        <Typography variant="body2" sx={{ fontSize: '11px', mb: 0.3, lineHeight: 1.3 }}>
                          Date: {formData.receiverDate ? new Date(formData.receiverDate).toLocaleDateString() : 'TBD'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px', mb: 0.3, lineHeight: 1.3 }}>
                          Appointment Time: {formData.receiverAppointmentTime || 'TBD'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.3 }}>
                          Pickup #: {formData.receiverPickupNumber || 'TBD'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Box>

              {/* Full-width Load Details Box */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ 
                  bgcolor: '#1D3557', 
                  color: 'white', 
                  py: 0.5, 
                  px: 1, 
                  border: '1px solid #666666'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                    LOAD DETAILS
                  </Typography>
                </Box>
                <Box sx={{ 
                  border: '1px solid #666666', 
                  borderTop: 'none', 
                  p: 2,
                  bgcolor: '#FFFFFF'
                }}>
                  <Grid container spacing={3}>
                    <Grid item xs={3}>
                      <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700, mb: 0.3 }}>
                        Load Number:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', mb: 1.5, lineHeight: 1.3 }}>
                        {formData.confirmationNumber}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700, mb: 0.3 }}>
                        Equipment:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.3 }}>
                        {formData.equipment || 'DRY VAN'}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700, mb: 0.3 }}>
                        Weight:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', mb: 1.5, lineHeight: 1.3 }}>
                        {formData.weight || 'TBD'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700, mb: 0.3 }}>
                        Dimensions:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.3 }}>
                        {formData.dimensions || '53\' x 102"'}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700, mb: 0.3 }}>
                        Commodity:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '11px', mb: 1.5, lineHeight: 1.3 }}>
                        {formData.commodity || 'General Freight'}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 700, mb: 0.3 }}>
                        Special Instructions:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '10px', lineHeight: 1.2 }}>
                        {formData.specialInstructions || 'Standard terms apply'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              {/* Full-width Financial Information and Payout Terms Box */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ 
                  bgcolor: '#1D3557', 
                  color: 'white', 
                  py: 0.5, 
                  px: 1, 
                  border: '1px solid #666666'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
                    FINANCIAL INFORMATION & PAYOUT TERMS
                  </Typography>
                </Box>
                <Box sx={{ 
                  border: '1px solid #666666', 
                  borderTop: 'none', 
                  p: 2,
                  bgcolor: '#FFFFFF'
                }}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      {/* Financial Information Column */}
                      <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 800, mb: 1.5, color: '#000000' }}>
                        FINANCIAL BREAKDOWN
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700 }}>
                          Line Haul Rate:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          ${formData.lineHaul || '0.00'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700 }}>
                          Fuel Surcharge:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          ${formData.fuelSurcharge || '0.00'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700 }}>
                          Accessorial Charges:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          ${formData.accessorials || '0.00'}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mt: 1.5, 
                        pt: 1, 
                        borderTop: '1px solid #333333',
                        bgcolor: '#F8F8F8' 
                      }}>
                        <Typography variant="h6" sx={{ fontSize: '13px', fontWeight: 800 }}>
                          TOTAL RATE:
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: '13px', fontWeight: 800 }}>
                          ${formData.totalRate || '0.00'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      {/* Payout Terms Column */}
                      <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 800, mb: 1.5, color: '#000000' }}>
                        PAYMENT TERMS
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700 }}>
                          Payment Terms:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          {formData.paymentTerms || 'Net 30 Days'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 700 }}>
                          Currency:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          {formData.currency || 'CAD'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 700 }}>
                          Quick Pay Available:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '10px' }}>
                          2% discount (5 days)
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #D0D0D0' }}>
                        <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 700, mb: 0.5 }}>
                          Additional Notes:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '10px', lineHeight: 1.2 }}>
                          {formData.notes || 'Payment due within terms specified.'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              {/* Full Width Agreement Section */}
              <Box sx={{ 
                border: '1px solid #666666', 
                p: 1.5, 
                textAlign: 'center', 
                bgcolor: '#F8F8F8',
                mt: 3
              }}>
                <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '16px', mb: 2, letterSpacing: '0.5px' }}>
                  CARRIER AGREEMENT & CONFIRMATION
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '12px', mb: 3, display: 'block', lineHeight: 1.4, fontWeight: 500 }}>
                  By signing below, carrier agrees to transport the above described freight for the rate of ${formData.totalRate || '0.00'} {formData.currency}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 4 }}>
                  <Box sx={{ width: '40%' }}>
                    <Box sx={{ 
                      borderBottom: '1px solid #666666', 
                      mb: 2, 
                      height: '50px',
                      display: 'flex',
                      alignItems: 'end',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="caption" sx={{ color: '#999999', fontSize: '10px', mb: 1 }}>
                        Broker Signature
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '11px', textAlign: 'center', display: 'block' }}>
                      BROKER SIGNATURE / DATE
                    </Typography>
                  </Box>
                  <Box sx={{ width: '40%' }}>
                    <Box sx={{ 
                      borderBottom: '1px solid #666666', 
                      mb: 2, 
                      height: '50px',
                      display: 'flex',
                      alignItems: 'end',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="caption" sx={{ color: '#999999', fontSize: '10px', mb: 1 }}>
                        Carrier Signature
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '11px', textAlign: 'center', display: 'block' }}>
                      CARRIER SIGNATURE / DATE
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Footer */}
              <Box sx={{ 
                textAlign: 'center', 
                borderTop: '1px solid #333333', 
                pt: 2,
                mt: 3,
                bgcolor: '#FAFAFA'
              }}>
                <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 500, color: '#666666' }}>
                  This rate confirmation is valid for 48 hours from date of issue • Generated: {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenPreviewDialog(false)} 
            sx={{ color: '#6B7280' }}
          >
            Close
          </Button>
          <Button
            variant="outlined"
            startIcon={<Email />}
            onClick={handleEmailPDF}
            sx={{ borderColor: '#E5E7EB', color: '#374151' }}
          >
            Email PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadPDF}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
          >
            Download PDF
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

export default RateConfirmations;