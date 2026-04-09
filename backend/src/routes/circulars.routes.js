const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/circulars.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { upload } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.use(verifyToken);

// GET /api/circulars
router.get('/', controller.getCirculars);

// GET /api/circulars/:id
router.get('/:id', controller.getCircular);

// POST /api/circulars — Admin or Committee
router.post(
  '/',
  authorize('Admin', 'Committee'),
  upload.single('document'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('audience').optional().isIn(['All', 'Residents', 'Committee']),
  ],
  validate,
  controller.createCircular
);

// PUT /api/circulars/:id — Admin or Committee
router.put(
  '/:id',
  authorize('Admin', 'Committee'),
  [
    body('title').optional().trim().notEmpty(),
    body('audience').optional().isIn(['All', 'Residents', 'Committee']),
  ],
  validate,
  controller.updateCircular
);

// POST /api/circulars/:id/publish — Admin or Committee
router.post('/:id/publish', authorize('Admin', 'Committee'), controller.publishCircular);

// POST /api/circulars/:id/sign — any authenticated user
router.post('/:id/sign', controller.signCircular);

// GET /api/circulars/:id/signatures — Admin or Committee
router.get('/:id/signatures', authorize('Admin', 'Committee'), controller.getSignatures);

// DELETE /api/circulars/:id — Admin only
router.delete('/:id', authorize('Admin'), controller.deleteCircular);

module.exports = router;
