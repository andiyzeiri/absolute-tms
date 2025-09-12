const JWTUtils = require('../utils/jwt');
const { createDemoUsers } = require('../utils/demoData');

let demoUsers = null;

const initializeDemoUsers = async () => {
  if (!demoUsers) {
    demoUsers = await createDemoUsers();
  }
};

const authenticateToken = async (req, res, next) => {
  try {
    await initializeDemoUsers();
    
    const authHeader = req.headers['authorization'];
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    const decoded = JWTUtils.verifyAccessToken(token);
    const user = demoUsers.find(u => u._id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Remove password from user object
    const userResponse = { ...user };
    delete userResponse.password;
    
    req.user = { ...userResponse, userId: user._id };
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};