const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/flats.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.use(verifyToken);

// GET /api/flats — all authenticated users
router.get('/', controller.getFlats);

// GET /api/flats/:id
router.get('/:id', controller.getFlat);

// POST /api/flats — Admin only
router.post(
  '/',
  authorize('Admin'),
  [
    body('unitNumber').isInt({ min: 1, max: 19 }).withMessage('Unit number must be 1–19'),
    body('block').optional().trim(),
    body('type').optional().isIn(['1BHK', '2BHK', '3BHK', 'Other']),
    body('ownershipType').optional().isIn(['Owner', 'Tenant']),
  ],
  validate,
  controller.createFlat
);

// PUT /api/flats/:id — Admin only
router.put(
  '/:id',
  authorize('Admin'),
  [
    body('type').optional().isIn(['1BHK', '2BHK', '3BHK', 'Other']),
    body('ownershipType').optional().isIn(['Owner', 'Tenant']),
    body('status').optional().isIn(['occupied', 'vacant']),
  ],
  validate,
  controller.updateFlat
);

// POST /api/flats/:id/assign — Admin only
router.post(
  '/:id/assign',
  authorize('Admin'),
  [body('memberId').notEmpty().withMessage('memberId is required')],
  validate,
  controller.assignMember
);

// POST /api/flats/:id/unassign — Admin only
router.post(
  '/:id/unassign',
  authorize('Admin'),
  [body('memberId').notEmpty().withMessage('memberId is required')],
  validate,
  controller.unassignMember
);

module.exports = router;
