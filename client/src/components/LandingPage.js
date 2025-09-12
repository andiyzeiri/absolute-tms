import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Chip,
  useTheme,
} from '@mui/material';
import {
  LocalShipping,
  Speed,
  TrendingUp,
  Security,
  Groups,
  Analytics,
  ArrowForward,
  CheckCircle,
  Phone,
  Email,
} from '@mui/icons-material';

const LandingPage = ({ onEnterApp }) => {
  const theme = useTheme();

  const features = [
    {
      icon: <LocalShipping sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Fleet Management',
      description: 'Complete vehicle tracking, maintenance scheduling, and asset management in one platform.'
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Real-Time Tracking',
      description: 'Monitor your trucks and drivers in real-time with GPS tracking and route optimization.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Analytics & Reports',
      description: 'Comprehensive reporting with financial analytics, performance metrics, and insights.'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'ELD Compliance',
      description: 'Built-in Electronic Logging Device integration for DOT compliance and safety.'
    },
    {
      icon: <Groups sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Driver Management',
      description: 'Manage your drivers, track hours, performance, and payroll all in one place.'
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Load Management',
      description: 'Efficiently manage loads, brokers, customers, and rate confirmations.'
    }
  ];

  const benefits = [
    'Reduce operational costs by up to 25%',
    'Improve delivery efficiency and customer satisfaction',
    'Stay DOT compliant with automated ELD integration',
    'Real-time visibility across your entire fleet',
    'Streamline invoicing and financial management',
    'Scale your trucking business with confidence'
  ];

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <LocalShipping sx={{ mr: 1, color: theme.palette.primary.main, fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              OverdriveTMS
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            onClick={onEnterApp}
            sx={{ mr: 2 }}
          >
            Sign In
          </Button>
          <Button 
            variant="contained" 
            onClick={onEnterApp}
            sx={{ bgcolor: theme.palette.primary.main }}
          >
            Get Started
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ 
        bgcolor: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
        py: 8,
        position: 'relative'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip 
                label="🚀 Advanced Transportation Management" 
                sx={{ 
                  mb: 3, 
                  bgcolor: theme.palette.primary.light, 
                  color: 'white',
                  fontWeight: 600 
                }} 
              />
              <Typography variant="h1" sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' }, 
                fontWeight: 800,
                color: theme.palette.grey[900],
                mb: 3,
                lineHeight: 1.1
              }}>
                The Complete TMS Solution for Modern Trucking
              </Typography>
              <Typography variant="h6" sx={{ 
                color: theme.palette.grey[600], 
                mb: 4,
                fontSize: '1.25rem',
                lineHeight: 1.6
              }}>
                Streamline your trucking operations with our all-in-one Transportation Management System. 
                Manage fleets, drivers, loads, and compliance from a single dashboard.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={onEnterApp}
                  endIcon={<ArrowForward />}
                  sx={{ 
                    py: 1.5, 
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    bgcolor: theme.palette.primary.main
                  }}
                >
                  Start Free Demo
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
                >
                  Watch Demo
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                height: 400,
                bgcolor: theme.palette.grey[100],
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <LocalShipping sx={{ 
                  fontSize: 150, 
                  color: theme.palette.primary.light,
                  opacity: 0.3
                }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    position: 'absolute',
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  Live Demo Available
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Everything You Need to Run Your Fleet
          </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.grey[600], maxWidth: 600, mx: 'auto' }}>
            Our comprehensive TMS platform includes all the tools and features you need to manage 
            your trucking business efficiently.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', p: 3, border: '1px solid #E5E7EB', transition: 'all 0.3s ease' }}>
                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.grey[600] }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: theme.palette.grey[50], py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 4 }}>
                Why Choose OverdriveTMS?
              </Typography>
              <Box sx={{ mb: 4 }}>
                {benefits.map((benefit, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ color: theme.palette.primary.main, mr: 2 }} />
                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button 
                variant="contained" 
                size="large"
                onClick={onEnterApp}
                sx={{ bgcolor: theme.palette.primary.main }}
              >
                Get Started Today
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
                  Ready to Transform Your Business?
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: theme.palette.grey[600] }}>
                  Join thousands of trucking companies who have streamlined their operations with OverdriveTMS.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 2, color: theme.palette.primary.main }} />
                    <Typography variant="body1">1-800-OVERDRIVE</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ mr: 2, color: theme.palette.primary.main }} />
                    <Typography variant="body1">info@overdrivetms.com</Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: theme.palette.grey[900], color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping sx={{ mr: 1, fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  OverdriveTMS
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: theme.palette.grey[300], mb: 2 }}>
                The most comprehensive Transportation Management System for modern trucking companies.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Get Started
              </Typography>
              <Button 
                variant="outlined" 
                onClick={onEnterApp}
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Access TMS Dashboard
              </Button>
            </Grid>
          </Grid>
          <Box sx={{ 
            borderTop: `1px solid ${theme.palette.grey[700]}`, 
            pt: 4, 
            mt: 4, 
            textAlign: 'center' 
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.grey[400] }}>
              © 2024 OverdriveTMS. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;