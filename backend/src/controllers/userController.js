const { User } = require('../models');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['username', 'ASC']] });
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a user
// @route   POST /api/v1/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  const { username, email, password, role, status } = req.body;
  try {
    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Username, email, and password are required');
    }

    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username is already taken');
    }

    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      res.status(400);
      throw new Error('Email is already registered');
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'employee',
      status: status || 'active',
    });

    // Strip password from returned user using a scope or manually delete
    const returnedUser = await User.findByPk(user.id);

    res.status(201).json({ success: true, user: returnedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { username, email, password, role, status } = req.body;

  try {
    const user = await User.scope('withPassword').findByPk(id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ where: { username } });
      if (usernameExists) {
        res.status(400);
        throw new Error('Username is already taken');
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        res.status(400);
        throw new Error('Email is already registered');
      }
      user.email = email;
    }

    if (password) {
      user.password = password; // Trigger beforeUpdate hook to hash
    }

    if (role) {
      // Prevent user from changing their own role (optional safety, let's keep it simple or restrict)
      if (req.user.id === user.id && role !== user.role) {
        res.status(400);
        throw new Error('You cannot change your own role');
      }
      user.role = role;
    }

    if (status) {
      if (req.user.id === user.id && status === 'inactive') {
        res.status(400);
        throw new Error('You cannot deactivate your own account');
      }
      user.status = status;
    }

    await user.save();

    const returnedUser = await User.findByPk(user.id);
    res.json({ success: true, user: returnedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.user.id === user.id) {
      res.status(400);
      throw new Error('You cannot delete your own admin account');
    }

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
