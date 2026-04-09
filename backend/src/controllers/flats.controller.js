const prisma = require('../config/prisma');
const { createAuditLog } = require('../services/audit.service');

const fmtFlat = (f, members = []) => ({
  ...f,
  _id: f.id,
  displayId: `${f.block}-${f.unitNumber}`,
  assignedMembers: members.map((m) => ({ ...m.user, _id: m.user.id })),
});

const flatWithMembers = (id) =>
  prisma.flat.findUnique({
    where: { id },
    include: { assignedMembers: { include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } } } },
  });

const getFlats = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const flats = await prisma.flat.findMany({
      where,
      include: { assignedMembers: { include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } } } },
      orderBy: { unitNumber: 'asc' },
    });
    res.json({ flats: flats.map((f) => fmtFlat(f, f.assignedMembers)) });
  } catch (err) {
    next(err);
  }
};

const getFlat = async (req, res, next) => {
  try {
    const flat = await flatWithMembers(req.params.id);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });
    res.json({ flat: fmtFlat(flat, flat.assignedMembers) });
  } catch (err) {
    next(err);
  }
};

const createFlat = async (req, res, next) => {
  try {
    const { block, unitNumber, type, ownershipType, notes } = req.body;
    const flat = await prisma.flat.create({
      data: { block: block || '1A', unitNumber: Number(unitNumber), type, ownershipType, notes: notes || null },
    });

    await createAuditLog({
      action: 'CREATE_FLAT', entity: 'Flat', entityId: flat.id,
      performedBy: req.user.id, newValue: { block: flat.block, unitNumber: flat.unitNumber }, ipAddress: req.ip,
    });

    res.status(201).json({ flat: fmtFlat(flat) });
  } catch (err) {
    next(err);
  }
};

const updateFlat = async (req, res, next) => {
  try {
    const existing = await prisma.flat.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Flat not found' });
    const oldValue = { type: existing.type, status: existing.status };

    const { type, ownershipType, status, notes } = req.body;
    const data = {};
    if (type !== undefined) data.type = type;
    if (ownershipType !== undefined) data.ownershipType = ownershipType;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const flat = await prisma.flat.update({ where: { id: req.params.id }, data });

    await createAuditLog({
      action: 'UPDATE_FLAT', entity: 'Flat', entityId: flat.id,
      performedBy: req.user.id, oldValue, newValue: { type: flat.type, status: flat.status }, ipAddress: req.ip,
    });

    res.json({ flat: fmtFlat(flat) });
  } catch (err) {
    next(err);
  }
};

const assignMember = async (req, res, next) => {
  try {
    const flat = await prisma.flat.findUnique({ where: { id: req.params.id } });
    if (!flat) return res.status(404).json({ message: 'Flat not found' });

    const { memberId } = req.body;
    const member = await prisma.user.findUnique({ where: { id: memberId } });
    if (!member) return res.status(404).json({ message: 'Member not found' });

    // Upsert into FlatMember join table
    await prisma.flatMember.upsert({
      where: { flatId_userId: { flatId: flat.id, userId: memberId } },
      update: {},
      create: { flatId: flat.id, userId: memberId },
    });

    // Update member's primary flatId and flat status
    await Promise.all([
      prisma.user.update({ where: { id: memberId }, data: { flatId: flat.id } }),
      prisma.flat.update({ where: { id: flat.id }, data: { status: 'occupied' } }),
    ]);

    const updated = await flatWithMembers(flat.id);
    res.json({ message: 'Member assigned to flat', flat: fmtFlat(updated, updated.assignedMembers) });
  } catch (err) {
    next(err);
  }
};

const unassignMember = async (req, res, next) => {
  try {
    const flat = await prisma.flat.findUnique({ where: { id: req.params.id } });
    if (!flat) return res.status(404).json({ message: 'Flat not found' });

    const { memberId } = req.body;

    await prisma.flatMember.deleteMany({ where: { flatId: flat.id, userId: memberId } });
    await prisma.user.update({ where: { id: memberId }, data: { flatId: null } });

    // Check if anyone still assigned
    const remaining = await prisma.flatMember.count({ where: { flatId: flat.id } });
    if (remaining === 0) {
      await prisma.flat.update({ where: { id: flat.id }, data: { status: 'vacant' } });
    }

    const updated = await flatWithMembers(flat.id);
    res.json({ message: 'Member unassigned from flat', flat: fmtFlat(updated, updated.assignedMembers) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFlats, getFlat, createFlat, updateFlat, assignMember, unassignMember };
