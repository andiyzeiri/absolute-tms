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
  InputAdornment,
  Autocomplete,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { downloadInvoicesPDF, previewInvoicesPDF } from '../utils/pdfGenerator';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  Download,
  Receipt,
  AttachMoney,
  Schedule,
  Send,
  Visibility,
  Print,
  Close,
  Person,
  Business,
  CheckCircle,
  AccessTime,
  Warning,
  LocalShipping
} from '@mui/icons-material';

const InvoicingManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuInvoiceId, setMenuInvoiceId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // Demo invoices data
  const demoInvoices = [
    {
      id: 'INV-2024-001',
      invoiceNumber: 'INV-2024-001',
      customer: 'ABC Logistics Inc.',
      customerEmail: 'billing@abclogistics.com',
      loadNumber: 'L-2024-001',
      issueDate: '2024-01-15T00:00:00Z',
      dueDate: '2024-02-14T00:00:00Z',
      status: 'paid',
      amount: 4250.00,
      taxAmount: 552.50,
      totalAmount: 4802.50,
      paidDate: '2024-01-20T00:00:00Z',
      paymentMethod: 'Bank Transfer',
      notes: 'Payment received on time',
      services: [
        { description: 'Transportation - Toronto to Vancouver', quantity: 1, rate: 4250.00, amount: 4250.00 }
      ]
    },
    {
      id: 'INV-2024-002',
      invoiceNumber: 'INV-2024-002',
      customer: 'Global Freight Solutions',
      customerEmail: 'accounts@globalfreight.com',
      loadNumber: 'L-2024-002',
      issueDate: '2024-01-18T00:00:00Z',
      dueDate: '2024-02-17T00:00:00Z',
      status: 'pending',
      amount: 3890.00,
      taxAmount: 505.70,
      totalAmount: 4395.70,
      paidDate: null,
      paymentMethod: null,
      notes: 'Net 30 payment terms',
      services: [
        { description: 'Transportation - Montreal to Calgary', quantity: 1, rate: 3890.00, amount: 3890.00 }
      ]
    },
    {
      id: 'INV-2024-003',
      invoiceNumber: 'INV-2024-003',
      customer: 'Maritime Transport Co.',
      customerEmail: 'finance@maritime.com',
      loadNumber: 'L-2024-003',
      issueDate: '2024-01-20T00:00:00Z',
      dueDate: '2024-02-19T00:00:00Z',
      status: 'overdue',
      amount: 5120.00,
      taxAmount: 665.60,
      totalAmount: 5785.60,
      paidDate: null,
      paymentMethod: null,
      notes: 'Payment overdue - follow up required',
      services: [
        { description: 'Transportation - Halifax to Winnipeg', quantity: 1, rate: 5120.00, amount: 5120.00 }
      ]
    },
    {
      id: 'INV-2024-004',
      invoiceNumber: 'INV-2024-004',
      customer: 'Prairie Logistics',
      customerEmail: 'billing@prairie.com',
      loadNumber: 'L-2024-004',
      issueDate: '2024-01-22T00:00:00Z',
      dueDate: '2024-02-21T00:00:00Z',
      status: 'sent',
      amount: 4750.00,
      taxAmount: 617.50,
      totalAmount: 5367.50,
      paidDate: null,
      paymentMethod: null,
      notes: 'Invoice sent to customer',
      services: [
        { description: 'Transportation - Edmonton to Ottawa', quantity: 1, rate: 4750.00, amount: 4750.00 }
      ]
    },
    {
      id: 'INV-2024-005',
      invoiceNumber: 'INV-2024-005',
      customer: 'Northern Express Ltd.',
      customerEmail: 'accounts@northern.com',
      loadNumber: 'L-2024-005',
      issueDate: '2024-01-25T00:00:00Z',
      dueDate: '2024-02-24T00:00:00Z',
      status: 'draft',
      amount: 3200.00,
      taxAmount: 416.00,
      totalAmount: 3616.00,
      paidDate: null,
      paymentMethod: null,
      notes: 'Draft invoice - pending review',
      services: [
        { description: 'Transportation - Quebec City to Thunder Bay', quantity: 1, rate: 3200.00, amount: 3200.00 }
      ]
    }
  ];

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customer: '',
    customerEmail: '',
    loadNumber: '',
    issueDate: '',
    dueDate: '',
    amount: '',
    taxAmount: '',
    notes: '',
    status: 'draft',
    serviceDescription: '',
    serviceQuantity: 1,
    serviceRate: ''
  });


  // Load invoices from localStorage
  const loadInvoicesFromStorage = () => {
    const savedInvoices = localStorage.getItem('tms_invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    } else {
      // Generate invoices from existing loads
      generateInvoicesFromLoads();
    }
  };

  // Generate invoices from loads data
  const generateInvoicesFromLoads = () => {
    const savedLoads = localStorage.getItem('tms_loads');
    if (savedLoads) {
      const loadsData = JSON.parse(savedLoads);
      
      // Create invoices for delivered loads
      const generatedInvoices = loadsData
        .filter(load => load.status === 'delivered' || load.status === 'in_transit')
        .map((load, index) => {
          const invoiceNumber = `INV-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`;
          const issueDate = new Date(load.deliveryDate || load.pickupDate);
          const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later
          const amount = load.rate || 0;
          const taxRate = 0.13; // 13% HST
          const taxAmount = amount * taxRate;
          const totalAmount = amount + taxAmount;
          
          // Determine status based on load status and dates
          let status = 'draft';
          if (load.status === 'delivered') {
            const daysSinceDelivery = Math.floor((new Date() - new Date(load.deliveryDate)) / (1000 * 60 * 60 * 24));
            if (daysSinceDelivery > 35) {
              status = 'overdue';
            } else if (daysSinceDelivery > 2) {
              status = 'pending';
            } else {
              status = 'sent';
            }
          } else if (load.status === 'in_transit') {
            status = 'draft';
          }
          
          return {
            id: invoiceNumber,
            invoiceNumber,
            customer: load.customer,
            customerEmail: `billing@${load.customer.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
            loadNumber: load.loadNumber,
            issueDate: issueDate.toISOString(),
            dueDate: dueDate.toISOString(),
            status,
            amount,
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            paidDate: status === 'paid' ? issueDate.toISOString() : null,
            paymentMethod: status === 'paid' ? 'Bank Transfer' : null,
            notes: `Invoice for transportation service from ${load.origin.city}, ${load.origin.province} to ${load.destination.city}, ${load.destination.province}`,
            services: [{
              description: `Transportation - ${load.origin.city} to ${load.destination.city}`,
              quantity: 1,
              rate: amount,
              amount: amount
            }]
          };
        });
      
      setInvoices(generatedInvoices);
      // Save generated invoices to localStorage
      localStorage.setItem('tms_invoices', JSON.stringify(generatedInvoices));
    } else {
      // Fallback to demo data if no loads exist
      setInvoices(demoInvoices);
    }
  };

  // Load all loads data (will filter based on invoices later)
  const [allLoads, setAllLoads] = useState([]);
  
  const loadAllLoads = () => {
    const savedLoads = localStorage.getItem('tms_loads');
    if (savedLoads) {
      const loadsData = JSON.parse(savedLoads);
      setAllLoads(loadsData);
    } else {
      setAllLoads([]);
    }
  };

  // Filter available loads based on current invoices
  const getAvailableLoads = () => {
    const existingInvoiceLoads = invoices.map(inv => inv.loadNumber);
    return allLoads.filter(load => 
      (load.status === 'delivered' || load.status === 'in_transit') && 
      !existingInvoiceLoads.includes(load.loadNumber)
    );
  };

  useEffect(() => {
    loadInvoicesFromStorage();
    loadAllLoads(); // Load all loads initially
    
    // Listen for load updates to regenerate invoices and reload loads
    const handleLoadsUpdate = () => {
      loadInvoicesFromStorage();
      loadAllLoads();
    };
    
    window.addEventListener('loadsUpdated', handleLoadsUpdate);
    
    return () => {
      window.removeEventListener('loadsUpdated', handleLoadsUpdate);
    };
  }, []);

  const getStatusConfig = (status) => {
    const statusConfigs = {
      draft: { bgcolor: '#F3F4F6', color: '#6B7280', label: 'Draft' },
      sent: { bgcolor: '#DBEAFE', color: '#2563EB', label: 'Sent' },
      pending: { bgcolor: '#FEF3C7', color: '#D97706', label: 'Pending' },
      paid: { bgcolor: '#D1FAE5', color: '#059669', label: 'Paid' },
      overdue: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'Overdue' },
      cancelled: { bgcolor: '#F3F4F6', color: '#6B7280', label: 'Cancelled' }
    };
    return statusConfigs[status] || statusConfigs.draft;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.loadNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (mode, invoice = null) => {
    setDialogMode(mode);
    setSelectedInvoice(invoice);
    
    if (invoice && mode === 'edit') {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer,
        customerEmail: invoice.customerEmail,
        loadNumber: invoice.loadNumber,
        issueDate: invoice.issueDate.split('T')[0],
        dueDate: invoice.dueDate.split('T')[0],
        amount: invoice.amount,
        taxAmount: invoice.taxAmount,
        notes: invoice.notes,
        status: invoice.status,
        serviceDescription: invoice.services[0]?.description || '',
        serviceQuantity: invoice.services[0]?.quantity || 1,
        serviceRate: invoice.services[0]?.rate || ''
      });
    } else {
      // Reset form for new invoice
      setFormData({
        invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
        customer: '',
        customerEmail: '',
        loadNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: '',
        taxAmount: '',
        notes: '',
        status: 'draft',
        serviceDescription: '',
        serviceQuantity: 1,
        serviceRate: ''
      });
    }
    setOpenDialog(true);
  };

  // Handle load selection to populate form
  const handleLoadSelection = (selectedLoad) => {
    if (selectedLoad) {
      const amount = selectedLoad.rate || 0;
      setFormData({
        ...formData,
        customer: selectedLoad.customer,
        customerEmail: `billing@${selectedLoad.customer.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
        loadNumber: selectedLoad.loadNumber,
        amount: amount.toString(),
        serviceDescription: `Transportation - ${selectedLoad.origin.city} to ${selectedLoad.destination.city}`,
        serviceRate: amount.toString(),
        notes: `Invoice for transportation service from ${selectedLoad.origin.city}, ${selectedLoad.origin.province} to ${selectedLoad.destination.city}, ${selectedLoad.destination.province}`
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
  };

  const calculateTotals = () => {
    const amount = parseFloat(formData.amount) || 0;
    const taxRate = 0.13; // 13% HST
    const taxAmount = amount * taxRate;
    const totalAmount = amount + taxAmount;
    return { taxAmount: taxAmount.toFixed(2), totalAmount: totalAmount.toFixed(2) };
  };

  // Save invoices to localStorage
  const saveInvoicesToStorage = (invoicesData) => {
    localStorage.setItem('tms_invoices', JSON.stringify(invoicesData));
  };

  const handleSaveInvoice = () => {
    const { taxAmount, totalAmount } = calculateTotals();
    
    let updatedInvoices;
    
    if (dialogMode === 'add') {
      const newInvoice = {
        id: formData.invoiceNumber,
        invoiceNumber: formData.invoiceNumber,
        customer: formData.customer,
        customerEmail: formData.customerEmail,
        loadNumber: formData.loadNumber,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        amount: parseFloat(formData.amount),
        taxAmount: parseFloat(taxAmount),
        totalAmount: parseFloat(totalAmount),
        paidDate: null,
        paymentMethod: null,
        notes: formData.notes,
        services: [{
          description: formData.serviceDescription,
          quantity: formData.serviceQuantity,
          rate: parseFloat(formData.serviceRate),
          amount: parseFloat(formData.amount)
        }]
      };
      updatedInvoices = [...invoices, newInvoice];
      setSnackbar({ open: true, message: 'Invoice created successfully!', severity: 'success' });
    } else if (dialogMode === 'edit') {
      updatedInvoices = invoices.map(invoice => 
        invoice.id === selectedInvoice.id ? {
          ...invoice,
          invoiceNumber: formData.invoiceNumber,
          customer: formData.customer,
          customerEmail: formData.customerEmail,
          loadNumber: formData.loadNumber,
          issueDate: new Date(formData.issueDate).toISOString(),
          dueDate: new Date(formData.dueDate).toISOString(),
          status: formData.status,
          amount: parseFloat(formData.amount),
          taxAmount: parseFloat(taxAmount),
          totalAmount: parseFloat(totalAmount),
          notes: formData.notes,
          services: [{
            description: formData.serviceDescription,
            quantity: formData.serviceQuantity,
            rate: parseFloat(formData.serviceRate),
            amount: parseFloat(formData.amount)
          }]
        } : invoice
      );
      setSnackbar({ open: true, message: 'Invoice updated successfully!', severity: 'success' });
    }
    
    setInvoices(updatedInvoices);
    saveInvoicesToStorage(updatedInvoices);
    handleCloseDialog();
  };

  const handleDeleteInvoice = (invoiceId) => {
    const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
    setInvoices(updatedInvoices);
    saveInvoicesToStorage(updatedInvoices);
    setSnackbar({ open: true, message: 'Invoice deleted successfully!', severity: 'success' });
    handleCloseMenu();
  };

  const handleMarkAsPaid = (invoiceId) => {
    const updatedInvoices = invoices.map(invoice => 
      invoice.id === invoiceId ? {
        ...invoice,
        status: 'paid',
        paidDate: new Date().toISOString(),
        paymentMethod: 'Bank Transfer'
      } : invoice
    );
    setInvoices(updatedInvoices);
    saveInvoicesToStorage(updatedInvoices);
    setSnackbar({ open: true, message: 'Invoice marked as paid!', severity: 'success' });
    handleCloseMenu();
  };

  const handleSendInvoice = (invoiceId) => {
    const updatedInvoices = invoices.map(invoice => 
      invoice.id === invoiceId ? {
        ...invoice,
        status: invoice.status === 'draft' ? 'sent' : invoice.status
      } : invoice
    );
    setInvoices(updatedInvoices);
    saveInvoicesToStorage(updatedInvoices);
    setSnackbar({ open: true, message: 'Invoice sent to customer!', severity: 'success' });
    handleCloseMenu();
  };

  const handleMenuClick = (event, invoiceId) => {
    setAnchorEl(event.currentTarget);
    setMenuInvoiceId(invoiceId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuInvoiceId(null);
  };

  // PDF Generation Functions
  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };

  const handleSelectAllInvoices = () => {
    const allInvoiceIds = filteredInvoices.map(invoice => invoice.id);
    if (selectedInvoices.length === allInvoiceIds.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(allInvoiceIds);
    }
  };

  const handleDownloadSelectedPDF = () => {
    const selectedInvoiceData = invoices.filter(invoice => 
      selectedInvoices.includes(invoice.id)
    );
    
    if (selectedInvoiceData.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'Please select at least one invoice to download', 
        severity: 'warning' 
      });
      return;
    }

    const filename = selectedInvoiceData.length === 1 
      ? `invoice-${selectedInvoiceData[0].invoiceNumber}.pdf`
      : `invoices-${new Date().toISOString().split('T')[0]}.pdf`;

    downloadInvoicesPDF(selectedInvoiceData, filename);
    setSnackbar({ 
      open: true, 
      message: `Downloaded ${selectedInvoiceData.length} invoice(s) as PDF`, 
      severity: 'success' 
    });
    setSelectedInvoices([]);
  };

  const handlePreviewSelectedPDF = () => {
    const selectedInvoiceData = invoices.filter(invoice => 
      selectedInvoices.includes(invoice.id)
    );
    
    if (selectedInvoiceData.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'Please select at least one invoice to preview', 
        severity: 'warning' 
      });
      return;
    }

    previewInvoicesPDF(selectedInvoiceData);
  };

  const handleDownloadSinglePDF = (invoice) => {
    downloadInvoicesPDF([invoice], `invoice-${invoice.invoiceNumber}.pdf`);
    setSnackbar({ 
      open: true, 
      message: `Downloaded invoice ${invoice.invoiceNumber} as PDF`, 
      severity: 'success' 
    });
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Invoice Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Create, send, and track invoices and payments
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadSelectedPDF}
              disabled={selectedInvoices.length === 0}
              sx={{ 
                borderColor: '#E5E7EB', 
                color: '#374151', 
                '&:hover': { borderColor: '#D1D5DB' }
              }}
            >
              Download PDF ({selectedInvoices.length})
            </Button>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={handlePreviewSelectedPDF}
              disabled={selectedInvoices.length === 0}
              sx={{ 
                borderColor: '#E5E7EB', 
                color: '#374151', 
                '&:hover': { borderColor: '#D1D5DB' }
              }}
            >
              Preview PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog('add')}
              sx={{ 
                bgcolor: '#4F46E5',
                '&:hover': { bgcolor: '#3730A3' }
              }}
            >
              Create Invoice
            </Button>
          </Box>
        </Box>

        {/* Invoice Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Receipt sx={{ fontSize: 32, color: '#4F46E5', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {invoices.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 32, color: '#10B981', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {invoices.filter(i => i.status === 'paid').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Paid Invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <AccessTime sx={{ fontSize: 32, color: '#F59E0B', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {invoices.filter(i => i.status === 'pending' || i.status === 'sent').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Pending Payment
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Warning sx={{ fontSize: 32, color: '#EF4444', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {invoices.filter(i => i.status === 'overdue').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Overdue
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
                  placeholder="Search invoices..."
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
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="sent">Sent</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
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

      {/* Two Tables Layout */}
      <Grid container spacing={3}>
        {/* Loads Available for Invoicing */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                  Loads Ready for Invoicing
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Delivered and in-transit loads without invoices
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Load #</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getAvailableLoads().map((load) => {
                      const statusConfig = {
                        delivered: { bgcolor: '#D1FAE5', color: '#059669', label: 'Delivered' },
                        in_transit: { bgcolor: '#DBEAFE', color: '#2563EB', label: 'In Transit' }
                      }[load.status];
                      
                      return (
                        <TableRow key={load.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                              {load.loadNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                              {load.customer}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem' }}>
                              ${load.rate?.toLocaleString()}
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
                                fontSize: '0.75rem',
                                height: '24px'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                handleLoadSelection(load);
                                handleOpenDialog('add');
                              }}
                              sx={{ 
                                bgcolor: '#4F46E5',
                                '&:hover': { bgcolor: '#3730A3' },
                                fontSize: '0.75rem',
                                px: 2
                              }}
                            >
                              Create Invoice
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {getAvailableLoads().length === 0 && (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <LocalShipping sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#6B7280', mb: 1 }}>
                    No loads ready for invoicing
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                    Complete some loads to generate invoices
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Current Invoices */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                  Current Invoices
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  All invoices and their payment status
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                          indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < filteredInvoices.length}
                          onChange={handleSelectAllInvoices}
                          sx={{ color: '#4F46E5' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const statusConfig = getStatusConfig(invoice.status);
                      const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
                      return (
                        <TableRow key={invoice.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => handleSelectInvoice(invoice.id)}
                              sx={{ color: '#4F46E5' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                              {invoice.invoiceNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                              {invoice.customer}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem' }}>
                              ${invoice.totalAmount?.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusConfig.label}
                              size="small"
                              sx={{
                                bgcolor: isOverdue ? '#FEE2E2' : statusConfig.bgcolor,
                                color: isOverdue ? '#DC2626' : statusConfig.color,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: '24px'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, invoice.id)}
                              sx={{ color: '#6B7280' }}
                            >
                              <MoreVert sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredInvoices.length === 0 && (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Receipt sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#6B7280', mb: 1 }}>
                    No invoices found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Create invoices from delivered loads'
                    }
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          const invoice = invoices.find(i => i.id === menuInvoiceId);
          handleOpenDialog('view', invoice);
          handleCloseMenu();
        }}>
          <Visibility sx={{ mr: 2, fontSize: 20 }} />
          View Invoice
        </MenuItem>
        <MenuItem onClick={() => {
          const invoice = invoices.find(i => i.id === menuInvoiceId);
          handleOpenDialog('edit', invoice);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 2, fontSize: 20 }} />
          Edit Invoice
        </MenuItem>
        <MenuItem onClick={() => handleSendInvoice(menuInvoiceId)}>
          <Send sx={{ mr: 2, fontSize: 20 }} />
          Send Invoice
        </MenuItem>
        <MenuItem onClick={() => {
          const invoice = invoices.find(i => i.id === menuInvoiceId);
          handleDownloadSinglePDF(invoice);
          handleCloseMenu();
        }}>
          <Print sx={{ mr: 2, fontSize: 20 }} />
          Download PDF
        </MenuItem>
        <MenuItem onClick={() => handleMarkAsPaid(menuInvoiceId)}>
          <CheckCircle sx={{ mr: 2, fontSize: 20 }} />
          Mark as Paid
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteInvoice(menuInvoiceId)}
          sx={{ color: '#DC2626' }}
        >
          <Delete sx={{ mr: 2, fontSize: 20 }} />
          Delete Invoice
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {dialogMode === 'add' ? 'Create New Invoice' : 
               dialogMode === 'edit' ? 'Edit Invoice' : 'Invoice Details'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Invoice Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Invoice Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              {dialogMode === 'add' ? (
                <Autocomplete
                  fullWidth
                  options={getAvailableLoads()}
                  getOptionLabel={(option) => option ? `${option.loadNumber} - ${option.customer}` : ''}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handleLoadSelection(newValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Load"
                      placeholder="Choose a load to invoice..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {option.loadNumber} - {option.customer}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          {option.origin.city} → {option.destination.city} | ${option.rate?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Load Number"
                  value={formData.loadNumber}
                  onChange={(e) => setFormData({ ...formData, loadNumber: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Issue Date"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Customer Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Customer Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Email"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>

            {/* Service Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Service Details
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Description"
                value={formData.serviceDescription}
                onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="e.g., Transportation - Toronto to Vancouver"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.serviceQuantity}
                onChange={(e) => setFormData({ ...formData, serviceQuantity: parseInt(e.target.value) })}
                disabled={dialogMode === 'view'}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rate"
                type="number"
                value={formData.serviceRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value) || 0;
                  setFormData({ 
                    ...formData, 
                    serviceRate: e.target.value,
                    amount: rate * formData.serviceQuantity
                  });
                }}
                disabled={dialogMode === 'view'}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={dialogMode === 'view'}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>

            {/* Summary */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Invoice Summary
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Amount (13% HST)"
                value={calculateTotals().taxAmount}
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Amount"
                value={calculateTotals().totalAmount}
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                sx={{ '& .MuiInputBase-input': { fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
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
                placeholder="Additional notes or payment terms..."
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
              onClick={handleSaveInvoice}
              sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
            >
              {dialogMode === 'add' ? 'Create Invoice' : 'Save Changes'}
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

export default InvoicingManagement;