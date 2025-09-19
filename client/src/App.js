import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import appleTheme from './theme/appleTheme';
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
import EmailIntegration from './components/EmailIntegration';
import Settings from './components/Settings';
import TeamManagement from './components/TeamManagement';
import Sidebar from './components/Sidebar';
import { LocalShipping } from '@mui/icons-material';

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
        bgcolor: '#F2F2F7' 
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
      case 'email':
        return <EmailIntegration />;
      case 'settings':
        return <Settings />;
      case 'team-management':
        return <TeamManagement />;
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
    <ThemeProvider theme={appleTheme}>
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
                background: '#34C759',
                color: '#fff',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#FF3B30',
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