const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Recruiter = require('../models/Recruiter');
const Admin = require('../models/Admin');

const roleModelMap = {
  student: Student,
  recruiter: Recruiter,
  admin: Admin,
};

const generateToken = (id, role) => {
  return jwt.sign(
    {
      id,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

const authenticate = (allowedRoles = []) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const Model = roleModelMap[decoded.role];

    if (!Model) {
      return res.status(403).json({ message: 'Invalid role in token' });
    }

    const user = await Model.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User associated with token not found' });
    }

    req.user = user;
    req.userRole = decoded.role;

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Insufficient permissions for this resource' });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  generateToken,
  authenticate,
};
