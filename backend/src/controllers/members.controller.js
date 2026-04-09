const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { createAuditLog } = require('../services/audit.service');
const { sendMaintenanceReminderEmail } = require('../services/email.service');

const SALT_ROUNDS = 12;

// Helper: normalize user row to match frontend expectations (_id alias)
const fmt = (u) => u ? { ...u, _id: u.id } : null;
const fmtFlat = (f) => f ? { ...f, _id: f.id, displayId: `${f.block}-${f.unitNumber}` } : null;

const getMembers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const flatInclude = { select: { id: true, block: true, unitNumber: true } };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { flat: flatInclude },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    const members = rows.map((u) => ({
      ...fmt(u),
      flatId: u.flatId,
      flat: u.flat ? fmtFlat(u.flat) : null,
    }));

    res.json({ members, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

const getMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSelf = req.user.id === id;
    const canSeePrivate = ['Admin', 'Committee'].includes(req.user.role) || isSelf;

    if (req.user.role === 'Resident' && !isSelf) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { flat: { select: { id: true, block: true, unitNumber: true, type: true, ownershipType: true, status: true } } },
    });
    if (!user) return res.status(404).json({ message: 'Member not found' });

    const member = { ...fmt(user), flat: user.flat ? fmtFlat(user.flat) : null };
    // Hide personal contact details from non-Admin/Committee unless viewing own profile
    if (!canSeePrivate) {
      delete member.phone;
      delete member.mailingAddress;
      delete member.email;
    }
    res.json({ member });
  } catch (err) {
    next(err);
  }
};

const createMember = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, flatId } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { mailingAddress } = req.body;
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, phone: phone || null, mailingAddress: mailingAddress || null, flatId: flatId || null },
    });
    const member = fmt(user);

    await createAuditLog({
      action: 'CREATE_USER', entity: 'User', entityId: user.id,
      performedBy: req.user.id, newValue: { name, email, role }, ipAddress: req.ip,
    });

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, mailingAddress, role, status, flatId, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Member not found' });
    const oldValue = { name: existing.name, role: existing.role, status: existing.status };

    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (mailingAddress !== undefined) data.mailingAddress = mailingAddress;
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    if (flatId !== undefined) data.flatId = flatId || null;
    if (password) data.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.update({ where: { id }, data });
    const member = fmt(user);

    await createAuditLog({
      action: 'UPDATE_USER', entity: 'User', entityId: id,
      performedBy: req.user.id, oldValue,
      newValue: { name: user.name, role: user.role, status: user.status }, ipAddress: req.ip,
    });

    res.json({ member });
  } catch (err) {
    next(err);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Member not found' });

    await prisma.user.update({ where: { id }, data: { status: 'inactive' } });

    await createAuditLog({
      action: 'DELETE_USER', entity: 'User', entityId: id,
      performedBy: req.user.id, oldValue: { status: 'active' }, newValue: { status: 'inactive' }, ipAddress: req.ip,
    });

    res.json({ message: 'Member deactivated' });
  } catch (err) {
    next(err);
  }
};

const getMyProfile = (req, res) => {
  res.json({ member: req.user });
};

const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phone, mailingAddress } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (mailingAddress !== undefined) data.mailingAddress = mailingAddress;
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ member: fmt(user) });
  } catch (err) {
    next(err);
  }
};

const sendPaymentReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { month, amount, notes } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'Member not found' });
    if (user.status !== 'active') return res.status(400).json({ message: 'Member is inactive' });

    await sendMaintenanceReminderEmail({
      to: user.email,
      name: user.name,
      month: month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      amount: amount || '',
      notes: notes || '',
    });

    await createAuditLog({
      action: 'SEND_PAYMENT_REMINDER', entity: 'User', entityId: id,
      performedBy: req.user.id,
      newValue: { to: user.email, month, amount }, ipAddress: req.ip,
    });

    res.json({ message: `Payment reminder sent to ${user.email}` });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMembers, getMember, createMember, updateMember, deleteMember, getMyProfile, updateMyProfile, sendPaymentReminder };
