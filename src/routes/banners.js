const router = require('express').Router();
const { getBanners } = require('../controllers/bannerController');
const { createLimiter } = require('../middleware/rateLimiter');

router.get('/', createLimiter(60, 'banners'), getBanners);
module.exports = router;
