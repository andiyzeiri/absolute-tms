import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Badge,
  IconButton
} from '@mui/material';
import {
  Dashboard,
  LocalShipping,
  DirectionsCar,
  People,
  Receipt,
  Description,
  Settings,
  Notifications,
  Business,
  Group,
  Payment,
  LocalGasStation,
  Speed,
  Email
} from '@mui/icons-material';

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: 'dashboard' },
  { text: 'Loads', icon: <LocalShipping />, path: 'trips' },
  { text: 'Fleet', icon: <DirectionsCar />, path: 'vehicles' },
  { text: 'Drivers', icon: <People />, path: 'drivers', adminOnly: true },
  { text: 'Brokers', icon: <Business />, path: 'brokers' },
  { text: 'Customers', icon: <Group />, path: 'customers' },
  { text: 'Invoicing', icon: <Receipt />, path: 'invoices' },
  { text: 'Payroll', icon: <Payment />, path: 'payroll', adminOnly: true },
  { text: 'Fuel Management', icon: <LocalGasStation />, path: 'fuel' },
  { text: 'ELD Management', icon: <Speed />, path: 'eld' },
  { text: 'Email Integration', icon: <Email />, path: 'email' },
  { text: 'Rate Confirmations', icon: <Description />, path: 'rate-confirmations' },
  { text: 'Settings', icon: <Settings />, path: 'settings' }
];

const Sidebar = ({ currentPage, onPageChange, user }) => {
  const { logout } = useAuth();
  const [companyName, setCompanyName] = useState(() => {
    // Load company name from localStorage or fallback to user data
    return localStorage.getItem('tms_company_name') || user?.companyName || user?.company?.name || 'Your Company';
  });

  useEffect(() => {
    // Listen for company name updates
    const handleCompanyNameUpdate = (event) => {
      setCompanyName(event.detail.companyName);
    };

    window.addEventListener('companyNameUpdated', handleCompanyNameUpdate);

    // Cleanup listener
    return () => {
      window.removeEventListener('companyNameUpdated', handleCompanyNameUpdate);
    };
  }, []);

  // Update company name when user changes
  useEffect(() => {
    const savedCompanyName = localStorage.getItem('tms_company_name');
    if (savedCompanyName) {
      setCompanyName(savedCompanyName);
    } else if (user?.companyName) {
      setCompanyName(user.companyName);
    } else if (user?.company?.name) {
      setCompanyName(user.company.name);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  const filteredItems = menuItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <Box sx={{ 
      width: 280, 
      height: '100vh', 
      bgcolor: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Section */}
      <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: '#059669', 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2
          }}>
            <LocalShipping sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', lineHeight: 1 }}>
              {companyName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
              Transportation Management
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="caption" sx={{ 
            color: '#9CA3AF', 
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            px: 2,
            mb: 1,
            display: 'block'
          }}>
            Navigation
          </Typography>
        </Box>

        <List sx={{ px: 2, '& .MuiListItem-root': { px: 0, mb: 1 } }}>
          {filteredItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => onPageChange(item.path)}
                selected={currentPage === item.path}
                sx={{
                  borderRadius: '8px',
                  minHeight: 44,
                  '&.Mui-selected': {
                    bgcolor: '#ECFDF5',
                    color: '#059669',
                    '& .MuiListItemIcon-root': {
                      color: '#059669',
                    },
                    '&:hover': {
                      bgcolor: '#D1FAE5'
                    }
                  },
                  '&:hover': {
                    bgcolor: '#F9FAFB'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: currentPage === item.path ? '#059669' : '#6B7280'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: currentPage === item.path ? 600 : 500,
                    color: currentPage === item.path ? '#059669' : '#374151'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: 3, borderTop: '1px solid #E5E7EB' }}>
        {/* Notifications */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <IconButton size="small" sx={{ 
            bgcolor: '#F9FAFB', 
            border: '1px solid #E5E7EB',
            '&:hover': { bgcolor: '#F3F4F6' }
          }}>
            <Badge badgeContent={3} color="secondary" variant="dot">
              <Notifications sx={{ fontSize: 20, color: '#6B7280' }} />
            </Badge>
          </IconButton>
        </Box>

        {/* User Profile */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: '#F9FAFB',
          borderRadius: '12px',
          p: 2,
          border: '1px solid #E5E7EB',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: '#F3F4F6'
          }
        }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: '#059669',
            fontSize: '0.875rem',
            fontWeight: 600,
            mr: 2
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              color: '#111827',
              fontSize: '0.875rem',
              lineHeight: 1.2
            }}>
              {user?.fullName || 'Demo User'}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: '#6B7280',
              fontSize: '0.75rem',
              textTransform: 'capitalize'
            }}>
              {user?.role || 'Administrator'}
            </Typography>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            sx={{ 
              flex: 1,
              bgcolor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              py: 1,
              '&:hover': { bgcolor: '#F3F4F6' }
            }}
          >
            <Settings sx={{ fontSize: 18, color: '#6B7280' }} />
          </IconButton>
          <IconButton 
            size="small"
            onClick={handleLogout}
            sx={{ 
              flex: 1,
              bgcolor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              py: 1,
              color: '#DC2626',
              '&:hover': { 
                bgcolor: '#FEE2E2',
                borderColor: '#FCA5A5'
              }
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Sign Out
            </Typography>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;