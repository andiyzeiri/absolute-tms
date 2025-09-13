import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      const refreshToken = localStorage.getItem('tms_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh-token', {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('tms_access_token', accessToken);
          localStorage.setItem('tms_refresh_token', newRefreshToken);
          
          return axios(original);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('tms_access_token');
          localStorage.removeItem('tms_refresh_token');
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('tms_access_token');
      
      if (accessToken) {
        try {
          // Try backend first
          const response = await axios.get('/api/auth/profile');
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Backend failed, check for demo mode
          if (accessToken.startsWith('demo_')) {
            console.log('Using demo mode authentication');
            
            // Check for demo users
            const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
            if (demoUsers.length > 0) {
              setUser(demoUsers[0]); // Use first demo user
              setIsAuthenticated(true);
            } else if (accessToken.startsWith('demo_admin_')) {
              // Use default admin user
              const defaultUser = {
                _id: 'admin123',
                firstName: 'Demo',
                lastName: 'Admin',
                email: 'admin@absolutetms.com',
                role: 'admin',
                company: {
                  _id: 'company_demo',
                  name: 'Absolute TMS'
                },
                companyName: 'Absolute TMS',
                phone: '+1-555-0123',
                isActive: true,
                fullName: 'Demo Admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              setUser(defaultUser);
              setIsAuthenticated(true);
            } else {
              // Clear invalid demo token
              localStorage.removeItem('tms_access_token');
              localStorage.removeItem('tms_refresh_token');
              localStorage.removeItem('token');
            }
          } else {
            // Clear invalid backend token
            localStorage.removeItem('tms_access_token');
            localStorage.removeItem('tms_refresh_token');
            localStorage.removeItem('token');
            console.error('Token validation failed:', error);
          }
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Try backend first
      try {
        const response = await axios.post('/api/auth/login', {
          email,
          password
        });
        
        const { user: userData, accessToken, refreshToken } = response.data.data;
        
        // Store tokens
        localStorage.setItem('tms_access_token', accessToken);
        localStorage.setItem('tms_refresh_token', refreshToken);
        localStorage.setItem('token', accessToken); // For PDF uploads
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success(`Welcome back, ${userData.firstName}!`);
        return { success: true };
        
      } catch (backendError) {
        // Backend failed, try demo mode
        console.log('Backend unavailable, trying demo mode');
        
        // Check for demo users
        const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const demoUser = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!demoUser) {
          // Check for pre-created demo credentials
          if (email.toLowerCase() === 'admin@absolutetms.com' && password === 'demo123') {
            const defaultUser = {
              _id: 'admin123',
              firstName: 'Demo',
              lastName: 'Admin',
              email: 'admin@absolutetms.com',
              role: 'admin',
              company: {
                _id: 'company_demo',
                name: 'Absolute TMS'
              },
              companyName: 'Absolute TMS',
              phone: '+1-555-0123',
              isActive: true,
              fullName: 'Demo Admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Store demo user and token
            const demoToken = 'demo_admin_' + Date.now();
            localStorage.setItem('tms_access_token', demoToken);
            localStorage.setItem('tms_refresh_token', demoToken);
            localStorage.setItem('token', demoToken); // For PDF uploads
            
            setUser(defaultUser);
            setIsAuthenticated(true);
            
            toast.success(`Welcome back, ${defaultUser.firstName}! (Demo Mode)`);
            return { success: true };
          }
          
          throw new Error('Invalid credentials');
        }
        
        // Demo user found, log them in
        const demoToken = 'demo_' + Date.now();
        localStorage.setItem('tms_access_token', demoToken);
        localStorage.setItem('tms_refresh_token', demoToken);
        localStorage.setItem('token', demoToken); // For PDF uploads
        
        setUser(demoUser);
        setIsAuthenticated(true);
        
        toast.success(`Welcome back, ${demoUser.firstName}! (Demo Mode)`);
        return { success: true };
      }
      
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      toast.error(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Try backend first
      try {
        const response = await axios.post('/api/auth/register', userData);
        const { user: newUser, accessToken, refreshToken } = response.data.data;
        
        // Store tokens
        localStorage.setItem('tms_access_token', accessToken);
        localStorage.setItem('tms_refresh_token', refreshToken);
        
        // Update state
        setUser(newUser);
        setIsAuthenticated(true);
        
        toast.success(`Welcome to TMS Pro, ${newUser.firstName}!`);
        return { success: true };
        
      } catch (backendError) {
        // Backend failed, use demo mode
        console.log('Backend unavailable, using demo mode');
        
        // Check if user already exists in localStorage
        const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        if (existingUsers.find(u => u.email === userData.email.toLowerCase())) {
          throw new Error('User already exists with this email');
        }
        
        // Create demo user
        const demoUser = {
          _id: 'user_' + Date.now(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email.toLowerCase(),
          role: 'admin',
          company: {
            _id: 'company_' + Date.now(),
            name: userData.companyName
          },
          companyName: userData.companyName,
          phone: userData.phoneNumber,
          isActive: true,
          fullName: `${userData.firstName} ${userData.lastName}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Store user and create demo token
        existingUsers.push(demoUser);
        localStorage.setItem('demo_users', JSON.stringify(existingUsers));
        
        const demoToken = 'demo_' + Date.now();
        localStorage.setItem('tms_access_token', demoToken);
        localStorage.setItem('tms_refresh_token', demoToken);
        localStorage.setItem('token', demoToken); // For PDF uploads
        
        // Update state
        setUser(demoUser);
        setIsAuthenticated(true);
        
        toast.success(`Welcome to TMS Pro, ${demoUser.firstName}! (Demo Mode)`);
        return { success: true };
      }
      
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      toast.error(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage,
        errors: []
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('tms_access_token');
      localStorage.removeItem('tms_refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      
      const response = await axios.put('/api/auth/profile', profileData);
      const updatedUser = response.data.data.user;
      
      setUser(updatedUser);
      toast.success('Profile updated successfully');
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage,
        errors: error.response?.data?.errors || []
      };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      toast.error(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      
      await axios.post('/api/auth/forgot-password', { email });
      
      toast.success('Password reset instructions sent to your email');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset request failed';
      toast.error(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};