import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Avatar,
  AvatarGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  LocalShipping,
  People,
  DirectionsCar,
  Receipt,
  TrendingUp,
  MoreVert,
  Add,
  FilterList,
  Download,
  Timeline,
  CheckCircle,
  Schedule,
  Warning
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const MetricCard = ({ title, value, change, changeColor, compareText = "vs last month" }) => (
  <Card sx={{ 
    height: '100%', 
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    '&:hover': {
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box>
        <Typography variant="body2" sx={{ color: '#6B7280', mb: 1, fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
          {value}
        </Typography>
        {change && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: changeColor, fontWeight: 600 }}>
              {change}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', ml: 1 }}>
              {compareText}
            </Typography>
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);

// const StatusCard = ({ title, items, color }) => (
  <Card sx={{ 
    height: '100%',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
          {title}
        </Typography>
        <IconButton size="small" sx={{ color: '#6B7280' }}>
          <MoreVert />
        </IconButton>
      </Box>
      
      <Box sx={{ space: 2 }}>
        {items.map((item, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 2,
            borderBottom: index < items.length - 1 ? '1px solid #F3F4F6' : 'none'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: color,
                mr: 2
              }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                  {item.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {item.subtitle}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeTrips: 0,
    totalVehicles: 0,
    activeDrivers: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    yearToDateRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  // const revenueData = [
  //   { month: 'Jan', revenue: 120000, loads: 145 },
  //   { month: 'Feb', revenue: 150000, loads: 178 },
  //   { month: 'Mar', revenue: 180000, loads: 203 },
  //   { month: 'Apr', revenue: 160000, loads: 189 },
  //   { month: 'May', revenue: 220000, loads: 245 },
  //   { month: 'Jun', revenue: 250000, loads: 268 },
  // ];

  // const loadStatusData = [
  //   { name: 'Delivered', value: 45, color: '#10B981' },
  //   { name: 'In Transit', value: 28, color: '#F59E0B' },
  //   { name: 'Pending', value: 18, color: '#6B7280' },
  //   { name: 'Delayed', value: 9, color: '#EF4444' }
  // ];

  // const recentLoads = [
  //   { name: 'Load #L-2024-001', subtitle: 'Toronto → Vancouver', value: '$4,250' },
  //   { name: 'Load #L-2024-002', subtitle: 'Montreal → Calgary', value: '$3,890' },
  //   { name: 'Load #L-2024-003', subtitle: 'Halifax → Winnipeg', value: '$5,120' },
  // ];

  // const topDrivers = [
  //   { name: 'John Stevens', subtitle: '24 loads completed', value: '98%' },
  //   { name: 'Sarah Miller', subtitle: '21 loads completed', value: '96%' },
  //   { name: 'Mike Johnson', subtitle: '19 loads completed', value: '94%' },
  // ];

  const [ownerOperators, setOwnerOperators] = useState([]);
  const [companyDrivers, setCompanyDrivers] = useState([]);
  // const [driversLoading, setDriversLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Listen for localStorage changes to update dashboard
    const handleStorageChange = (e) => {
      if (e.key === 'tms_drivers' || e.key === 'tms_loads') {
        fetchDashboardStats();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when localStorage is updated from the same tab
    const handleDriversUpdate = () => {
      fetchDashboardStats();
    };
    
    const handleLoadsUpdate = () => {
      fetchDashboardStats();
    };
    
    window.addEventListener('driversUpdated', handleDriversUpdate);
    window.addEventListener('loadsUpdated', handleLoadsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('driversUpdated', handleDriversUpdate);
      window.removeEventListener('loadsUpdated', handleLoadsUpdate);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get drivers from localStorage (same source as DriverManagement)
      const savedDrivers = localStorage.getItem('tms_drivers');
      const driversData = savedDrivers ? JSON.parse(savedDrivers) : [];
      
      // Get loads from localStorage to calculate driver totals
      const savedLoads = localStorage.getItem('tms_loads');
      const loadsData = savedLoads ? JSON.parse(savedLoads) : [];
      
      // Calculate totals for each driver from their assigned loads
      const calculateDriverTotals = (driverName) => {
        const driverLoads = loadsData.filter(load => load.driver === driverName);
        const totalGross = driverLoads.reduce((sum, load) => sum + (load.rate || 0), 0);
        // For simplicity, assume 20% profit margin
        const profit = totalGross * 0.2;
        return { totalGross, profit };
      };
      
      // Try to fetch additional stats from API if available
      const statsResponse = await axios.get('/api/drivers/dashboard-stats').catch(() => ({ data: null }));
      
      // Separate drivers by type and calculate their totals from loads
      const ownerOps = driversData
        .filter(d => d.driverType === 'owner_operator')
        .map(d => {
          const driverName = `${d.firstName} ${d.lastName}`;
          const { totalGross, profit } = calculateDriverTotals(driverName);
          return {
            name: driverName,
            yearlyGross: totalGross,
            profit: profit
          };
        });
      
      const companyDrvs = driversData
        .filter(d => d.driverType === 'company_driver')
        .map(d => {
          const driverName = `${d.firstName} ${d.lastName}`;
          const { totalGross, profit } = calculateDriverTotals(driverName);
          return {
            name: driverName,
            yearlyGross: totalGross,
            profit: profit
          };
        });
      
      setOwnerOperators(ownerOps);
      setCompanyDrivers(companyDrvs);
      
      // Calculate basic stats from localStorage data
      const activeDriversCount = driversData.filter(d => d.status === 'active' || d.status === 'available').length;
      const totalTrips = loadsData.length; // Count total loads as trips
      const totalRevenue = loadsData.reduce((sum, load) => sum + (load.rate || 0), 0);
      
      // Use real stats if available, otherwise use calculated + demo data
      if (statsResponse.data) {
        setStats({
          ...statsResponse.data,
          activeDrivers: activeDriversCount,
          activeTrips: totalTrips,
          totalRevenue: totalRevenue
        });
      } else {
        // Use calculated values with demo data for other metrics
        setStats({
          activeTrips: totalTrips,
          totalVehicles: 12,
          activeDrivers: activeDriversCount,
          pendingInvoices: 8,
          totalRevenue: totalRevenue,
          weeklyRevenue: Math.round(totalRevenue * 0.1), // Estimate 10% weekly
          monthlyRevenue: Math.round(totalRevenue * 0.4), // Estimate 40% monthly
          yearToDateRevenue: totalRevenue
        });
      }
      
      setDriversLoading(false);
    } catch (error) {
      console.log('📊 Using fallback - API not connected');
      
      // If we have localStorage data but API failed, use it
      const savedDrivers = localStorage.getItem('tms_drivers');
      const savedLoads = localStorage.getItem('tms_loads');
      if (savedDrivers) {
        const driversData = JSON.parse(savedDrivers);
        const loadsData = savedLoads ? JSON.parse(savedLoads) : [];
        
        // Calculate totals for each driver from their assigned loads
        const calculateDriverTotals = (driverName) => {
          const driverLoads = loadsData.filter(load => load.driver === driverName);
          const totalGross = driverLoads.reduce((sum, load) => sum + (load.rate || 0), 0);
          // For simplicity, assume 20% profit margin
          const profit = totalGross * 0.2;
          return { totalGross, profit };
        };
        
        const ownerOps = driversData
          .filter(d => d.driverType === 'owner_operator')
          .map(d => {
            const driverName = `${d.firstName} ${d.lastName}`;
            const { totalGross, profit } = calculateDriverTotals(driverName);
            return {
              name: driverName,
              yearlyGross: totalGross,
              profit: profit
            };
          });
        
        const companyDrvs = driversData
          .filter(d => d.driverType === 'company_driver')
          .map(d => {
            const driverName = `${d.firstName} ${d.lastName}`;
            const { totalGross, profit } = calculateDriverTotals(driverName);
            return {
              name: driverName,
              yearlyGross: totalGross,
              profit: profit
            };
          });
          
        setOwnerOperators(ownerOps);
        setCompanyDrivers(companyDrvs);
        
        // Calculate stats from localStorage data
        const activeDriversCount = driversData.filter(d => d.status === 'active' || d.status === 'available').length;
        const totalTrips = loadsData.length; // Count total loads as trips
        const totalRevenue = loadsData.reduce((sum, load) => sum + (load.rate || 0), 0);
        
        setStats({
          activeTrips: totalTrips,
          totalVehicles: 12,
          activeDrivers: activeDriversCount,
          pendingInvoices: 8,
          totalRevenue: totalRevenue,
          weeklyRevenue: Math.round(totalRevenue * 0.1), // Estimate 10% weekly
          monthlyRevenue: Math.round(totalRevenue * 0.4), // Estimate 40% monthly
          yearToDateRevenue: totalRevenue
        });
      } else {
        // Fallback to demo data if no localStorage data
        const demoOwnerOperators = [
          { name: 'John Stevens', yearlyGross: 185500, profit: 52300 },
          { name: 'Maria Rodriguez', yearlyGross: 178200, profit: 48900 },
          { name: 'David Chen', yearlyGross: 192800, profit: 56700 },
          { name: 'Sarah Thompson', yearlyGross: 167300, profit: -2800 }
        ];
        
        const demoCompanyDrivers = [
          { name: 'James Brown', yearlyGross: 89500, profit: 18900 },
          { name: 'Emily Davis', yearlyGross: 92300, profit: 21400 },
          { name: 'Carlos Martinez', yearlyGross: 87600, profit: -1200 },
          { name: 'Jennifer Lee', yearlyGross: 94800, profit: 23100 }
        ];
        
        setOwnerOperators(demoOwnerOperators);
        setCompanyDrivers(demoCompanyDrivers);
        
        setStats({
          activeTrips: 32,
          totalVehicles: 28,
          activeDrivers: 15,
          pendingInvoices: 8,
          totalRevenue: 185000,
          weeklyRevenue: 35000,
          monthlyRevenue: 185000,
          yearToDateRevenue: 950000
        });
      }
      setDriversLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ borderRadius: 1 }} />
        <Typography sx={{ mt: 2, color: '#6B7280' }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              sx={{ 
                borderColor: '#E5E7EB',
                color: '#374151',
                '&:hover': { borderColor: '#D1D5DB' }
              }}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              sx={{ 
                borderColor: '#E5E7EB',
                color: '#374151',
                '&:hover': { borderColor: '#D1D5DB' }
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{ 
                bgcolor: '#4F46E5',
                '&:hover': { bgcolor: '#3730A3' }
              }}
            >
              New Load
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Revenue Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Weekly Revenue"
            value={`$${stats.weeklyRevenue?.toLocaleString()}`}
            change="+12%"
            changeColor="#10B981"
            compareText="vs last week"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue?.toLocaleString()}`}
            change="+24%"
            changeColor="#10B981"
            compareText="vs last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Year to Date Revenue"
            value={`$${stats.yearToDateRevenue?.toLocaleString()}`}
            change="+18%"
            changeColor="#10B981"
            compareText="vs last year"
          />
        </Grid>
      </Grid>

      {/* Driver Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 3 }}>
                Company Drivers
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', border: '1px solid #E5E7EB' }}>Driver Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', border: '1px solid #E5E7EB' }}>Gross</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', border: '1px solid #E5E7EB' }}>Profit</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', border: '1px solid #E5E7EB' }}>%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyDrivers.map((driver, index) => {
                      const profitMargin = ((driver.profit / driver.yearlyGross) * 100);
                      return (
                        <TableRow key={index} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                          <TableCell sx={{ color: '#111827', fontWeight: 500, border: '1px solid #E5E7EB' }}>{driver.name}</TableCell>
                          <TableCell sx={{ color: '#111827', fontWeight: 600, border: '1px solid #E5E7EB' }}>
                            ${driver.yearlyGross.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: driver.profit >= 0 ? '#059669' : '#DC2626', fontWeight: 600, border: '1px solid #E5E7EB' }}>
                            ${driver.profit.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: profitMargin >= 0 ? '#059669' : '#DC2626', fontWeight: 600, border: '1px solid #E5E7EB' }}>
                            {profitMargin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Summary for Company Drivers */}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 0.5 }}>
                      Total Gross
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                      ${companyDrivers.reduce((sum, driver) => sum + driver.yearlyGross, 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 0.5 }}>
                      Total Profit
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600, 
                      color: companyDrivers.reduce((sum, driver) => sum + driver.profit, 0) >= 0 ? '#059669' : '#DC2626',
                      fontSize: '0.9rem'
                    }}>
                      ${companyDrivers.reduce((sum, driver) => sum + driver.profit, 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 0.5 }}>
                      Avg Margin
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600, 
                      color: (companyDrivers.reduce((sum, driver) => sum + (driver.profit / driver.yearlyGross * 100), 0) / companyDrivers.length) >= 0 ? '#059669' : '#DC2626',
                      fontSize: '0.9rem'
                    }}>
                      {(companyDrivers.reduce((sum, driver) => sum + (driver.profit / driver.yearlyGross * 100), 0) / companyDrivers.length).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 3 }}>
                Owner Operators
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', border: '1px solid #E5E7EB' }}>Driver Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', border: '1px solid #E5E7EB' }}>Gross</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', border: '1px solid #E5E7EB' }}>Profit</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', border: '1px solid #E5E7EB' }}>%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ownerOperators.map((driver, index) => {
                      const profitMargin = ((driver.profit / driver.yearlyGross) * 100);
                      return (
                        <TableRow key={index} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                          <TableCell sx={{ color: '#111827', fontWeight: 500, border: '1px solid #E5E7EB' }}>{driver.name}</TableCell>
                          <TableCell sx={{ color: '#111827', fontWeight: 600, border: '1px solid #E5E7EB' }}>
                            ${driver.yearlyGross.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: driver.profit >= 0 ? '#059669' : '#DC2626', fontWeight: 600, border: '1px solid #E5E7EB' }}>
                            ${driver.profit.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: profitMargin >= 0 ? '#059669' : '#DC2626', fontWeight: 600, border: '1px solid #E5E7EB' }}>
                            {profitMargin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Summary for Owner Operators */}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 0.5 }}>
                      Total Gross
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                      ${ownerOperators.reduce((sum, driver) => sum + driver.yearlyGross, 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 0.5 }}>
                      Total Profit
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600, 
                      color: ownerOperators.reduce((sum, driver) => sum + driver.profit, 0) >= 0 ? '#059669' : '#DC2626',
                      fontSize: '0.9rem'
                    }}>
                      ${ownerOperators.reduce((sum, driver) => sum + driver.profit, 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 0.5 }}>
                      Avg Margin
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600, 
                      color: (ownerOperators.reduce((sum, driver) => sum + (driver.profit / driver.yearlyGross * 100), 0) / ownerOperators.length) >= 0 ? '#059669' : '#DC2626',
                      fontSize: '0.9rem'
                    }}>
                      {(ownerOperators.reduce((sum, driver) => sum + (driver.profit / driver.yearlyGross * 100), 0) / ownerOperators.length).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
};

export default Dashboard;