import jwt from 'jsonwebtoken';
import { User, Role, Department } from '../models/index.js';

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

    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Department, as: 'department' }
      ]
    });

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

    // Attach user object formatted for application consumption
    req.user = {
      id: user.id,
      _id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role: user.role?.name || 'FACULTY',
      department_id: user.department_id,
      department: user.department?.name || 'Maintenance Dept.',
      avatarText: user.avatar_text || 'U'
    };

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
export const requireStaffOrAdmin = authorize('ADMIN', 'FACULTY');
