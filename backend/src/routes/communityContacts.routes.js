const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/communityContacts.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();
router.use(verifyToken);

// GET /api/community-contacts — all authenticated users
router.get('/', controller.getContacts);

// POST /api/community-contacts — Admin only
router.post(
  '/',
  authorize('Admin'),
  [
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').optional().trim(),
    body('phone2').optional().trim(),
    body('address').optional().trim(),
    body('icon').optional().trim(),
    body('order').optional().isInt({ min: 0 }),
  ],
  validate,
  controller.createContact
);

// PUT /api/community-contacts/:id — Admin only
router.put(
  '/:id',
  authorize('Admin'),
  [
    body('category').optional().trim().notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('order').optional().isInt({ min: 0 }),
  ],
  validate,
  controller.updateContact
);

// DELETE /api/community-contacts/:id — Admin only
router.delete('/:id', authorize('Admin'), controller.deleteContact);

module.exports = router;
