import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Google as GoogleIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const EmailIntegration = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [authDialog, setAuthDialog] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [previewDialog, setPreviewDialog] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  const [searchQuery, setSearchQuery] = useState('');
  const [autoProcessDialog, setAutoProcessDialog] = useState(false);
  const [autoProcessSettings, setAutoProcessSettings] = useState({
    minConfidence: 70,
    dryRun: false
  });
  const [autoProcessResults, setAutoProcessResults] = useState(null);

  useEffect(() => {
    // Check if we have stored tokens
    const storedTokens = localStorage.getItem('gmail_tokens');
    if (storedTokens) {
      setStoredTokens();
    }
  }, []);

  const initializeGmail = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gmail/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setAuthUrl(data.authUrl);
        setAuthDialog(true);
        showAlert('Please authorize the application to access your Gmail', 'info');
      } else {
        showAlert(data.message, 'error');
      }
    } catch (error) {
      console.error('Error initializing Gmail:', error);
      showAlert('Failed to initialize Gmail integration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithCode = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gmail/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode })
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('gmail_tokens', JSON.stringify(data.tokens));
        setIsAuthenticated(true);
        setAuthDialog(false);
        setAuthCode('');
        showAlert('Gmail authentication successful!', 'success');
        fetchEmails();
      } else {
        showAlert(data.message, 'error');
      }
    } catch (error) {
      console.error('Error authenticating:', error);
      showAlert('Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setStoredTokens = async () => {
    try {
      const tokens = JSON.parse(localStorage.getItem('gmail_tokens'));
      const response = await fetch('/api/gmail/set-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        fetchEmails();
      }
    } catch (error) {
      console.error('Error setting stored tokens:', error);
    }
  };

  const fetchEmails = async (customQuery = '') => {
    try {
      setLoading(true);
      const queryParam = customQuery || searchQuery;
      const url = queryParam
        ? `/api/gmail/emails?query=${encodeURIComponent(queryParam)}`
        : '/api/gmail/emails';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setEmails(data.emails);
        const message = queryParam
          ? `Found ${data.emails.length} emails for query: "${queryParam}"`
          : `Found ${data.emails.length} potential load emails`;
        showAlert(message, 'success');
      } else {
        showAlert(data.message, 'error');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      showAlert('Failed to fetch emails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createLoadFromEmail = async (emailData, overrides = {}) => {
    try {
      setLoading(true);
      const response = await fetch('/api/gmail/create-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: emailData.email.id,
          loadData: emailData.loadData,
          overrides
        })
      });

      const data = await response.json();
      if (data.success) {
        showAlert('Load created successfully!', 'success');

        // Add the new load to localStorage so it shows up in LoadManagement
        const savedLoads = localStorage.getItem('tms_loads');
        const currentLoads = savedLoads ? JSON.parse(savedLoads) : [];

        // Convert MongoDB load format to frontend format
        const newLoad = {
          id: data.load._id,
          loadNumber: data.load.loadNumber,
          customer: data.load.customer,
          origin: data.load.origin,
          destination: data.load.destination,
          driver: data.load.driver,
          vehicle: data.load.vehicle,
          status: data.load.status,
          pickupDate: new Date(data.load.pickupDate).toISOString().split('T')[0],
          deliveryDate: new Date(data.load.deliveryDate).toISOString().split('T')[0],
          deliveryTime: data.load.deliveryTime || '',
          rate: data.load.rate,
          weight: data.load.weight,
          commodity: data.load.commodity,
          notes: data.load.notes || '',
          proofOfDelivery: data.load.proofOfDelivery || [],
          rateConfirmation: data.load.rateConfirmation || [],
          emailId: data.load.emailId,
          emailSubject: data.load.emailSubject,
          emailFrom: data.load.emailFrom
        };

        // Add to the beginning of the array (most recent first)
        currentLoads.unshift(newLoad);
        localStorage.setItem('tms_loads', JSON.stringify(currentLoads));

        // Trigger event to notify LoadManagement component
        window.dispatchEvent(new CustomEvent('loadsUpdated'));

        setEditDialog(false);
        // Remove the email from the list since it's been processed
        setEmails(emails.filter(e => e.email.id !== emailData.email.id));
      } else {
        showAlert(data.message, 'error');
      }
    } catch (error) {
      console.error('Error creating load:', error);
      showAlert('Failed to create load', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLoad = (emailData) => {
    setSelectedEmail(emailData);
    setEditData({ ...emailData.loadData });
    setEditDialog(true);
  };

  const handlePreviewEmail = (emailData) => {
    setSelectedEmail(emailData);
    setPreviewDialog(true);
  };

  const autoProcessEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gmail/auto-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoProcessSettings)
      });

      const data = await response.json();
      if (data.success) {
        setAutoProcessResults(data.results);
        showAlert(data.message, 'success');
        if (!autoProcessSettings.dryRun && data.results.created > 0) {
          // Add created loads to localStorage
          const savedLoads = localStorage.getItem('tms_loads');
          const currentLoads = savedLoads ? JSON.parse(savedLoads) : [];

          // Convert and add each created load
          data.results.createdLoads.forEach(loadInfo => {
            const newLoad = {
              id: loadInfo.id,
              loadNumber: loadInfo.loadNumber,
              customer: loadInfo.customer,
              origin: loadInfo.origin,
              destination: loadInfo.destination,
              driver: loadInfo.driver,
              vehicle: loadInfo.vehicle,
              status: loadInfo.status,
              pickupDate: loadInfo.pickupDate,
              deliveryDate: loadInfo.deliveryDate,
              deliveryTime: loadInfo.deliveryTime || '',
              rate: loadInfo.rate,
              weight: loadInfo.weight,
              commodity: loadInfo.commodity,
              notes: loadInfo.notes || '',
              proofOfDelivery: [],
              rateConfirmation: [],
              emailId: loadInfo.emailId,
              emailSubject: loadInfo.emailSubject || '',
              emailFrom: loadInfo.emailFrom || ''
            };
            currentLoads.unshift(newLoad);
          });

          localStorage.setItem('tms_loads', JSON.stringify(currentLoads));

          // Trigger event to notify LoadManagement component
          window.dispatchEvent(new CustomEvent('loadsUpdated'));

          // Refresh email list to show processed status
          fetchEmails();
        }
      } else {
        showAlert(data.message, 'error');
      }
    } catch (error) {
      console.error('Error auto-processing emails:', error);
      showAlert('Auto-processing failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return '#10B981'; // Green
    if (confidence >= 40) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 70) return 'High';
    if (confidence >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F5F7FA', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
            Email Integration
          </Typography>
          <Typography variant="body1" sx={{ color: '#6B7280' }}>
            Automatically create loads from emails
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isAuthenticated && (
            <TextField
              size="small"
              placeholder="Search emails (e.g., ND9, amazon, 2025)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchEmails(searchQuery);
                }
              }}
              sx={{ minWidth: 250 }}
            />
          )}
          {isAuthenticated ? (
            <>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => fetchEmails()}
                disabled={loading}
                sx={{ bgcolor: '#4F46E5' }}
              >
                Refresh Emails
              </Button>
              {searchQuery && (
                <Button
                  variant="outlined"
                  onClick={() => fetchEmails(searchQuery)}
                  disabled={loading}
                >
                  Search
                </Button>
              )}
              <Button
                variant="contained"
                onClick={() => setAutoProcessDialog(true)}
                disabled={loading}
                sx={{ bgcolor: '#059669' }}
              >
                Auto Process
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={initializeGmail}
              disabled={loading}
              sx={{ bgcolor: '#4285F4' }}
            >
              Connect Gmail
            </Button>
          )}
        </Box>
      </Box>

      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Authentication Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmailIcon sx={{ fontSize: 28, color: isAuthenticated ? '#10B981' : '#6B7280' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Gmail Connection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {isAuthenticated ? 'Connected' : 'Not Connected'}
              </Typography>
            </Box>
            {isAuthenticated && (
              <Chip label="Active" size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669' }} />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Email List */}
      {isAuthenticated && emails.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Potential Load Emails ({emails.length})
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Load Info</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emails.map((emailData, index) => (
                    <TableRow key={emailData.email.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {emailData.email.subject.length > 50
                              ? `${emailData.email.subject.substring(0, 50)}...`
                              : emailData.email.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(emailData.email.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {emailData.loadData.customer || 'Unknown'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box>
                          {emailData.loadData.loadNumber && (
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              #{emailData.loadData.loadNumber}
                            </Typography>
                          )}
                          {emailData.loadData.rate > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              ${emailData.loadData.rate.toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          {emailData.loadData.origin?.city && (
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {emailData.loadData.origin.city}, {emailData.loadData.origin.province}
                            </Typography>
                          )}
                          {emailData.loadData.destination?.city && (
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              → {emailData.loadData.destination.city}, {emailData.loadData.destination.province}
                            </Typography>
                          )}
                          {emailData.loadData.deliveryTime && (
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#059669', fontWeight: 500 }}>
                              {emailData.loadData.deliveryTime}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={`${emailData.confidence}% ${getConfidenceLabel(emailData.confidence)}`}
                          size="small"
                          sx={{
                            bgcolor: `${getConfidenceColor(emailData.confidence)}20`,
                            color: getConfidenceColor(emailData.confidence),
                            fontWeight: 600
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Preview Email">
                            <IconButton
                              size="small"
                              onClick={() => handlePreviewEmail(emailData)}
                            >
                              <PreviewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit & Create Load">
                            <IconButton
                              size="small"
                              onClick={() => handleEditLoad(emailData)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          {emailData.confidence >= 70 && (
                            <Tooltip title="Create Load (Auto)">
                              <IconButton
                                size="small"
                                onClick={() => createLoadFromEmail(emailData)}
                                sx={{ color: '#10B981' }}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* No Emails Message */}
      {isAuthenticated && emails.length === 0 && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <EmailIcon sx={{ fontSize: 64, color: '#9CA3AF', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No Load Emails Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Refresh Emails" to check for new load-related emails
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Auth Dialog */}
      <Dialog open={authDialog} onClose={() => setAuthDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GoogleIcon sx={{ color: '#4285F4' }} />
            Gmail Authentication
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            1. Click the link below to authorize Gmail access
            <br />
            2. After clicking "Allow", Google will display an authorization code
            <br />
            3. Copy the authorization code and paste it in the field below
          </Typography>

          <Button
            variant="outlined"
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mb: 3, display: 'block', bgcolor: '#4285F4', color: 'white', '&:hover': { bgcolor: '#3367D6' } }}
          >
            🔗 Authorize Gmail Access
          </Button>

          <TextField
            fullWidth
            label="Authorization Code"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            placeholder="Paste authorization code here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={authenticateWithCode}
            disabled={!authCode || loading}
          >
            Authenticate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Load Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Edit Load Data
            <IconButton onClick={() => setEditDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEmail && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Email: {selectedEmail.email.subject}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                From: {selectedEmail.email.from} | {new Date(selectedEmail.email.date).toLocaleString()}
              </Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Load Number"
                value={editData.loadNumber || ''}
                onChange={(e) => setEditData({ ...editData, loadNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer"
                value={editData.customer || ''}
                onChange={(e) => setEditData({ ...editData, customer: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Origin City"
                value={editData.origin?.city || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  origin: { ...editData.origin, city: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Origin Province"
                value={editData.origin?.province || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  origin: { ...editData.origin, province: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Destination City"
                value={editData.destination?.city || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  destination: { ...editData.destination, city: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Destination Province"
                value={editData.destination?.province || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  destination: { ...editData.destination, province: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pickup Date"
                type="date"
                value={editData.pickupDate || ''}
                onChange={(e) => setEditData({ ...editData, pickupDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Date"
                type="date"
                value={editData.deliveryDate || ''}
                onChange={(e) => setEditData({ ...editData, deliveryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rate ($)"
                type="number"
                value={editData.rate || ''}
                onChange={(e) => setEditData({ ...editData, rate: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Weight"
                value={editData.weight || ''}
                onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Commodity"
                value={editData.commodity || ''}
                onChange={(e) => setEditData({ ...editData, commodity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createLoadFromEmail(selectedEmail, editData)}
            disabled={loading}
          >
            Create Load
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Email Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Email Preview
        </DialogTitle>
        <DialogContent>
          {selectedEmail && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {selectedEmail.email.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From: {selectedEmail.email.from}
                  <br />
                  Date: {new Date(selectedEmail.email.date).toLocaleString()}
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Extracted Load Data:
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Load Number"
                    value={selectedEmail.loadData.loadNumber || 'Not found'}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer"
                    value={selectedEmail.loadData.customer || 'Not found'}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Origin"
                    value={selectedEmail.loadData.origin?.city
                      ? `${selectedEmail.loadData.origin.city}, ${selectedEmail.loadData.origin.province}`
                      : 'Not found'}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Destination"
                    value={selectedEmail.loadData.destination?.city
                      ? `${selectedEmail.loadData.destination.city}, ${selectedEmail.loadData.destination.province}`
                      : 'Not found'}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={selectedEmail.loadData.notes || 'None'}
                    InputProps={{ readOnly: true }}
                    multiline
                    rows={3}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          {selectedEmail && (
            <Button
              variant="contained"
              onClick={() => {
                setPreviewDialog(false);
                handleEditLoad(selectedEmail);
              }}
            >
              Edit & Create Load
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Auto Process Dialog */}
      <Dialog
        open={autoProcessDialog}
        onClose={() => setAutoProcessDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Auto Process Emails</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: '#6B7280' }}>
            Automatically process the last 100 emails and create loads with high confidence scores.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Minimum Confidence (%)"
                type="number"
                value={autoProcessSettings.minConfidence}
                onChange={(e) => setAutoProcessSettings({
                  ...autoProcessSettings,
                  minConfidence: parseInt(e.target.value) || 70
                })}
                inputProps={{ min: 0, max: 100 }}
                helperText="Only create loads for emails with confidence above this threshold"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={autoProcessSettings.dryRun}
                    onChange={(e) => setAutoProcessSettings({
                      ...autoProcessSettings,
                      dryRun: e.target.checked
                    })}
                  />
                }
                label="Dry Run (preview only, don't create loads)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoProcessDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setAutoProcessDialog(false);
              autoProcessEmails();
            }}
            disabled={loading}
            sx={{ bgcolor: '#059669' }}
          >
            {autoProcessSettings.dryRun ? 'Preview' : 'Process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auto Process Results Dialog */}
      <Dialog
        open={!!autoProcessResults}
        onClose={() => setAutoProcessResults(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Auto Process Results
          <IconButton
            onClick={() => setAutoProcessResults(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {autoProcessResults && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#059669', fontWeight: 'bold' }}>
                        {autoProcessResults.created}
                      </Typography>
                      <Typography variant="body2">Created</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#F59E0B', fontWeight: 'bold' }}>
                        {autoProcessResults.skipped}
                      </Typography>
                      <Typography variant="body2">Skipped</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#EF4444', fontWeight: 'bold' }}>
                        {autoProcessResults.errors}
                      </Typography>
                      <Typography variant="body2">Errors</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#4F46E5', fontWeight: 'bold' }}>
                        {autoProcessResults.processed}
                      </Typography>
                      <Typography variant="body2">Total</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {autoProcessResults.createdLoads.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {autoProcessResults.createdLoads[0].dryRun ? 'Would Create' : 'Created'} Loads
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Load Number</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Destination</TableCell>
                          <TableCell>Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {autoProcessResults.createdLoads.map((load, index) => (
                          <TableRow key={index}>
                            <TableCell>{load.loadNumber}</TableCell>
                            <TableCell>{load.customer}</TableCell>
                            <TableCell>{load.destination}</TableCell>
                            <TableCell>
                              <Chip
                                label={`${load.confidence}%`}
                                size="small"
                                sx={{
                                  bgcolor: getConfidenceColor(load.confidence),
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {autoProcessResults.skippedEmails.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Skipped Emails
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Subject</TableCell>
                          <TableCell>Confidence</TableCell>
                          <TableCell>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {autoProcessResults.skippedEmails.slice(0, 10).map((email, index) => (
                          <TableRow key={index}>
                            <TableCell>{email.subject}</TableCell>
                            <TableCell>
                              {email.confidence && (
                                <Chip
                                  label={`${email.confidence}%`}
                                  size="small"
                                  sx={{
                                    bgcolor: getConfidenceColor(email.confidence),
                                    color: 'white'
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell>{email.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {autoProcessResults.skippedEmails.length > 10 && (
                    <Typography variant="body2" sx={{ mt: 1, color: '#6B7280' }}>
                      And {autoProcessResults.skippedEmails.length - 10} more...
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoProcessResults(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailIntegration;