const prisma = require('../config/prisma');
const { parseDocxToHtml, isWordDocument } = require('../services/circular.service');
const { createNotificationsForAudience } = require('../services/notification.service');
const { createAuditLog } = require('../services/audit.service');

const userSelect = { select: { id: true, name: true } };

const buildAttachment = (file) => ({
  filename: file.filename,
  originalName: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
  url: `/api/files/${file.filename}`,
});

const fmtCircular = (c) => ({
  ...c,
  _id: c.id,
  createdBy: c.createdBy ? { ...c.createdBy, _id: c.createdBy.id } : null,
  publishedBy: c.publishedBy ? { ...c.publishedBy, _id: c.publishedBy.id } : null,
  attachments: (c.attachments || []).map((a) => ({ ...a, _id: a.id })),
});

const getCirculars = async (req, res, next) => {
  try {
    const { status, audience, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (req.user.role === 'Resident') {
      where.status = 'Published';
      where.audience = { in: ['All', 'Residents'] };
    } else {
      if (status) where.status = status;
      if (audience) where.audience = audience;
    }

    const [rows, total] = await Promise.all([
      prisma.circular.findMany({
        where,
        include: { createdBy: userSelect, publishedBy: userSelect, attachments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.circular.count({ where }),
    ]);

    res.json({ circulars: rows.map(fmtCircular), total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

const getCircular = async (req, res, next) => {
  try {
    const c = await prisma.circular.findUnique({
      where: { id: req.params.id },
      include: { createdBy: userSelect, publishedBy: userSelect, attachments: true },
    });
    if (!c) return res.status(404).json({ message: 'Circular not found' });

    if (req.user.role === 'Resident' && c.status !== 'Published') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ circular: fmtCircular(c) });
  } catch (err) {
    next(err);
  }
};

const createCircular = async (req, res, next) => {
  try {
    const { title, audience } = req.body;
    let { content } = req.body;

    if (req.file && isWordDocument(req.file)) {
      content = await parseDocxToHtml(req.file.path);
    }

    if (!content) {
      return res.status(422).json({ message: 'Content or a Word document is required' });
    }

    const attachmentData = req.file ? [buildAttachment(req.file)] : [];

    const circular = await prisma.circular.create({
      data: {
        title,
        content,
        audience: audience || 'All',
        createdById: req.user.id,
        attachments: { create: attachmentData },
      },
      include: { createdBy: userSelect, publishedBy: userSelect, attachments: true },
    });

    await createAuditLog({
      action: 'CREATE_CIRCULAR', entity: 'Circular', entityId: circular.id,
      performedBy: req.user.id, newValue: { title, audience }, ipAddress: req.ip,
    });

    res.status(201).json({ circular: fmtCircular(circular) });
  } catch (err) {
    next(err);
  }
};

const updateCircular = async (req, res, next) => {
  try {
    const existing = await prisma.circular.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Circular not found' });
    if (existing.status === 'Published') {
      return res.status(400).json({ message: 'Published circulars cannot be edited' });
    }

    const { title, content, audience } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (audience !== undefined) data.audience = audience;

    const circular = await prisma.circular.update({
      where: { id: req.params.id }, data,
      include: { createdBy: userSelect, publishedBy: userSelect, attachments: true },
    });

    res.json({ circular: fmtCircular(circular) });
  } catch (err) {
    next(err);
  }
};

const publishCircular = async (req, res, next) => {
  try {
    const existing = await prisma.circular.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Circular not found' });
    if (existing.status === 'Published') return res.status(400).json({ message: 'Already published' });

    const circular = await prisma.circular.update({
      where: { id: req.params.id },
      data: { status: 'Published', publishedById: req.user.id, publishedAt: new Date() },
      include: { createdBy: userSelect, publishedBy: userSelect, attachments: true },
    });

    // Determine target users
    const roleWhere = { status: 'active' };
    if (circular.audience === 'Residents') roleWhere.role = 'Resident';
    else if (circular.audience === 'Committee') roleWhere.role = { in: ['Committee', 'Admin'] };

    const targetUsers = await prisma.user.findMany({ where: roleWhere, select: { id: true, email: true, name: true } });

    await createNotificationsForAudience({
      users: targetUsers,
      type: 'CIRCULAR_PUBLISHED',
      message: `New circular published: "${circular.title}"`,
      relatedEntity: 'Circular',
      relatedId: circular.id,
    });

    await createAuditLog({
      action: 'PUBLISH_CIRCULAR', entity: 'Circular', entityId: circular.id,
      performedBy: req.user.id, newValue: { status: 'Published' }, ipAddress: req.ip,
    });

    res.json({ message: 'Circular published', circular: fmtCircular(circular) });
  } catch (err) {
    next(err);
  }
};

const deleteCircular = async (req, res, next) => {
  try {
    const existing = await prisma.circular.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Circular not found' });

    await prisma.circular.delete({ where: { id: req.params.id } });

    await createAuditLog({
      action: 'DELETE_CIRCULAR', entity: 'Circular', entityId: req.params.id,
      performedBy: req.user.id, ipAddress: req.ip,
    });

    res.json({ message: 'Circular deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/circulars/:id/sign — any authenticated user
const signCircular = async (req, res, next) => {
  try {
    const circular = await prisma.circular.findUnique({ where: { id: req.params.id } });
    if (!circular) return res.status(404).json({ message: 'Circular not found' });
    if (circular.status !== 'Published') {
      return res.status(400).json({ message: 'Only published circulars can be signed' });
    }

    // Upsert: idempotent — signing twice is not an error but is a no-op
    const sig = await prisma.circularSignature.upsert({
      where: { circularId_userId: { circularId: circular.id, userId: req.user.id } },
      update: {},
      create: { circularId: circular.id, userId: req.user.id, ipAddress: req.ip || null },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    res.json({
      message: 'Circular signed successfully',
      signature: { ...sig, _id: sig.id, user: { ...sig.user, _id: sig.user.id } },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/circulars/:id/signatures — Admin/Committee
const getSignatures = async (req, res, next) => {
  try {
    const circular = await prisma.circular.findUnique({ where: { id: req.params.id } });
    if (!circular) return res.status(404).json({ message: 'Circular not found' });

    const signatures = await prisma.circularSignature.findMany({
      where: { circularId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, role: true, flat: { select: { id: true, block: true, unitNumber: true } } } } },
      orderBy: { signedAt: 'asc' },
    });

    const fmt = (s) => ({
      ...s,
      _id: s.id,
      user: { ...s.user, _id: s.user.id },
    });

    res.json({ signatures: signatures.map(fmt), total: signatures.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCirculars, getCircular, createCircular, updateCircular, publishCircular, deleteCircular, signCircular, getSignatures };
