const redis = require('redis');
const { logger } = require('../utils/logger');
const config = require('../config');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initializeClient();
  }

  initializeClient() {
    if (!config.redis.url) {
      logger.warn('Redis URL not configured. Caching will be disabled.');
      return;
    }

    this.client = redis.createClient({
      url: config.redis.url,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
      this.isConnected = false;
    });

    // Connect to Redis
    this.client.connect().catch((err) => {
      logger.error('Failed to connect to Redis:', err);
      this.isConnected = false;
    });
  }

  async get(key) {
    if (!this.isConnected || !this.client) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error('Redis SET error:', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', { key, error: error.message });
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', { key, error: error.message });
      return false;
    }
  }

  async flush() {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Redis FLUSH error:', { error: error.message });
      return false;
    }
  }

  // Cache key generators
  static getArticleKey(id) {
    return `article:${id}`;
  }

  static getArticleListKey(filters) {
    const filterStr = Object.keys(filters).sort().map(key => `${key}:${filters[key]}`).join('|');
    return `articles:list:${filterStr}`;
  }

  static getUserKey(id) {
    return `user:${id}`;
  }

  static getCommentKey(id) {
    return `comment:${id}`;
  }

  static getTagKey(slug) {
    return `tag:${slug}`;
  }

  static getCategoryKey(slug) {
    return `category:${slug}`;
  }

  static getAnalyticsKey(type, period) {
    return `analytics:${type}:${period}`;
  }

  // Cache invalidation helpers
  async invalidateArticle(id) {
    const keys = [
      CacheService.getArticleKey(id),
      CacheService.getArticleListKey({}),
    ];
    
    for (const key of keys) {
      await this.del(key);
    }
  }

  async invalidateUser(id) {
    await this.del(CacheService.getUserKey(id));
  }

  async invalidateComments(articleId) {
    // Invalidate comment-related caches
    const pattern = `comments:*:${articleId}`;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Redis KEYS error:', { pattern, error: error.message });
    }
  }

  async invalidateAnalytics() {
    const pattern = 'analytics:*';
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Redis KEYS error:', { pattern, error: error.message });
    }
  }

  // Cache middleware for Express routes
  cacheMiddleware(ttlSeconds = 300) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      const cacheKey = `${req.method}:${req.originalUrl}`;
      
      try {
        const cached = await this.get(cacheKey);
        if (cached) {
          logger.debug('Cache hit:', { key: cacheKey });
          return res.json(cached);
        }
      } catch (error) {
        logger.error('Cache middleware error:', { key: cacheKey, error: error.message });
      }

      // Store original res.json
      const originalJson = res.json.bind(res);
      
      res.json = (data) => {
        // Cache the response
        this.set(cacheKey, data, ttlSeconds).catch(err => {
          logger.error('Failed to cache response:', { key: cacheKey, error: err.message });
        });
        
        // Send the response
        return originalJson(data);
      };

      next();
    };
  }

  // Close connection
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

module.exports = new CacheService();
