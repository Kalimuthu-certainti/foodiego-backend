const restaurantService = require('../services/restaurantService');

const getTopRated = async (req, res, next) => {
  try {
    const { lat, lng, limit } = req.query;
    const restaurants = await restaurantService.getTopRated(lat, lng, limit);
    res.json({ restaurants, total: restaurants.length });
  } catch (err) { next(err); }
};

const getRestaurantsWithOffers = async (req, res, next) => {
  try {
    const { lat, lng, limit } = req.query;
    const restaurants = await restaurantService.getRestaurantsWithOffers(lat, lng, limit);
    res.json({ restaurants, total: restaurants.length });
  } catch (err) { next(err); }
};

const getRestaurants = async (req, res, next) => {
  try {
    const { lat, lng, page = 1, limit = 20, ...filters } = req.query;
    const result = await restaurantService.getRestaurants(lat, lng, filters, page, limit);
    res.json(result);
  } catch (err) { next(err); }
};

module.exports = { getTopRated, getRestaurantsWithOffers, getRestaurants };
