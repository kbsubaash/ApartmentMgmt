const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/complaints.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.use(verifyToken);

// GET /api/complaints
router.get('/', controller.getComplaints);

// GET /api/complaints/:id
router.get('/:id', controller.getComplaint);

// POST /api/complaints — any authenticated user
router.post(
  '/',
  upload.array('attachments', 3),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
      .isIn(['Plumbing', 'Electrical', 'Structural', 'Housekeeping', 'Security', 'Common Area', 'Other'])
      .withMessage('Invalid category'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  ],
  validate,
  controller.createComplaint
);

// PUT /api/complaints/:id
router.put(
  '/:id',
  [
    body('status').optional().isIn(['Open', 'InProgress', 'Resolved', 'Closed']),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
    body('text').optional().trim().notEmpty(),
  ],
  validate,
  controller.updateComplaint
);

// POST /api/complaints/:id/comments
router.post(
  '/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  validate,
  controller.addComment
);

module.exports = router;
