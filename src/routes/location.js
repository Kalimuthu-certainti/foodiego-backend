const router = require('express').Router();
const ctrl = require('../controllers/locationController');
const validateQuery = require('../middleware/validateQuery');
const { createLimiter } = require('../middleware/rateLimiter');

const limiter = createLimiter(30, 'location');

router.get('/reverse-geocode', limiter, validateQuery(['lat', 'lng']), ctrl.reverseGeocode);
router.get('/search',          limiter, validateQuery(['q']), ctrl.searchLocation);
module.exports = router;
