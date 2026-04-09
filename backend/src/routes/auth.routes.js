const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('role')
      .optional()
      .isIn(['Admin', 'Committee', 'Resident'])
      .withMessage('Invalid role'),
  ],
  validate,
  controller.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.login
);

router.post('/refresh', controller.refresh);

router.post('/logout', verifyToken, controller.logout);

router.get('/me', verifyToken, controller.me);

module.exports = router;
