const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logger } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debug logging
    console.log('[LOGIN] Attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('[LOGIN] Validation failed: missing email or password');
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('[LOGIN] User not found:', email);
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    console.log('[LOGIN] User found:', email, '| Role:', user.role);

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      console.log('[LOGIN] Account locked for:', email);
      return res.status(423).json({
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: 'Account is temporarily locked due to too many failed login attempts',
        retryAfter: Math.ceil((user.locked_until - new Date()) / 1000 / 60) + ' minutes'
      });
    }

    // Check password
    console.log('[LOGIN] Comparing password hash...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('[LOGIN] Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      // Increment login attempts
      user.login_attempts = (user.login_attempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.login_attempts >= 5) {
        console.log('[LOGIN] Account locked due to too many failed attempts for:', email);
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
        return res.status(423).json({
          success: false,
          error: 'ACCOUNT_LOCKED',
          message: 'Account locked due to too many failed login attempts. Try again in 15 minutes.',
          retryAfter: '15 minutes'
        });
      }

      console.log('[LOGIN] Failed attempt #' + user.login_attempts + ' for:', email);
      await user.save();
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    user.login_attempts = 0;
    user.locked_until = null;
    user.last_login = new Date();
    await user.save();

    console.log('[LOGIN] ✓ Login successful for:', email);

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      console.log('[LOGIN] 2FA enabled for user:', email);
      return res.status(200).json({
        success: true,
        message: '2FA required',
        data: {
          requires_2fa: true,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name
          }
        }
      });
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token,
        refresh_token: refreshToken,
        expires_in: 3600
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'LOGIN_ERROR',
      message: 'Login failed'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Private
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      });
    }

    const newToken = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        expires_in: 3600
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid or expired refresh token'
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'LOGOUT_ERROR',
      message: 'Logout failed'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'PROFILE_ERROR',
      message: 'Failed to get user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { full_name, email, profile_picture_url, about_me, what_i_can_do } = req.body;
    const user = await User.findByPk(req.user.id);

    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'Email is already in use'
        });
      }
      user.email = email;
    }

    if (full_name !== undefined) {
      user.full_name = full_name;
    }

    if (profile_picture_url !== undefined) {
      user.profile_picture_url = profile_picture_url;
    }

    if (about_me !== undefined) {
      user.about_me = about_me;
    }

    if (what_i_can_do !== undefined) {
      user.what_i_can_do = what_i_can_do;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          profile_picture_url: user.profile_picture_url,
          about_me: user.about_me,
          what_i_can_do: user.what_i_can_do
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_PROFILE_ERROR',
      message: 'Failed to update profile'
    });
  }
};

// @desc    Change password
// @route   POST /api/v1/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(new_password, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'CHANGE_PASSWORD_ERROR',
      message: 'Failed to change password'
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword
};