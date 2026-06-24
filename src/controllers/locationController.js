const locationService = require('../services/locationService');

const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const result = await locationService.reverseGeocode(lat, lng);
    res.json(result);
  } catch (err) { next(err); }
};

const searchLocation = async (req, res, next) => {
  try {
    const { q } = req.query;
    const results = await locationService.searchLocation(q);
    res.json({ results, count: results.length });
  } catch (err) { next(err); }
};

module.exports = { reverseGeocode, searchLocation };
