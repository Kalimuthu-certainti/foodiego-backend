const orderService = require('../services/orderService');

const getReorderRestaurants = async (req, res, next) => {
  try {
    const restaurants = await orderService.getReorderRestaurants(req.dinerId);
    res.json({ restaurants });
  } catch (err) { next(err); }
};

module.exports = { getReorderRestaurants };
