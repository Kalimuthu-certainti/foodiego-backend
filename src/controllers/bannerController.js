const bannerService = require('../services/bannerService');

const getBanners = async (req, res, next) => {
  try {
    const banners = await bannerService.getActiveBanners();
    res.json({ banners });
  } catch (err) { next(err); }
};

module.exports = { getBanners };
