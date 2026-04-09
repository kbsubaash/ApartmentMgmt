const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/polls.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();
router.use(verifyToken);

// GET /api/polls
router.get('/', controller.getPolls);

// GET /api/polls/:id
router.get('/:id', controller.getPoll);

// POST /api/polls — Admin/Committee
router.post(
  '/',
  authorize('Admin', 'Committee'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('options').isArray({ min: 2 }).withMessage('At least 2 options required'),
    body('audience').optional().isIn(['All', 'Residents', 'Committee']),
  ],
  validate,
  controller.createPoll
);

// PUT /api/polls/:id — Admin/Committee
router.put(
  '/:id',
  authorize('Admin', 'Committee'),
  [
    body('title').optional().trim().notEmpty(),
    body('options').optional().isArray({ min: 2 }),
  ],
  validate,
  controller.updatePoll
);

// POST /api/polls/:id/publish — Admin/Committee
router.post('/:id/publish', authorize('Admin', 'Committee'), controller.publishPoll);

// POST /api/polls/:id/close — Admin/Committee
router.post('/:id/close', authorize('Admin', 'Committee'), controller.closePoll);

// POST /api/polls/:id/vote — any authenticated user
router.post(
  '/:id/vote',
  [body('optionId').notEmpty().withMessage('Option is required')],
  validate,
  controller.castVote
);

// DELETE /api/polls/:id — Admin only
router.delete('/:id', authorize('Admin'), controller.deletePoll);

module.exports = router;
