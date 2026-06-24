const orderService = require('../services/orderService');

const getReorderRestaurants = async (req, res, next) => {
  try {
    const restaurants = await orderService.getReorderRestaurants(req.diner.userId);
    res.json({ restaurants });
  } catch (err) { next(err); }
};

module.exports = { getReorderRestaurants };
