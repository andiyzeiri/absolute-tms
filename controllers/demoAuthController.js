const bcrypt = require('bcryptjs');
const JWTUtils = require('../utils/jwt');
const { createDemoUsers } = require('../utils/demoData');

// Demo authentication controller for when MongoDB is not available
class DemoAuthController {
  static demoUsers = null;

  static async initializeDemoUsers() {
    if (!this.demoUsers) {
      this.demoUsers = await createDemoUsers();
      console.log('✅ Demo users initialized for development');
    }
  }

  static async login(req, res) {
    try {
      await this.initializeDemoUsers();
      
      const { email, password } = req.body;

      // Find user
      const user = this.demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = JWTUtils.generateTokens({
        userId: user._id,
        email: user.email,
        role: user.role
      });

      // Remove password from response
      const userResponse = { ...user };
      delete userResponse.password;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getProfile(req, res) {
    try {
      await this.initializeDemoUsers();
      
      const userId = req.user.userId;
      const user = this.demoUsers.find(u => u._id === userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userResponse = { ...user };
      delete userResponse.password;

      res.json({
        success: true,
        data: { user: userResponse }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  static async register(req, res) {
    try {
      await this.initializeDemoUsers();
      
      const { firstName, lastName, email, password, role = 'driver' } = req.body;

      // Check if user already exists
      const existingUser = this.demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        _id: 'user_' + Date.now(),
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        isActive: true,
        fullName: `${firstName} ${lastName}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.demoUsers.push(newUser);

      // Generate tokens
      const { accessToken, refreshToken } = JWTUtils.generateTokens({
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role
      });

      // Remove password from response
      const userResponse = { ...newUser };
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Demo registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  static async logout(req, res) {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = JWTUtils.generateTokens({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      });

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken
        }
      });

    } catch (error) {
      console.error('Demo refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }
}

module.exports = DemoAuthController;