'use strict';

// ─── Mock dependencies before requiring the service ───────────────────────────

jest.mock('../models', () => ({
  Banner: { findAll: jest.fn() },
}));

jest.mock('../services/cacheService', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

const { Banner } = require('../models');
const cache = require('../services/cacheService');
const { getActiveBanners } = require('../services/bannerService');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_BANNERS = [
  {
    id: 1,
    title: 'Summer Sale',
    imageUrl: 'https://cdn.example.com/summer.jpg',
    linkUrl: '/offers/summer',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 2,
    title: 'Free Delivery',
    imageUrl: 'https://cdn.example.com/delivery.jpg',
    linkUrl: '/offers/delivery',
    isActive: true,
    displayOrder: 2,
  },
];

// What getActiveBanners should return after mapping raw DB rows
const MAPPED_BANNERS = RAW_BANNERS.map((b) => ({
  id: b.id,
  title: b.title,
  imageUrl: b.imageUrl,
  linkUrl: b.linkUrl,
  isActive: b.isActive,
  displayOrder: b.displayOrder,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('bannerService.getActiveBanners', () => {
  // ── Cache hit ──────────────────────────────────────────────────────────────

  describe('when cache has data', () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(MAPPED_BANNERS);
    });

    it('returns cached banners without querying the DB', async () => {
      const result = await getActiveBanners();

      expect(result).toEqual(MAPPED_BANNERS);
      expect(cache.get).toHaveBeenCalledWith('banners:active');
      expect(Banner.findAll).not.toHaveBeenCalled();
    });

    it('does not write to cache when data is already cached', async () => {
      await getActiveBanners();

      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  // ── Cache miss ─────────────────────────────────────────────────────────────

  describe('when cache is empty', () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(null);
      Banner.findAll.mockResolvedValue(RAW_BANNERS);
      cache.set.mockResolvedValue(undefined);
    });

    it('queries Banner.findAll with isActive:true ordered by display_order ASC', async () => {
      await getActiveBanners();

      expect(Banner.findAll).toHaveBeenCalledWith({
        where: { isActive: true },
        order: [['display_order', 'ASC']],
      });
    });

    it('maps raw DB rows to the correct shape', async () => {
      const result = await getActiveBanners();

      expect(result).toEqual(MAPPED_BANNERS);
    });

    it('maps every banner field correctly', async () => {
      const result = await getActiveBanners();

      result.forEach((banner, i) => {
        expect(banner).toMatchObject({
          id: RAW_BANNERS[i].id,
          title: RAW_BANNERS[i].title,
          imageUrl: RAW_BANNERS[i].imageUrl,
          linkUrl: RAW_BANNERS[i].linkUrl,
          isActive: RAW_BANNERS[i].isActive,
          displayOrder: RAW_BANNERS[i].displayOrder,
        });
      });
    });

    it('stores the mapped result in cache with key "banners:active" and TTL 3600', async () => {
      await getActiveBanners();

      expect(cache.set).toHaveBeenCalledWith('banners:active', MAPPED_BANNERS, 3600);
    });

    it('returns an empty array when no active banners exist in DB', async () => {
      Banner.findAll.mockResolvedValue([]);

      const result = await getActiveBanners();

      expect(result).toEqual([]);
      expect(cache.set).toHaveBeenCalledWith('banners:active', [], 3600);
    });

    it('returns banners in the order DB provides them', async () => {
      const reordered = [...RAW_BANNERS].reverse();
      Banner.findAll.mockResolvedValue(reordered);

      const result = await getActiveBanners();

      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(1);
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(null);
    });

    it('throws when Banner.findAll rejects', async () => {
      Banner.findAll.mockRejectedValue(new Error('DB connection lost'));

      await expect(getActiveBanners()).rejects.toThrow('DB connection lost');
    });

    it('still returns data even when cache.set fails silently', async () => {
      Banner.findAll.mockResolvedValue(RAW_BANNERS);
      cache.set.mockRejectedValue(new Error('Redis unavailable'));

      // cache.set failures are caught inside cacheService — service should not throw
      // This test verifies the returned value is correct regardless
      const result = await getActiveBanners();
      expect(result).toEqual(MAPPED_BANNERS);
    });
  });

  // ── Data integrity ─────────────────────────────────────────────────────────

  describe('data integrity', () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(null);
      cache.set.mockResolvedValue(undefined);
    });

    it('does not include extra fields from the DB model', async () => {
      const rowWithExtras = {
        ...RAW_BANNERS[0],
        createdAt: '2024-01-01',
        updatedAt: '2024-06-01',
        someInternalField: 'secret',
      };
      Banner.findAll.mockResolvedValue([rowWithExtras]);

      const [banner] = await getActiveBanners();

      expect(banner).not.toHaveProperty('createdAt');
      expect(banner).not.toHaveProperty('updatedAt');
      expect(banner).not.toHaveProperty('someInternalField');
    });

    it('returns exactly 6 fields per banner', async () => {
      Banner.findAll.mockResolvedValue([RAW_BANNERS[0]]);

      const [banner] = await getActiveBanners();

      expect(Object.keys(banner)).toHaveLength(6);
      expect(Object.keys(banner)).toEqual(
        expect.arrayContaining(['id', 'title', 'imageUrl', 'linkUrl', 'isActive', 'displayOrder'])
      );
    });

    it('handles a single banner correctly', async () => {
      Banner.findAll.mockResolvedValue([RAW_BANNERS[0]]);

      const result = await getActiveBanners();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });
});
