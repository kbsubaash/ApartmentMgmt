const { Router } = require('express');
const controller = require('../controllers/auditLogs.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

const router = Router();

// GET /api/audit-logs — Admin only
router.get('/', verifyToken, authorize('Admin'), controller.getAuditLogs);

module.exports = router;
