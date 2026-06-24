const router = require('express').Router();
const { getReorderRestaurants } = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth');
const { createLimiter } = require('../middleware/rateLimiter');

router.get('/reorder', createLimiter(60, 'orders'), requireAuth, getReorderRestaurants);
module.exports = router;
