const { getRedisClient } = require('../config/redis');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

const redis = getRedisClient();
const CACHE_TTL = 300; // 5 minutes

/**
 * Safe Redis wrappers — gracefully degrade to DB-only when Redis is unavailable.
 * This handles: local dev without Redis, Redis restarts, network blips on Upstash.
 * Production behavior: cache miss on Redis failure, but requests still succeed.
 */
const safeGet = async (key) => {
  try { return await redis.get(key); } catch { return null; }
};
const safeSetex = async (key, ttl, value) => {
  try { await redis.setex(key, ttl, value); } catch { /* non-fatal */ }
};
const safeInvalidate = async (...keys) => {
  try {
    const listKeys = await redis.keys('jobs:list:*').catch(() => []);
    const allKeys = [...keys, ...listKeys].filter(Boolean);
    if (allKeys.length) await redis.del(...allKeys);
  } catch { /* non-fatal */ }
};

const buildCacheKey = (page, limit, filters) =>
  `jobs:list:${page}:${limit}:${JSON.stringify(filters)}`;

// ─────────────────────────────────────────────

const createJob = async ({ title, description, skills, location, salaryMin, salaryMax, employerId }) => {
  const job = await prisma.job.create({
    data: { title, description, skills, location, salaryMin, salaryMax, employerId },
    include: { employer: { select: { id: true, name: true, email: true } } },
  });
  await safeInvalidate(); // Bust all list caches
  return job;
};

const listJobs = async ({ page = 1, limit = 10, search, location, skills }) => {
  const filters = { search, location, skills };
  const cacheKey = buildCacheKey(page, limit, filters);

  const cached = await safeGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(location && { location: { contains: location, mode: 'insensitive' } }),
    ...(skills && { skills: { hasSome: skills.split(',').map((s) => s.trim()) } }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { employer: { select: { id: true, name: true } } },
    }),
    prisma.job.count({ where }),
  ]);

  const result = {
    jobs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };

  await safeSetex(cacheKey, CACHE_TTL, JSON.stringify(result));
  return result;
};

const getJobById = async (jobId) => {
  const cacheKey = `job:${jobId}`;

  const cached = await safeGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      employer: { select: { id: true, name: true, email: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) throw ApiError.notFound('Job not found');
  if (!job.isActive) throw ApiError.notFound('This job is no longer active');

  await safeSetex(cacheKey, 600, JSON.stringify(job));
  return job;
};

const updateJob = async (jobId, employerId, data) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw ApiError.notFound('Job not found');
  if (job.employerId !== employerId) throw ApiError.forbidden('You do not own this job');

  const updated = await prisma.job.update({ where: { id: jobId }, data });
  await safeInvalidate(`job:${jobId}`);
  return updated;
};

const deleteJob = async (jobId, employerId) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw ApiError.notFound('Job not found');
  if (job.employerId !== employerId) throw ApiError.forbidden('You do not own this job');

  await prisma.job.update({ where: { id: jobId }, data: { isActive: false } });
  await safeInvalidate(`job:${jobId}`);
};

const getEmployerJobs = async (employerId) => {
  return prisma.job.findMany({
    where: { employerId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });
};

module.exports = { createJob, listJobs, getJobById, updateJob, deleteJob, getEmployerJobs };
