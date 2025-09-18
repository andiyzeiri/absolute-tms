import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper
} from '@mui/material';
import {
  Person,
  Business,
  Security,
  Notifications,
  Palette,
  Api,
  Save,
  Edit,
  Delete,
  Add,
  Visibility,
  VisibilityOff,
  Camera,
  Lock,
  Close,
  CheckCircle,
  Warning
} from '@mui/icons-material';

const SettingsSection = ({ title, icon, children }) => (
  <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', mb: 3 }}>
    <CardContent sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        {React.cloneElement(icon, { sx: { color: '#4F46E5', mr: 2, fontSize: 24 } })}
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
          {title}
        </Typography>
      </Box>
      {children}
    </CardContent>
  </Card>
);

const Settings = () => {
  const { user } = useAuth();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showPassword, setShowPassword] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');

  // User Profile Settings
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: 'Fleet Manager',
    avatar: null
  });

  // Company Settings
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxNumber: ''
  });

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || user.phoneNumber || '',
        title: user.title || 'Fleet Manager',
        avatar: user.avatar || null
      });

      // Load company name from localStorage first, then fallback to user data
      const savedCompanyName = localStorage.getItem('tms_company_name');
      setCompanyData({
        name: savedCompanyName || user.companyName || '',
        address: user.address?.street || '',
        phone: user.phone || user.phoneNumber || '',
        email: user.email || '',
        website: user.website || '',
        taxNumber: user.taxNumber || ''
      });
    }
  }, [user]);

  // System Preferences
  const [preferences, setPreferences] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    language: 'en',
    timezone: 'America/Toronto',
    currency: 'CAD',
    dateFormat: 'MM/DD/YYYY',
    distanceUnit: 'km'
  });

  // Security Settings
  const [securityData, setSecurityData] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAlerts: true
  });

  // API Keys
  // const [apiKeys, setApiKeys] = useState([
  //   { id: '1', name: 'Google Maps API', key: 'AIza...hidden', status: 'active', lastUsed: '2024-01-15' },
  //   { id: '2', name: 'Weather API', key: 'key_...hidden', status: 'active', lastUsed: '2024-01-14' },
  //   { id: '3', name: 'Fuel API', key: 'fuel...hidden', status: 'inactive', lastUsed: '2024-01-10' }
  // ]);

  const handleSaveProfile = () => {
    setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
  };

  const handleSaveCompany = () => {
    // Save company name to localStorage so it persists across sessions
    localStorage.setItem('tms_company_name', companyData.name);

    // Dispatch custom event to notify other components about company name change
    window.dispatchEvent(new CustomEvent('companyNameUpdated', {
      detail: { companyName: companyData.name }
    }));

    setSnackbar({ open: true, message: 'Company settings updated successfully!', severity: 'success' });
  };

  const handleSavePreferences = () => {
    setSnackbar({ open: true, message: 'Preferences saved successfully!', severity: 'success' });
  };

  const handleSaveSecurity = () => {
    setSnackbar({ open: true, message: 'Security settings updated successfully!', severity: 'success' });
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' }
  ];

  const timezones = [
    'America/Toronto',
    'America/Vancouver',
    'America/Montreal',
    'America/Edmonton',
    'America/Winnipeg',
    'America/Halifax'
  ];

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#6B7280' }}>
          Manage your account, company, and system preferences
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Settings */}
        <Grid item xs={12} lg={8}>
          {/* User Profile Settings */}
          <SettingsSection title="User Profile" icon={<Person />}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      bgcolor: '#4F46E5', 
                      fontSize: '2rem',
                      mb: 2
                    }}
                  >
                    {profileData.firstName[0]}{profileData.lastName[0]}
                  </Avatar>
                  <Button
                    variant="outlined"
                    startIcon={<Camera />}
                    size="small"
                    sx={{ borderColor: '#E5E7EB', color: '#374151' }}
                  >
                    Change Photo
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Job Title"
                      value={profileData.title}
                      onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveProfile}
                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
              >
                Save Profile
              </Button>
            </Box>
          </SettingsSection>

          {/* Company Settings */}
          <SettingsSection title="Company Information" icon={<Business />}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Tax Number"
                  value={companyData.taxNumber}
                  onChange={(e) => setCompanyData({ ...companyData, taxNumber: e.target.value })}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveCompany}
                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
              >
                Save Company Info
              </Button>
            </Box>
          </SettingsSection>

          {/* Preferences */}
          <SettingsSection title="System Preferences" icon={<Palette />}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Display Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.darkMode}
                      onChange={(e) => setPreferences({ ...preferences, darkMode: e.target.checked })}
                    />
                  }
                  label="Dark Mode"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  >
                    {languages.map(lang => (
                      <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  >
                    {timezones.map(tz => (
                      <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  >
                    <MenuItem value="CAD">CAD ($)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Distance Unit</InputLabel>
                  <Select
                    value={preferences.distanceUnit}
                    onChange={(e) => setPreferences({ ...preferences, distanceUnit: e.target.value })}
                  >
                    <MenuItem value="km">Kilometers</MenuItem>
                    <MenuItem value="miles">Miles</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSavePreferences}
                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
              >
                Save Preferences
              </Button>
            </Box>
          </SettingsSection>

          {/* API Integrations */}
          <SettingsSection title="API Integrations" icon={<Api />}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ color: '#6B7280' }}>
                  Manage your API keys and integrations
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('api')}
                  sx={{ borderColor: '#E5E7EB', color: '#374151' }}
                >
                  Add API Key
                </Button>
              </Box>
              <List>
                {/* API Keys list commented out for deployment */}
                <Typography variant="body2" sx={{ color: '#6B7280', p: 2 }}>
                  API Keys configuration will be available after deployment.
                </Typography>
              </List>
            </Box>
          </SettingsSection>
        </Grid>

        {/* Sidebar Settings */}
        <Grid item xs={12} lg={4}>
          {/* Notifications */}
          <SettingsSection title="Notifications" icon={<Notifications />}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.pushNotifications}
                    onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.smsNotifications}
                    onChange={(e) => setPreferences({ ...preferences, smsNotifications: e.target.checked })}
                  />
                }
                label="SMS Notifications"
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Get notified about load updates, driver alerts, and system maintenance.
              </Typography>
            </Box>
          </SettingsSection>

          {/* Security */}
          <SettingsSection title="Security Settings" icon={<Security />}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securityData.twoFactorAuth}
                    onChange={(e) => setSecurityData({ ...securityData, twoFactorAuth: e.target.checked })}
                  />
                }
                label="Two-Factor Authentication"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={securityData.loginAlerts}
                    onChange={(e) => setSecurityData({ ...securityData, loginAlerts: e.target.checked })}
                  />
                }
                label="Login Alerts"
              />
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={securityData.sessionTimeout}
                onChange={(e) => setSecurityData({ ...securityData, sessionTimeout: parseInt(e.target.value) })}
                inputProps={{ min: 15, max: 480 }}
              />
              <Button
                variant="outlined"
                startIcon={<Lock />}
                onClick={() => handleOpenDialog('password')}
                sx={{ borderColor: '#E5E7EB', color: '#374151', justifyContent: 'flex-start' }}
              >
                Change Password
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveSecurity}
                  sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
                >
                  Save Security
                </Button>
              </Box>
            </Box>
          </SettingsSection>

          {/* System Status */}
          <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 3 }}>
                System Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ color: '#10B981', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Database</Typography>
                  </Box>
                  <Chip label="Online" size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669' }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ color: '#10B981', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">API Services</Typography>
                  </Box>
                  <Chip label="Online" size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669' }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Warning sx={{ color: '#F59E0B', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Email Service</Typography>
                  </Box>
                  <Chip label="Limited" size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706' }} />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    Version: v2.1.0 • Last Updated: Jan 15, 2024
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {dialogType === 'password' ? 'Change Password' : 'Add API Key'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {dialogType === 'password' ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField fullWidth label="API Name" placeholder="e.g., Google Maps API" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="API Key" placeholder="Enter your API key" />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  placeholder="Brief description of this API integration"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#6B7280' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
          >
            {dialogType === 'password' ? 'Update Password' : 'Add API Key'}
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

export default Settings;