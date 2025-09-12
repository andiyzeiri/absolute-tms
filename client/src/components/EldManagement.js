import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  MenuItem,
  Alert,
  Pagination,
  CircularProgress,
  Tooltip,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Speed,
  DirectionsCar,
  AccessTime,
  Warning,
  CheckCircle,
  Pending,
  Assessment,
  Sync,
  CloudSync,
  DeviceHub,
  Schedule,
  TrendingUp,
  Stop,
  Hotel,
  Build
} from '@mui/icons-material';
import axios from 'axios';

const EldManagement = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [driverLogs, setDriverLogs] = useState([]);
  const [eldDevices, setEldDevices] = useState([]);
  const [complianceData, setComplianceData] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    driverId: '',
    status: '',
    violationsOnly: false
  });
  
  // Dialog states
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDialog, setShowLogDialog] = useState(false);
  // const [selectedDevice, setSelectedDevice] = useState(null);
  // const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  
  // Alerts
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  // Load initial data
  useEffect(() => {
    loadEldData();
    loadServiceStatus();
  }, []);

  // Reload data when filters or pagination change
  useEffect(() => {
    if (activeTab === 0) loadDriverLogs();
    else if (activeTab === 1) loadEldDevices();
    else if (activeTab === 2) loadComplianceReport();
  }, [activeTab, page, filters, loadEldData, loadDriverLogs, loadComplianceReport]);

  const loadEldData = async () => {
    await Promise.all([
      loadDriverLogs(),
      loadEldDevices(),
      loadComplianceReport(),
      loadServiceStatus()
    ]);
  };

  const loadDriverLogs = async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 25,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== false) delete params[key];
      });
      
      const response = await axios.get('/api/eld/logs', { params });
      
      if (response.data.success) {
        setDriverLogs(response.data.data.logs);
        setTotalPages(response.data.data.pagination.totalPages);
      }
      
    } catch (error) {
      console.error('Error loading driver logs:', error);
      showAlert('Failed to load driver logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEldDevices = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/eld/devices', {
        params: { page, limit: 20 }
      });
      
      if (response.data.success) {
        setEldDevices(response.data.data.devices);
        setTotalPages(response.data.data.pagination.totalPages);
      }
      
    } catch (error) {
      console.error('Error loading ELD devices:', error);
      showAlert('Failed to load ELD devices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceReport = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/eld/compliance/report', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      });
      
      if (response.data.success) {
        setComplianceData(response.data.data);
      }
      
    } catch (error) {
      console.error('Error loading compliance report:', error);
      showAlert('Failed to load compliance report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceStatus = async () => {
    try {
      const response = await axios.get('/api/eld/status');
      
      if (response.data.success) {
        setServiceStatus(response.data.data);
      }
      
    } catch (error) {
      console.error('Error loading service status:', error);
    }
  };

  const testEldConnection = async () => {
    try {
      setTestingConnection(true);
      
      const response = await axios.get('/api/eld/test-connection');
      
      if (response.data.success) {
        showAlert('ELD connection successful!', 'success');
        await loadServiceStatus();
      } else {
        showAlert(`Connection failed: ${response.data.message}`, 'error');
      }
      
    } catch (error) {
      console.error('Error testing ELD connection:', error);
      showAlert('Connection test failed: ' + error.message, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const syncAllDrivers = async () => {
    try {
      setSyncing(true);
      showAlert('Starting sync for all drivers...', 'info');
      
      const response = await axios.post('/api/eld/sync-all');
      
      if (response.data.success) {
        const { successCount, errorCount } = response.data.data;
        showAlert(
          `Sync completed: ${successCount} successful, ${errorCount} errors`,
          successCount > 0 ? 'success' : 'warning'
        );
        
        await loadDriverLogs();
      } else {
        showAlert(`Sync failed: ${response.data.message}`, 'error');
      }
      
    } catch (error) {
      console.error('Error syncing drivers:', error);
      showAlert('Sync failed: ' + error.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const approveLog = async (logId, status, notes = '') => {
    try {
      const response = await axios.put(`/api/eld/logs/${logId}/approve`, {
        status,
        notes
      });
      
      if (response.data.success) {
        showAlert(`Log ${status.toLowerCase()} successfully`, 'success');
        await loadDriverLogs();
        setShowLogDialog(false);
      }
      
    } catch (error) {
      console.error('Error approving log:', error);
      showAlert('Failed to update log status', 'error');
    }
  };

  // Utility functions
  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US');
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'SUBMITTED': return 'primary';
      case 'DRAFT': return 'warning';
      case 'REJECTED': return 'error';
      case 'REQUIRES_REVIEW': return 'warning';
      default: return 'default';
    }
  };

  const getDutyStatusIcon = (status) => {
    switch (status) {
      case 'DRIVING': return <DirectionsCar />;
      case 'ON_DUTY_NOT_DRIVING': return <AccessTime />;
      case 'OFF_DUTY': return <Stop />;
      case 'SLEEPER_BERTH': return <Hotel />;
      default: return <Pending />;
    }
  };

  const getDutyStatusColor = (status) => {
    switch (status) {
      case 'DRIVING': return 'primary';
      case 'ON_DUTY_NOT_DRIVING': return 'warning';
      case 'OFF_DUTY': return 'success';
      case 'SLEEPER_BERTH': return 'info';
      default: return 'default';
    }
  };

  const getDeviceHealthColor = (health) => {
    if (health >= 90) return 'success';
    if (health >= 70) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#059669' }}>
          <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
          ELD Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={testingConnection ? <CircularProgress size={20} /> : <CloudSync />}
            onClick={testEldConnection}
            disabled={testingConnection}
            sx={{ borderColor: '#059669', color: '#059669' }}
          >
            Test Connection
          </Button>
          
          <Button
            variant="contained"
            startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
            onClick={syncAllDrivers}
            disabled={syncing}
            sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
          >
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </Box>
      </Box>

      {/* Service Status Cards */}
      {serviceStatus && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CloudSync sx={{ color: serviceStatus.service.initialized ? '#059669' : '#ef4444', mr: 1 }} />
                  <Typography variant="h6">Service Status</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {serviceStatus.service.initialized ? 'Connected' : 'Disconnected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Token: {serviceStatus.service.tokenValid ? 'Valid' : 'Invalid'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment sx={{ color: '#059669', mr: 1 }} />
                  <Typography variant="h6">Total Logs</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {serviceStatus.database.totalLogs?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DeviceHub sx={{ color: '#059669', mr: 1 }} />
                  <Typography variant="h6">ELD Devices</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {serviceStatus.database.totalDevices?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Warning sx={{ color: '#ef4444', mr: 1 }} />
                  <Typography variant="h6">Recent Violations</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {serviceStatus.database.recentViolations || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 7 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Driver Logs" />
          <Tab label="ELD Devices" />
          <Tab label="Compliance Report" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Card>
          {/* Driver Logs Filters */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Status"
                  select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="REQUIRES_REVIEW">Requires Review</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  onClick={() => setFilters({ startDate: '', endDate: '', driverId: '', status: '', violationsOnly: false })}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Driver Logs Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Current Status</TableCell>
                  <TableCell align="right">Drive Time</TableCell>
                  <TableCell align="right">Duty Time</TableCell>
                  <TableCell>Violations</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : driverLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No driver logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  driverLogs.map((log) => (
                    <TableRow key={log._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(log.logDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.formattedLogDate}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.driverId?.firstName} {log.driverId?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.driverId?.email}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {log.vehicleId?.vehicleNumber || log.vehicleNumber || 'N/A'}
                        </Typography>
                        {log.vehicleId && (
                          <Typography variant="caption" color="text.secondary">
                            {log.vehicleId.make} {log.vehicleId.model}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={getDutyStatusIcon(log.currentStatus)}
                          label={log.currentStatus?.replace('_', ' ') || 'OFF DUTY'}
                          color={getDutyStatusColor(log.currentStatus)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatTime(log.totalDriveTime || 0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((log.totalDriveTime || 0) / 660 * 100, 100)}
                          color={(log.totalDriveTime || 0) > 660 ? 'error' : 'primary'}
                          sx={{ mt: 0.5, width: 60 }}
                        />
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatTime(log.totalDutyTime || 0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((log.totalDutyTime || 0) / 840 * 100, 100)}
                          color={(log.totalDutyTime || 0) > 840 ? 'error' : 'primary'}
                          sx={{ mt: 0.5, width: 60 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Tooltip title={`${log.violations?.length || 0} violations`}>
                          <Badge badgeContent={log.violations?.length || 0} color="error">
                            <Chip
                              icon={log.hasViolations ? <Warning /> : <CheckCircle />}
                              label={log.hasViolations ? 'Violations' : 'Compliant'}
                              color={log.hasViolations ? 'error' : 'success'}
                              size="small"
                            />
                          </Badge>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={getStatusColor(log.status)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowLogDialog(true);
                          }}
                        >
                          <Assessment />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Card>
      )}

      {/* ELD Devices Tab */}
      {activeTab === 1 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Health</TableCell>
                  <TableCell>Last Communication</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : eldDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No ELD devices found
                    </TableCell>
                  </TableRow>
                ) : (
                  eldDevices.map((device) => (
                    <TableRow key={device._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {device.deviceId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          S/N: {device.serialNumber}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {device.vehicleId ? (
                          <>
                            <Typography variant="body2">
                              {device.vehicleId.vehicleNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {device.vehicleId.make} {device.vehicleId.model}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {device.provider}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {device.model}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={device.status}
                          color={device.status === 'ACTIVE' ? 'success' : 'error'}
                          size="small"
                        />
                        <br />
                        <Chip
                          label={device.connectionStatus}
                          color={device.connectionStatus === 'CONNECTED' ? 'success' : 'error'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={device.healthScore || 0}
                            color={getDeviceHealthColor(device.healthScore || 0)}
                            sx={{ width: 60, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {device.healthScore || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {device.lastCommunication 
                            ? formatDateTime(device.lastCommunication)
                            : 'Never'
                          }
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDevice(device);
                            setShowDeviceDialog(true);
                          }}
                        >
                          <Build />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Compliance Report Tab */}
      {activeTab === 2 && complianceData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Database Compliance Summary
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Assessment /></ListItemIcon>
                    <ListItemText
                      primary="Total Logs"
                      secondary={complianceData.databaseReport.totalLogs?.toLocaleString() || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning /></ListItemIcon>
                    <ListItemText
                      primary="Logs with Violations"
                      secondary={complianceData.databaseReport.logsWithViolations || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUp /></ListItemIcon>
                    <ListItemText
                      primary="Compliance Rate"
                      secondary={`${Math.round(complianceData.databaseReport.complianceRate || 0)}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Schedule /></ListItemIcon>
                    <ListItemText
                      primary="Average Drive Time"
                      secondary={`${complianceData.databaseReport.avgDriveTime || 0} hours`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Violations
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {complianceData.recentViolations?.slice(0, 10).map((violation, index) => (
                    <React.Fragment key={violation._id}>
                      <ListItem>
                        <ListItemIcon>
                          <Warning color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${violation.driverId?.firstName} ${violation.driverId?.lastName}`}
                          secondary={`${formatDate(violation.logDate)} - ${violation.violations?.length} violations`}
                        />
                      </ListItem>
                      {index < Math.min(complianceData.recentViolations.length - 1, 9) && <Divider />}
                    </React.Fragment>
                  )) || (
                    <ListItem>
                      <ListItemText primary="No recent violations" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Log Detail Dialog */}
      <Dialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Driver Log Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Driver</Typography>
                <Typography variant="body1">
                  {selectedLog.driverId?.firstName} {selectedLog.driverId?.lastName}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Log Date</Typography>
                <Typography variant="body1">{formatDate(selectedLog.logDate)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Drive Time</Typography>
                <Typography variant="body1">{formatTime(selectedLog.totalDriveTime || 0)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Duty Time</Typography>
                <Typography variant="body1">{formatTime(selectedLog.totalDutyTime || 0)}</Typography>
              </Grid>
              
              {selectedLog.violations && selectedLog.violations.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Violations</Typography>
                  {selectedLog.violations.map((violation, index) => (
                    <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {violation.violationType?.replace('_', ' ')}
                      </Typography>
                      <Typography variant="body2">{violation.description}</Typography>
                    </Alert>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogDialog(false)}>
            Close
          </Button>
          {selectedLog && selectedLog.status === 'SUBMITTED' && (
            <>
              <Button
                color="success"
                variant="contained"
                onClick={() => approveLog(selectedLog._id, 'APPROVED')}
              >
                Approve
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={() => approveLog(selectedLog._id, 'REJECTED')}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EldManagement;