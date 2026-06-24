const router = require('express').Router();
const ctrl = require('../controllers/restaurantController');
const validateQuery = require('../middleware/validateQuery');
const optionalAuth = require('../middleware/optionalAuth');
const { createLimiter } = require('../middleware/rateLimiter');

const limiter = createLimiter(100, 'restaurants');
const validate = validateQuery(['lat', 'lng']);

router.get('/top-rated', limiter, validate, ctrl.getTopRated);
router.get('/offers',    limiter, validate, ctrl.getRestaurantsWithOffers);
router.get('/',          limiter, validate, optionalAuth, ctrl.getRestaurants);
module.exports = router;
