const { Cuisine } = require('../models');
const cache = require('./cacheService');

const CACHE_KEY = 'cuisines:all';
const TTL = 86400;

const getAllCuisines = async () => {
  const cached = await cache.get(CACHE_KEY);
  if (cached) return cached;

  const cuisines = await Cuisine.findAll({
    where: { isActive: true },
    order: [['display_order', 'ASC']],
  });

  const result = cuisines.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    iconUrl: c.iconUrl,
    displayOrder: c.displayOrder,
  }));

  await cache.set(CACHE_KEY, result, TTL);
  return result;
};

module.exports = { getAllCuisines };
