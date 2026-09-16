import jwt from 'jsonwebtoken';
import { User, Role, Department } from '../models/index.js';

const generateToken = (id) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_electrical_stock_secret_key_2026';
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

    const user = await User.findOne({
      where: { username: username.toLowerCase() },
      include: [
        { model: Role, as: 'role' },
        { model: Department, as: 'department' }
      ]
    });

    console.log(`AUTH USER FOUND: ${!!user}`);
    const passwordMatch = user && await user.comparePassword(password);
    console.log(`AUTH PASSWORD MATCH: ${passwordMatch}`);

    if (user && passwordMatch && user.active) {
      console.log(`AUTH USER ACTIVE: ${user.active}`);
      const userPayload = {
        id: user.id,
        _id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role?.name || 'FACULTY',
        department: user.department?.name || 'Maintenance Dept.',
        avatarText: user.avatar_text || 'U'
      };

      res.json({
        success: true,
        token: generateToken(user.id),
        user: userPayload
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
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, as: 'role' },
        { model: Department, as: 'department' }
      ],
      order: [['name', 'ASC']]
    });

    const formatted = users.map(u => ({
      id: u.id,
      _id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role?.name,
      department: u.department?.name,
      active: u.active
    }));

    res.json({ success: true, count: formatted.length, users: formatted });
  } catch (error) {
    next(error);
  }
};
