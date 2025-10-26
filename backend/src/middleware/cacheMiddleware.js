const logger = require('../utils/logger');

// Simple in-memory cache (for development without Redis)
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, duration) {
    this.cache.set(key, value);

    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, duration * 1000);

    this.timers.set(key, timer);
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Initialize cache client
let cacheClient;

try {
  // Try to use Redis if available
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    const redis = require('redis');
    const redisUrl = process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

    cacheClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries, falling back to memory cache');
            return new Error('Max retries reached');
          }
          return retries * 100;
        }
      }
    });

    cacheClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      // Fallback to memory cache
      if (!cacheClient.isReady) {
        logger.info('Falling back to in-memory cache');
        cacheClient = new MemoryCache();
      }
    });

    cacheClient.on('connect', () => {
      logger.info('Redis cache connected successfully');
    });

    cacheClient.connect().catch(() => {
      logger.warn('Redis not available, using in-memory cache');
      cacheClient = new MemoryCache();
    });
  } else {
    // Use in-memory cache if Redis not configured
    logger.info('Redis not configured, using in-memory cache');
    cacheClient = new MemoryCache();
  }
} catch (error) {
  logger.warn('Redis module not installed, using in-memory cache');
  cacheClient = new MemoryCache();
}

/**
 * Cache middleware for Express routes
 * @param {number} duration - Cache duration in seconds
 * @param {function} keyGenerator - Optional function to generate cache key
 * @returns {function} Express middleware
 */
const cacheMiddleware = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.originalUrl}`;

    try {
      // Try to get from cache
      let cachedData;

      if (cacheClient instanceof MemoryCache) {
        cachedData = cacheClient.get(cacheKey);
      } else if (cacheClient.isReady) {
        cachedData = await cacheClient.get(cacheKey);
        if (cachedData) {
          cachedData = JSON.parse(cachedData);
        }
      }

      // If cached data exists, return it
      if (cachedData) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.json({
          ...cachedData,
          _cached: true,
          _cacheTime: new Date().toISOString()
        });
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = (body) => {
        // Cache the response
        if (res.statusCode === 200 && body) {
          if (cacheClient instanceof MemoryCache) {
            cacheClient.set(cacheKey, body, duration);
          } else if (cacheClient.isReady) {
            cacheClient.setEx(cacheKey, duration, JSON.stringify(body))
              .catch(err => logger.error('Cache set error:', err));
          }
        }

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Cache key pattern
 */
const clearCache = async (pattern) => {
  try {
    if (cacheClient instanceof MemoryCache) {
      // For memory cache, clear keys matching pattern
      const keys = Array.from(cacheClient.cache.keys());
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cacheClient.delete(key);
        }
      });
      logger.info(`Cleared ${keys.length} cache entries matching: ${pattern}`);
    } else if (cacheClient.isReady) {
      const keys = await cacheClient.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await cacheClient.del(keys);
        logger.info(`Cleared ${keys.length} cache entries matching: ${pattern}`);
      }
    }
  } catch (error) {
    logger.error('Clear cache error:', error);
  }
};

/**
 * Clear all cache
 */
const clearAllCache = async () => {
  try {
    if (cacheClient instanceof MemoryCache) {
      cacheClient.clear();
      logger.info('All cache cleared (memory)');
    } else if (cacheClient.isReady) {
      await cacheClient.flushAll();
      logger.info('All cache cleared (Redis)');
    }
  } catch (error) {
    logger.error('Clear all cache error:', error);
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
  try {
    if (cacheClient instanceof MemoryCache) {
      return {
        type: 'memory',
        size: cacheClient.size(),
        keys: Array.from(cacheClient.cache.keys())
      };
    } else if (cacheClient.isReady) {
      const info = await cacheClient.info('stats');
      const dbSize = await cacheClient.dbSize();
      return {
        type: 'redis',
        size: dbSize,
        info
      };
    }
  } catch (error) {
    logger.error('Get cache stats error:', error);
    return { type: 'unknown', error: error.message };
  }
};

/**
 * Custom cache key generators
 */
const cacheKeyGenerators = {
  // Dashboard stats key includes store filter
  dashboardStats: (req) => {
    const storeId = req.query.store_id || 'all';
    return `cache:dashboard:stats:${storeId}`;
  },

  // Trolley list key includes filters
  trolleyList: (req) => {
    const { status, store_id, search, limit, offset } = req.query;
    return `cache:trolleys:${status || 'all'}:${store_id || 'all'}:${search || 'none'}:${limit || 100}:${offset || 0}`;
  },

  // Store list key
  storeList: () => 'cache:stores:all',

  // Single store key
  store: (req) => `cache:store:${req.params.id}`,

  // Alert list key
  alertList: (req) => {
    const { store_id, resolved } = req.query;
    return `cache:alerts:${store_id || 'all'}:${resolved || 'all'}`;
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearAllCache,
  getCacheStats,
  cacheKeyGenerators,
  cacheClient
};
