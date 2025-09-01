import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken, requireSuperAdmin, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Create new user (default role is 'user')
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, passwordProvided: !!password });

    // Find user by email
    const user = await User.findOne({ email });
    console.log('User found:', user ? { email: user.email, role: user.role, isActive: user.isActive } : 'No user found');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('User is inactive');
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Google sign-in / upsert endpoint
router.post('/google', async (req, res) => {
  try {
    const { email, googleId, firstName, lastName, username } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Missing Google credentials' });
    }

    // Try to find existing user by email
    let user = await User.findOne({ email });

    if (!user) {
      // If not found, create a new user with google provider
      user = new User({
        email,
        username,
        firstName,
        lastName,
        authProvider: 'google',
        googleId,
        // No password for google accounts
      });
      await user.save();
    } else {
      // If exists but not linked to google yet, link it
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider || 'local';
        await user.save();
      }
    }

    // Check active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Google auth successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const user = req.user;

    // Check if email is being updated and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email already exists' 
        });
      }
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    console.log('Password change attempt for user:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      currentPasswordProvided: !!currentPassword,
      newPasswordProvided: !!newPassword
    });

    // Check if user is a Google user
    if (user.googleId || user.authProvider === 'google') {
      return res.status(400).json({ 
        message: 'Password cannot be changed for Google accounts. Please change your password through your Google Account settings.' 
      });
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    console.log('Current password validation result:', isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('Password changed successfully for user:', user.email);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Create admin user (super admin only)
router.post('/create-admin', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Create admin user
    const adminUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'admin'
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: adminUser.toJSON()
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Failed to create admin user' });
  }
});

// Update user role (super admin only)
router.put('/users/:userId/role', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Deactivate/Activate user (admin only)
router.put('/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating super admin
    if (req.user.role === 'admin' && user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot modify super admin status' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Delete user (super admin only)
router.delete('/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent super admin from deleting themselves
    if (req.user._id.toString() === userId) {
      return res.status(403).json({ message: 'Cannot delete your own account' });
    }

    // Prevent deletion of other super admins (optional security measure)
    if (user.role === 'super_admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Cannot delete other super admin accounts' });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: userId,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Update super admin profile (super admin only)
router.put('/super-admin/profile', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    console.log('Super admin profile update request:', {
      userId: req.user._id,
      currentUsername: req.user.username,
      currentEmail: req.user.email,
      requestBody: req.body
    });

    const { username, email, firstName, lastName } = req.body;
    const user = req.user;

    // Check if username is being updated and if it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        console.log('Username already exists:', username);
        return res.status(400).json({ 
          message: 'Username already exists' 
        });
      }
    }

    // Check if email is being updated and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Email already exists:', email);
        return res.status(400).json({ 
          message: 'Email already exists' 
        });
      }
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    console.log('Updated user fields:', {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });

    await user.save();
    console.log('User saved successfully');

    res.json({
      message: 'Super admin profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Super admin profile update error:', error);
    res.status(500).json({ message: 'Failed to update super admin profile' });
  }
});

// Debug endpoint to check super admin (remove in production)
router.get('/debug/superadmin', async (req, res) => {
  try {
    const superAdmin = await User.findOne({ role: 'super_admin' });
    if (superAdmin) {
      res.json({
        exists: true,
        email: superAdmin.email,
        username: superAdmin.username,
        role: superAdmin.role,
        isActive: superAdmin.isActive,
        hasPassword: !!superAdmin.password,
        passwordLength: superAdmin.password ? superAdmin.password.length : 0
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to test password (remove in production)
router.post('/debug/test-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    res.json({
      userFound: true,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordTestResult: isPasswordValid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
