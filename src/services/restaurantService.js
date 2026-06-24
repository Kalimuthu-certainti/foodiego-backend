const { Restaurant, RestaurantOffer } = require('../models');
const { Op } = require('sequelize');
const cache = require('./cacheService');

const buildRestaurantCard = (row, offer = null) => ({
  id: row.id,
  name: row.name,
  cuisineTags: row.cuisineTags || [],
  rating: parseFloat(row.rating) || 0,
  minOrder: row.minOrder,
  deliveryTime: 'Coming Soon',
  imageUrl: row.imageUrl,
  isVeg: row.isVeg,
  isClosed: row.isClosed,
  isOpen: !row.isClosed,
  cuisines: row.cuisineTags || [],
  closedUntil: row.closedUntil || null,
  offerBadge: offer ? offer.offerText : null,
  isFeatured: false,
});

const getTopRated = async (lat, lng, limit = 10) => {
  const cacheKey = `toprated:${parseFloat(lat).toFixed(2)}:${parseFloat(lng).toFixed(2)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const restaurants = await Restaurant.findAll({
    where: { isActive: true, isClosed: false, rating: { [Op.gte]: 4.5 } },
    order: [['rating', 'DESC']],
    limit: parseInt(limit),
  });

  const result = restaurants.map((r) => buildRestaurantCard(r));
  await cache.set(cacheKey, result, 300);
  return result;
};

const getRestaurantsWithOffers = async (lat, lng, limit = 10) => {
  const cacheKey = `offers:${parseFloat(lat).toFixed(2)}:${parseFloat(lng).toFixed(2)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const restaurants = await Restaurant.findAll({
    where: { isActive: true },
    include: [{
      model: RestaurantOffer,
      as: 'offers',
      where: { isActive: true, endDate: { [Op.gt]: now } },
      required: true,
    }],
    limit: parseInt(limit),
  });

  const result = restaurants.map((r) => buildRestaurantCard(r, r.offers[0]));
  await cache.set(cacheKey, result, 300);
  return result;
};

const getRestaurants = async (lat, lng, filters = {}, page = 1, limit = 20) => {
  const cacheKey = cache.buildRestaurantKey(lat, lng, filters, page);
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const where = { isActive: true };
  if (filters.cuisine) where.cuisineTags = { [Op.contains]: [filters.cuisine] };
  if (filters.rating) where.rating = { [Op.gte]: parseFloat(filters.rating) };
  if (filters.vegOnly === 'true' || filters.vegOnly === true) where.isVeg = true;
  if (filters.price === 'low') where.minOrder = { [Op.lte]: 200 };
  if (filters.price === 'mid') where.minOrder = { [Op.between]: [201, 400] };
  if (filters.price === 'high') where.minOrder = { [Op.gte]: 401 };

  const order = [];
  if (filters.sortBy === 'rating') order.push(['rating', 'DESC']);
  else if (filters.sortBy === 'costLow') order.push(['min_order', 'ASC']);
  else if (filters.sortBy === 'costHigh') order.push(['min_order', 'DESC']);
  else order.push(['rating', 'DESC']);
  order.push(['is_closed', 'ASC']);

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { rows: restaurants, count: total } = await Restaurant.findAndCountAll({
    where,
    include: [{ model: RestaurantOffer, as: 'offers', where: { isActive: true }, required: false }],
    order,
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  const totalPages = Math.ceil(total / limit);
  const hasMore = parseInt(page) < totalPages;
  const result = {
    restaurants: restaurants.map((r) => buildRestaurantCard(r, r.offers?.[0])),
    total,
    currentPage: parseInt(page),
    totalPages,
    nextPage: hasMore ? parseInt(page) + 1 : null,
    hasMore,
  };

  await cache.set(cacheKey, result, 120);
  return result;
};

module.exports = { getTopRated, getRestaurantsWithOffers, getRestaurants };
