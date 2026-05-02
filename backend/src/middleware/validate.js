const { z } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * validate — Zod schema validation middleware factory
 * Validates req.body against a Zod schema
 * Attaches parsed (type-coerced, stripped) data back to req.body
 *
 * Usage: router.post('/path', validate(myZodSchema), controller)
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw ApiError.badRequest('Validation failed', errors);
  }

  req.body = result.data; // Use sanitized, coerced data going forward
  next();
};

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'), // bcrypt max
  role: z.enum(['JOB_SEEKER', 'EMPLOYER']).optional().default('JOB_SEEKER'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(20),
  skills: z.array(z.string()).min(1, 'At least one skill required'),
  location: z.string().min(2).max(100),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
}).refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
  { message: 'salaryMax must be >= salaryMin', path: ['salaryMax'] }
);

const applyJobSchema = z.object({
  coverLetter: z.string().max(2000).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED']),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createJobSchema,
  applyJobSchema,
  updateStatusSchema,
};
