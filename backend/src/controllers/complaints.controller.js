const prisma = require('../config/prisma');
const { createNotification } = require('../services/notification.service');
const { createAuditLog } = require('../services/audit.service');

const buildAttachment = (file) => ({
  filename: file.filename,
  originalName: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
  url: `/api/files/${file.filename}`,
});

const flatSelect = { select: { id: true, block: true, unitNumber: true } };
const userSelect = { select: { id: true, name: true, email: true } };

const fmtComplaint = (c) => ({
  ...c,
  _id: c.id,
  submittedBy: c.submittedBy ? { ...c.submittedBy, _id: c.submittedBy.id } : null,
  assignedTo: c.assignedTo ? { ...c.assignedTo, _id: c.assignedTo.id } : null,
  flat: c.flat ? { ...c.flat, _id: c.flat.id, displayId: `${c.flat.block}-${c.flat.unitNumber}` } : null,
  attachments: (c.attachments || []).map((a) => ({ ...a, _id: a.id })),
  comments: (c.comments || []).map((cm) => ({
    ...cm,
    _id: cm.id,
    by: cm.by ? { ...cm.by, _id: cm.by.id } : null,
  })),
});

const getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (req.user.role === 'Resident') where.submittedById = req.user.id;
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [rows, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          submittedBy: userSelect,
          flat: flatSelect,
          assignedTo: { select: { id: true, name: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.complaint.count({ where }),
    ]);

    res.json({ complaints: rows.map(fmtComplaint), total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

const getComplaint = async (req, res, next) => {
  try {
    const c = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: {
        submittedBy: userSelect,
        flat: flatSelect,
        assignedTo: { select: { id: true, name: true, email: true } },
        attachments: true,
        comments: {
          include: { by: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!c) return res.status(404).json({ message: 'Complaint not found' });

    if (req.user.role === 'Resident' && c.submittedById !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ complaint: fmtComplaint(c) });
  } catch (err) {
    next(err);
  }
};

const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority, flatId } = req.body;

    const resolvedFlatId = flatId || req.user.flatId;
    if (!resolvedFlatId) {
      return res.status(422).json({ message: 'Flat ID is required. Please assign a flat to your profile.' });
    }

    const attachmentData = req.files ? req.files.map(buildAttachment) : [];

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        category,
        priority: priority || 'Medium',
        flatId: resolvedFlatId,
        submittedById: req.user.id,
        attachments: { create: attachmentData },
      },
      include: { submittedBy: userSelect, flat: flatSelect, attachments: true, comments: true },
    });

    await createAuditLog({
      action: 'CREATE_COMPLAINT', entity: 'Complaint', entityId: complaint.id,
      performedBy: req.user.id, newValue: { title, category, priority }, ipAddress: req.ip,
    });

    res.status(201).json({ complaint: fmtComplaint(complaint) });
  } catch (err) {
    next(err);
  }
};

const updateComplaint = async (req, res, next) => {
  try {
    const existing = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Complaint not found' });

    const isAdminOrCommittee = ['Admin', 'Committee'].includes(req.user.role);
    const isOwner = existing.submittedById === req.user.id;

    if (!isAdminOrCommittee && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = existing.status;
    const { status, assignedToId, priority, title, description } = req.body;

    const data = {};
    if (isAdminOrCommittee) {
      if (status !== undefined) data.status = status;
      if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
      if (priority !== undefined) data.priority = priority;
      if (status === 'Resolved') data.resolvedAt = new Date();
    }
    if (isOwner && existing.status === 'Open') {
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
    }

    const complaint = await prisma.complaint.update({
      where: { id: req.params.id }, data,
      include: { submittedBy: userSelect, flat: flatSelect, assignedTo: { select: { id: true, name: true } }, attachments: true, comments: true },
    });

    if (isAdminOrCommittee && status && status !== oldStatus) {
      await createNotification({
        userId: existing.submittedById,
        type: 'COMPLAINT_STATUS_CHANGED',
        message: `Your complaint "${complaint.title}" status changed to ${status}`,
        relatedEntity: 'Complaint',
        relatedId: complaint.id,
      });

      await createAuditLog({
        action: 'UPDATE_COMPLAINT_STATUS', entity: 'Complaint', entityId: complaint.id,
        performedBy: req.user.id, oldValue: { status: oldStatus }, newValue: { status }, ipAddress: req.ip,
      });
    }

    res.json({ complaint: fmtComplaint(complaint) });
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const existing = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Complaint not found' });

    const isAdminOrCommittee = ['Admin', 'Committee'].includes(req.user.role);
    const isOwner = existing.submittedById === req.user.id;

    if (!isAdminOrCommittee && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { text } = req.body;
    await prisma.comment.create({ data: { complaintId: existing.id, byId: req.user.id, text } });

    const notifyUserId = isOwner ? existing.assignedToId : existing.submittedById;
    if (notifyUserId) {
      await createNotification({
        userId: notifyUserId,
        type: 'COMPLAINT_COMMENT',
        message: `New comment on complaint "${existing.title}"`,
        relatedEntity: 'Complaint',
        relatedId: existing.id,
      });
    }

    const comments = await prisma.comment.findMany({
      where: { complaintId: existing.id },
      include: { by: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ comments: comments.map((cm) => ({ ...cm, _id: cm.id, by: cm.by ? { ...cm.by, _id: cm.by.id } : null })) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComplaints, getComplaint, createComplaint, updateComplaint, addComment };
