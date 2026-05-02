const router = require('express').Router();
const { register, login, getProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getProfile);

module.exports = router;
