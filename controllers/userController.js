const User = require('../models/User');
const Company = require('../models/Company');
const JWTUtils = require('../utils/jwt');

class UserController {
  // Get all users in the admin's company
  static async getUsersByCompany(req, res) {
    try {
      const { company } = req.user;
      
      const users = await User.find({ 
        company,
        isActive: true 
      })
      .select('-password -refreshToken')
      .populate('company', 'name')
      .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { users }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  // Admin invites/creates new user for their company
  static async inviteUser(req, res) {
    try {
      const { firstName, lastName, email, role, phone } = req.body;
      const adminUser = req.user;

      // Only admins can invite users
      if (adminUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can invite users'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Check company user limit
      const company = await Company.findById(adminUser.company);
      const userCount = await User.countDocuments({ 
        company: adminUser.company, 
        isActive: true 
      });

      if (userCount >= company.maxUsers) {
        return res.status(400).json({
          success: false,
          message: `Company has reached the maximum user limit of ${company.maxUsers}`
        });
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      
      // Create new user
      const newUser = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: tempPassword,
        role,
        phone,
        company: adminUser.company,
        companyName: company.name,
        emailVerificationToken: JWTUtils.generateEmailVerificationToken()
      });

      await newUser.save();

      // Remove password from response
      const userResponse = newUser.toObject();
      delete userResponse.password;

      // TODO: Send invitation email with temporary password
      // await sendInvitationEmail(email, tempPassword);

      res.status(201).json({
        success: true,
        message: 'User invited successfully',
        data: { 
          user: userResponse,
          tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
        }
      });

    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invite user'
      });
    }
  }

  // Admin updates user details
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { firstName, lastName, phone, role, isActive } = req.body;
      const adminUser = req.user;

      // Only admins can update users
      if (adminUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update users'
        });
      }

      // Find user in same company
      const user = await User.findOne({ 
        _id: userId, 
        company: adminUser.company 
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent admin from deactivating themselves
      if (userId === adminUser.userId && isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Admin cannot deactivate their own account'
        });
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, phone, role, isActive },
        { new: true, runValidators: true }
      ).select('-password -refreshToken');

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  // Admin deactivates user
  static async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const adminUser = req.user;

      // Only admins can deactivate users
      if (adminUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can deactivate users'
        });
      }

      // Prevent admin from deactivating themselves
      if (userId === adminUser.userId) {
        return res.status(400).json({
          success: false,
          message: 'Admin cannot deactivate their own account'
        });
      }

      // Find and deactivate user in same company
      const user = await User.findOneAndUpdate(
        { _id: userId, company: adminUser.company },
        { isActive: false, refreshToken: null },
        { new: true }
      ).select('-password -refreshToken');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate user'
      });
    }
  }
}

module.exports = UserController;