import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_electrical_stock_secret_key_2026';
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or session has expired.'
      });
    }

    if (user.active === false) {
      return res.status(403).json({
        success: false,
        message: 'User account is deactivated. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.'
    });
  }
};

// Backwards compatibility alias
export const verifyToken = protect;

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles: 'ADMIN' and/or 'FACULTY'
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role ? req.user.role.toUpperCase() : 'FACULTY';
    const normalizedRoles = roles.map(r => r.toUpperCase());

    if (normalizedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role "${userRole}" is not authorized for this operation.`
    });
  };
};

export const requireAdmin = authorize('ADMIN');
export const requireFaculty = authorize('FACULTY');
export const requireFacultyOrAdmin = authorize('ADMIN', 'FACULTY');
export const requireStaffOrAdmin = authorize('ADMIN', 'FACULTY'); // backward compatibility alias

