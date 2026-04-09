const prisma = require('../config/prisma');

const createAuditLog = async ({ action, entity, entityId, performedBy, oldValue, newValue, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId || null,
        performedById: performedBy,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    // Audit log failures must not crash the main operation
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
