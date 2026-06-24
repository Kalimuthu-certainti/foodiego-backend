const router = require('express').Router();
const { createLimiter } = require('../middleware/rateLimiter');
const { register, login, me } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.post('/register', createLimiter(10, 'auth-register'), register);
router.post('/login',    createLimiter(10, 'auth-login'),    login);
router.get('/me',        requireAuth,                         me);

module.exports = router;
