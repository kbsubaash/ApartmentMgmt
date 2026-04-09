const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/prisma');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtAccessSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, phone: true, flatId: true, status: true, createdAt: true, updatedAt: true },
    });

    if (!user || user.status === 'inactive') {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Normalize _id for backward compatibility with controllers
    req.user = { ...user, _id: user.id };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { verifyToken };
