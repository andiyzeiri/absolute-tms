import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, IconButton, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { Add, Person, Edit, Delete, Mail, Phone, Business } from '@mui/icons-material';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'dispatcher',
    phone: '',
    companyName: ''
  });

  // Demo team members
  const demoTeamMembers = [
    {
      id: 'TM-001',
      firstName: 'John',
      lastName: 'Smith',
      fullName: 'John Smith',
      email: 'john.smith@company.com',
      role: 'admin',
      phone: '+1 (555) 123-4567',
      companyName: 'Your Company',
      status: 'active',
      lastLogin: '2024-01-18T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'TM-002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      role: 'dispatcher',
      phone: '+1 (555) 234-5678',
      companyName: 'Your Company',
      status: 'active',
      lastLogin: '2024-01-17T14:15:00Z',
      createdAt: '2024-01-05T00:00:00Z'
    },
    {
      id: 'TM-003',
      firstName: 'Mike',
      lastName: 'Davis',
      fullName: 'Mike Davis',
      email: 'mike.davis@company.com',
      role: 'driver',
      phone: '+1 (555) 345-6789',
      companyName: 'Your Company',
      status: 'active',
      lastLogin: '2024-01-16T09:45:00Z',
      createdAt: '2024-01-10T00:00:00Z'
    }
  ];

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Authentication required', severity: 'error' });
        return;
      }

      const response = await axios.get(API_ENDPOINTS.TEAM_MEMBERS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTeamMembers(response.data.data.users || []);
      } else {
        throw new Error(response.data.message || 'Failed to load team members');
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load team members',
        severity: 'error'
      });
      // Fallback to demo data for development
      setTeamMembers(demoTeamMembers);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: { bgcolor: '#FEE2E2', color: '#DC2626', label: 'Admin' },
      dispatcher: { bgcolor: '#DBEAFE', color: '#2563EB', label: 'Dispatcher' },
      driver: { bgcolor: '#D1FAE5', color: '#059669', label: 'Driver' },
      customer: { bgcolor: '#FEF3C7', color: '#D97706', label: 'Customer' }
    };
    return colors[role] || colors.driver;
  };

  const handleOpenDialog = (mode, member = null) => {
    setDialogMode(mode);
    setSelectedMember(member);

    if (member && mode === 'edit') {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        password: '',
        role: member.role,
        phone: member.phone || '',
        companyName: member.companyName || ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'dispatcher',
        phone: '',
        companyName: localStorage.getItem('tms_company_name') || 'Your Company'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMember(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'dispatcher',
      phone: '',
      companyName: ''
    });
  };

  const handleSaveMember = async () => {
    try {
      setLoading(true);

      // Basic validation
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
        return;
      }

      if (dialogMode === 'add' && !formData.password) {
        setSnackbar({ open: true, message: 'Password is required for new team members', severity: 'error' });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Authentication required', severity: 'error' });
        return;
      }

      let response;

      if (dialogMode === 'add') {
        // Create new team member
        response = await axios.post(API_ENDPOINTS.CREATE_TEAM_MEMBER, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setSnackbar({ open: true, message: 'Team member added successfully!', severity: 'success' });
          await loadTeamMembers(); // Reload the list
        }
      } else if (dialogMode === 'edit') {
        // Update existing team member
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role
        };

        response = await axios.put(API_ENDPOINTS.UPDATE_TEAM_MEMBER(selectedMember._id), updateData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setSnackbar({ open: true, message: 'Team member updated successfully!', severity: 'success' });
          await loadTeamMembers(); // Reload the list
        }
      }

      handleCloseDialog();

    } catch (error) {
      console.error('Error saving team member:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save team member',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    const member = teamMembers.find(m => m._id === memberId || m.id === memberId);
    const memberName = member ? `${member.firstName} ${member.lastName}` : 'Team Member';

    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Authentication required', severity: 'error' });
        return;
      }

      const response = await axios.delete(API_ENDPOINTS.DELETE_TEAM_MEMBER(memberId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSnackbar({ open: true, message: `${memberName} removed successfully!`, severity: 'success' });
        await loadTeamMembers(); // Reload the list
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to remove team member',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    const fullName = member.fullName || `${member.firstName} ${member.lastName}`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterRole === 'all' || member.role === filterRole;

    return matchesSearch && matchesFilter;
  });

  return (
    <Box sx={{ p: 4, bgcolor: '#F5F7FA', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
              Team Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Manage team members and their access to the TMS system
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('add')}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
          >
            Add Team Member
          </Button>
        </Box>

        {/* Search and Filter Card */}
        <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Person sx={{ color: '#9CA3AF', mr: 1 }} />
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB' } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Role Filter</InputLabel>
                  <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    sx={{ bgcolor: '#F9FAFB' }}
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="dispatcher">Dispatcher</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="customer">Customer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography variant="body2" sx={{ textAlign: 'center', color: '#6B7280' }}>
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Team Members Table */}
      <Card sx={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Last Login</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const roleInfo = getRoleColor(member.role);
                    return (
                      <TableRow key={member._id || member.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{
                              width: 40,
                              height: 40,
                              bgcolor: '#4F46E5',
                              mr: 2,
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}>
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827' }}>
                                {member.fullName || `${member.firstName} ${member.lastName}`}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                ID: {member._id || member.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Mail sx={{ fontSize: 16, color: '#6B7280', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: '#374151' }}>
                                {member.email}
                              </Typography>
                            </Box>
                            {member.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Phone sx={{ fontSize: 16, color: '#6B7280', mr: 1 }} />
                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                  {member.phone}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={roleInfo.label}
                            sx={{
                              bgcolor: roleInfo.bgcolor,
                              color: roleInfo.color,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#374151' }}>
                            {member.lastLogin ?
                              new Date(member.lastLogin).toLocaleDateString() :
                              'Never'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('edit', member)}
                              sx={{ color: '#4F46E5' }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMember(member._id || member.id)}
                              sx={{ color: '#DC2626' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                      <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
                        No team members found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                        Try adjusting your search or filter criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Member Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Team Member' : 'Edit Team Member'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={dialogMode === 'add' ? "Password" : "New Password (leave blank to keep current)"}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={dialogMode === 'add'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="dispatcher">Dispatcher</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="customer">Customer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #E5E7EB', bgcolor: '#F9FAFB' }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#6B7280' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveMember}
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
          >
            {loading ? 'Saving...' : (dialogMode === 'add' ? 'Add Member' : 'Save Changes')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default TeamManagement;