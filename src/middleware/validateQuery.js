const validateQuery = (fields) => (req, res, next) => {
  for (const field of fields) {
    if (!req.query[field]) {
      return res.status(400).json({ error: { code: 400, message: `Missing required query param: ${field}` } });
    }
    if ((field === 'lat' || field === 'lng') && isNaN(parseFloat(req.query[field]))) {
      return res.status(422).json({ error: { code: 422, message: `Invalid value for ${field}: must be a number` } });
    }
    if (field === 'q' && req.query.q.length < 2) {
      return res.status(400).json({ error: { code: 400, message: 'Query must be at least 2 characters' } });
    }
  }
  next();
};

module.exports = validateQuery;
