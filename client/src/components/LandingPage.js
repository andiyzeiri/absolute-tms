import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  useTheme,
  Stack,
} from '@mui/material';
import {
  LocalShipping,
  Speed,
  Analytics,
  ArrowForward,
} from '@mui/icons-material';

const LandingPage = ({ onEnterApp }) => {
  const theme = useTheme();

  const features = [
    {
      icon: <LocalShipping sx={{ fontSize: 56, color: '#1D1D1F', opacity: 0.8 }} />,
      title: 'Fleet Management',
      description: 'Complete control of your entire fleet operation.'
    },
    {
      icon: <Speed sx={{ fontSize: 56, color: '#1D1D1F', opacity: 0.8 }} />,
      title: 'Real-Time Tracking',
      description: 'Live GPS monitoring and route optimization.'
    },
    {
      icon: <Analytics sx={{ fontSize: 56, color: '#1D1D1F', opacity: 0.8 }} />,
      title: 'Smart Analytics',
      description: 'AI-powered insights for better decisions.'
    }
  ];

  return (
    <Box sx={{ bgcolor: '#fbfbfd', minHeight: '100vh' }}>
      {/* Header */}
      <Box 
        sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          bgcolor: 'rgba(251, 251, 253, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 2
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '1.25rem',
                color: '#1D1D1F',
                letterSpacing: '-0.5px'
              }}
            >
              OverdriveTMS
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button 
                onClick={onEnterApp}
                sx={{ 
                  color: '#1D1D1F',
                  textTransform: 'none',
                  fontWeight: 400,
                  fontSize: '1rem',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                }}
              >
                Sign In
              </Button>
              <Button 
                variant="contained"
                onClick={onEnterApp}
                sx={{ 
                  bgcolor: '#007AFF',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '1rem',
                  borderRadius: '20px',
                  px: 3,
                  boxShadow: 'none',
                  '&:hover': { 
                    bgcolor: '#0056CC',
                    boxShadow: 'none'
                  }
                }}
              >
                Get Started
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '3rem', md: '4.5rem', lg: '5.5rem' }, 
                fontWeight: 600,
                color: '#1D1D1F',
                mb: 2,
                lineHeight: 1.05,
                letterSpacing: '-0.015em'
              }}
            >
              OverdriveTMS
            </Typography>
            <Typography 
              variant="h2" 
              sx={{ 
                fontSize: { xs: '1.75rem', md: '2.25rem' }, 
                fontWeight: 400,
                color: '#86868B',
                mb: 6,
                lineHeight: 1.2,
                letterSpacing: '-0.01em'
              }}
            >
              The future of fleet management.
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mb: 8 }}
            >
              <Button 
                variant="contained"
                size="large"
                onClick={onEnterApp}
                endIcon={<ArrowForward />}
                sx={{ 
                  bgcolor: '#007AFF',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '1.1rem',
                  borderRadius: '25px',
                  py: 1.5,
                  px: 4,
                  boxShadow: 'none',
                  '&:hover': { 
                    bgcolor: '#0056CC',
                    boxShadow: 'none'
                  }
                }}
              >
                Try Demo
              </Button>
              <Button 
                variant="outlined"
                size="large"
                sx={{ 
                  color: '#007AFF',
                  borderColor: '#007AFF',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '1.1rem',
                  borderRadius: '25px',
                  py: 1.5,
                  px: 4,
                  '&:hover': { 
                    borderColor: '#0056CC',
                    bgcolor: 'rgba(0, 122, 255, 0.04)'
                  }
                }}
              >
                Learn More
              </Button>
            </Stack>

            {/* Hero Image */}
            <Box sx={{ 
              height: { xs: 300, md: 500 },
              bgcolor: '#F5F5F7',
              borderRadius: { xs: 3, md: 4 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              mb: 8
            }}>
              <LocalShipping sx={{ 
                fontSize: { xs: 100, md: 200 }, 
                color: '#D2D2D7',
                opacity: 0.5
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                bgcolor: 'rgba(29, 29, 31, 0.8)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 2,
                fontSize: '0.875rem'
              }}>
                Live Demo Available
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ bgcolor: '#F5F5F7', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 10 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 600,
                color: '#1D1D1F',
                mb: 3,
                letterSpacing: '-0.02em'
              }}
            >
              Built for performance.
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#86868B',
                maxWidth: 700,
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.4
              }}
            >
              Every feature designed to make fleet management effortless and intuitive.
            </Typography>
          </Box>

          <Grid container spacing={6}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      color: '#1D1D1F',
                      fontSize: '1.5rem'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#86868B',
                      fontWeight: 400,
                      fontSize: '1.1rem',
                      lineHeight: 1.4
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography 
              variant="h2" 
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 600,
                color: '#1D1D1F',
                mb: 3,
                letterSpacing: '-0.02em'
              }}
            >
              Ready to get started?
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#86868B',
                mb: 6,
                fontWeight: 400,
                lineHeight: 1.4
              }}
            >
              Experience the future of fleet management today.
            </Typography>
            <Button 
              variant="contained"
              size="large"
              onClick={onEnterApp}
              sx={{ 
                bgcolor: '#007AFF',
                color: 'white',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1.1rem',
                borderRadius: '25px',
                py: 1.5,
                px: 4,
                boxShadow: 'none',
                '&:hover': { 
                  bgcolor: '#0056CC',
                  boxShadow: 'none'
                }
              }}
            >
              Try Demo Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        bgcolor: '#F5F5F7', 
        borderTop: '1px solid #D2D2D7',
        py: 6
      }}>
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#86868B',
                fontSize: '0.875rem'
              }}
            >
              Copyright © 2024 OverdriveTMS Inc. All rights reserved.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                onClick={onEnterApp}
                sx={{ 
                  color: '#007AFF',
                  textTransform: 'none',
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  '&:hover': { bgcolor: 'rgba(0, 122, 255, 0.04)' }
                }}
              >
                Access Dashboard
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;