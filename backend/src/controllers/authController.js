const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_erp_token_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const { usernameOrEmail, password } = req.body;

  try {
    if (!usernameOrEmail || !password) {
      res.status(400);
      throw new Error('Please provide email/username and password');
    }

    // Look up user by email or username, including password
    const user = await User.scope('withPassword').findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: usernameOrEmail },
          { username: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email/username or password');
    }

    if (user.status === 'inactive') {
      res.status(401);
      throw new Error('Your account is deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email/username or password');
    }

    res.json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  getMe,
};
