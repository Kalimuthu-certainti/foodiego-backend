const cuisineService = require('../services/cuisineService');

const getCuisines = async (req, res, next) => {
  try {
    const cuisines = await cuisineService.getAllCuisines();
    res.json({ cuisines });
  } catch (err) { next(err); }
};

module.exports = { getCuisines };
