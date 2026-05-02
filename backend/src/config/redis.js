const Redis = require('ioredis');

let redis;

const getRedisClient = () => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Upstash requires TLS — ioredis handles rediss:// automatically
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => console.error('❌ Redis error:', err.message));
  }
  return redis;
};

module.exports = { getRedisClient };
