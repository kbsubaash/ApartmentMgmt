const prisma = require('../config/prisma');

const getAuditLogs = async (req, res, next) => {
  try {
    const { entity, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = entity ? { entity } : {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { performedBy: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    const fmt = (l) => ({
      ...l,
      _id: l.id,
      performedBy: l.performedBy ? { ...l.performedBy, _id: l.performedBy.id } : null,
      oldValue: l.oldValue ? JSON.parse(l.oldValue) : null,
      newValue: l.newValue ? JSON.parse(l.newValue) : null,
    });

    res.json({ logs: logs.map(fmt), total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
