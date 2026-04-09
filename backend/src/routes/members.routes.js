const { Router } = require('express');
const { body, query } = require('express-validator');
const controller = require('../controllers/members.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.use(verifyToken);

// GET /api/members — Admin & Committee only (paginated)
router.get(
  '/',
  authorize('Admin', 'Committee'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  controller.getMembers
);

// GET /api/members/profile — own profile (any role)
router.get('/profile', controller.getMyProfile);

// PUT /api/members/profile — own profile update
router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  controller.updateMyProfile
);

// GET /api/members/:id — Admin, Committee, or self
router.get('/:id', controller.getMember);

// POST /api/members — Admin only
router.post(
  '/',
  authorize('Admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['Admin', 'Committee', 'Resident']),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  controller.createMember
);

// PUT /api/members/:id — Admin only
router.put(
  '/:id',
  authorize('Admin'),
  [
    body('name').optional().trim().notEmpty(),
    body('role').optional().isIn(['Admin', 'Committee', 'Resident']),
    body('status').optional().isIn(['active', 'inactive']),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  controller.updateMember
);

// DELETE /api/members/:id (soft delete) — Admin only
router.delete('/:id', authorize('Admin'), controller.deleteMember);

// POST /api/members/:id/remind-payment — Admin & Committee
router.post(
  '/:id/remind-payment',
  authorize('Admin', 'Committee'),
  [
    body('month').optional().trim(),
    body('amount').optional(),
    body('notes').optional().trim(),
  ],
  validate,
  controller.sendPaymentReminder
);

module.exports = router;
