const { Banner } = require('../models');
const cache = require('./cacheService');

const CACHE_KEY = 'banners:active';
const TTL = 3600;

const getActiveBanners = async () => {
  const cached = await cache.get(CACHE_KEY);
  if (cached) return cached;

  const banners = await Banner.findAll({
    where: { isActive: true },
    order: [['display_order', 'ASC']],
  });

  const result = banners.map((b) => ({
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl,
    isActive: b.isActive,
    displayOrder: b.displayOrder,
  }));

  try {
    await cache.set(CACHE_KEY, result, TTL);
  } catch { /* cache write failure must never break the response */ }
  return result;
};

module.exports = { getActiveBanners };
