const cache = require('./cacheService');
const axios = require('axios');

const reverseGeocode = async (lat, lng) => {
  const cacheKey = `geocode:${parseFloat(lat).toFixed(4)}:${parseFloat(lng).toFixed(4)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'User-Agent': 'FoodieGO/1.0' } },
  );

  const addr = data.address || {};
  const result = {
    areaName: addr.suburb || addr.neighbourhood || addr.town || addr.village || 'Unknown Area',
    city: addr.city || addr.state_district || '',
    state: addr.state || '',
    pincode: addr.postcode || '',
    lat: parseFloat(lat),
    lng: parseFloat(lng),
  };

  await cache.set(cacheKey, result, 86400);
  return result;
};

const searchLocation = async (query) => {
  const cacheKey = `location:search:${query.toLowerCase().trim()}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=5&addressdetails=1`,
    { headers: { 'User-Agent': 'FoodieGO/1.0' } },
  );

  const results = data.map((item) => ({
    areaName: item.address?.suburb || item.address?.neighbourhood || item.name,
    city: item.address?.city || item.address?.state_district || '',
    state: item.address?.state || '',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));

  await cache.set(cacheKey, results, 3600);
  return results;
};

module.exports = { reverseGeocode, searchLocation };
