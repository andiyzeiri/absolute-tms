import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LoadManagement from './components/LoadManagement';
import FleetManagement from './components/FleetManagement';
import DriverManagement from './components/DriverManagement';
import BrokerManagement from './components/BrokerManagement';
import CustomerManagement from './components/CustomerManagement';
import InvoicingManagement from './components/InvoicingManagement';
import RateConfirmations from './components/RateConfirmations';
import PayrollManagement from './components/PayrollManagement';
import FuelManagement from './components/FuelManagement';
import EldManagement from './components/EldManagement';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import { LocalShipping } from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#059669', // Professional emerald green
      light: '#10B981',
      dark: '#047857',
    },
    secondary: {
      main: '#0891B2', // Complementary cyan accent
      light: '#06B6D4',
      dark: '#0E7490',
    },
    success: {
      main: '#22C55E',
      light: '#4ADE80',
      dark: '#16A34A',
    },
    background: {
      default: '#F0FDF4', // Very light green tint
      paper: '#FFFFFF',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
        },
      },
    },
  },
});

const MainApp = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authView, setAuthView] = useState('landing'); // 'landing', 'login', 'register'

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#fbfbfd' 
      }}>
        <LocalShipping sx={{ fontSize: 48, color: '#007AFF' }} />
      </Box>
    );
  }

  // If not authenticated, show landing/auth pages
  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <LandingPage 
          onEnterApp={() => setAuthView('login')} 
        />
      );
    }
    
    if (authView === 'login') {
      return (
        <Login 
          onSwitchToRegister={() => setAuthView('register')}
          onBackToLanding={() => setAuthView('landing')}
        />
      );
    }
    
    if (authView === 'register') {
      return (
        <Register 
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'trips':
        return <LoadManagement />;
      case 'vehicles':
        return <FleetManagement />;
      case 'drivers':
        return <DriverManagement />;
      case 'brokers':
        return <BrokerManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'invoices':
        return <InvoicingManagement />;
      case 'rate-confirmations':
        return <RateConfirmations />;
      case 'payroll':
        return <PayrollManagement />;
      case 'fuel':
        return <FuelManagement />;
      case 'eld':
        return <EldManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        user={user}
      />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {renderPage()}
      </Box>
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <MainApp />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1F2937',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              duration: 3000,
              style: {
                background: '#059669',
                color: '#fff',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#DC2626',
                color: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;