const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { createAuditLog } = require('./audit.service');

const SALT_ROUNDS = 12;

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const signAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiry,
  });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiry,
  });

const register = async ({ name, email, password, role, phone, mailingAddress, flatId }, performedByIp) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  // First registered user becomes Admin automatically
  const userCount = await prisma.user.count();
  const assignedRole = userCount === 0 ? 'Admin' : role || 'Resident';

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: assignedRole,
      phone: phone || null,
      mailingAddress: mailingAddress || null,
      flatId: flatId || null,
    },
  });

  await createAuditLog({
    action: 'CREATE_USER',
    entity: 'User',
    entityId: user.id,
    performedBy: user.id,
    newValue: { name, email, role: assignedRole },
    ipAddress: performedByIp,
  });

  return sanitizeUser(user);
};

const login = async ({ email, password }, ipAddress) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'active') {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  await createAuditLog({
    action: 'LOGIN',
    entity: 'Auth',
    entityId: user.id,
    performedBy: user.id,
    ipAddress,
  });

  return { accessToken, refreshToken, user: sanitizeUser(user) };
};

const refreshTokens = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtRefreshSecret);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== token) {
    const err = new Error('Refresh token mismatch');
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken(user.id, user.role);
  const newRefreshToken = signRefreshToken(user.id);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};

const sanitizeUser = (user) => ({
  _id: user.id,
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  flatId: user.flatId,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = { register, login, refreshTokens, logout, sanitizeUser };
