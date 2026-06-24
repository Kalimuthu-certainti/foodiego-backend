const router = require('express').Router();
const { getCuisines } = require('../controllers/cuisineController');
const { createLimiter } = require('../middleware/rateLimiter');

router.get('/', createLimiter(60, 'cuisines'), getCuisines);
module.exports = router;
