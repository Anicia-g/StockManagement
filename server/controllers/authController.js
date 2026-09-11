import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'electrical_stock_secret_key_2026';
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log(`AUTH LOGIN ATTEMPT: ${username}`);
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    console.log(`AUTH USER FOUND: ${!!user}`);
    const passwordMatch = user && await user.comparePassword(password);
    console.log(`AUTH PASSWORD MATCH: ${passwordMatch}`);

    if (user && passwordMatch && user.active) {
      console.log(`AUTH USER ACTIVE: ${user.active}`);
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatarText: user.avatarText
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarText: user.avatarText
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};
