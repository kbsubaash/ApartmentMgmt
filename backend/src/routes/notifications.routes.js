const { Router } = require('express');
const controller = require('../controllers/notifications.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.use(verifyToken);

// GET /api/notifications — own notifications
router.get('/', controller.getNotifications);

// PUT /api/notifications/read-all
router.put('/read-all', controller.markAllRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', controller.markRead);

module.exports = router;
