const { Router } = require('express');
const { sendOtp, verifyOtp, refresh, logout, updateEmail, checkUsername } = require('../controllers/authController');
const { validate, sendOtpSchema, verifyOtpSchema, refreshSchema, updateEmailSchema } = require('../validators/authValidator');
const { authenticate } = require('../middlewares/authMiddleware');
const { sendOtpLimiter, verifyOtpLimiter } = require('../middlewares/rateLimitMiddleware');

const router = Router();

router.get( '/auth/check-username',                                           checkUsername);
router.post('/auth/send-otp',   sendOtpLimiter,   validate(sendOtpSchema),   sendOtp);
router.post('/auth/verify-otp', verifyOtpLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/auth/refresh',                      validate(refreshSchema),    refresh);
router.post('/auth/logout',     authenticate,                                 logout);
router.put( '/profile/email',   authenticate,     validate(updateEmailSchema), updateEmail);

module.exports = router;
