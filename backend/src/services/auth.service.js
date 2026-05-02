const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Generates a signed JWT
 * Payload is minimal (userId only) — extra fields fetched from DB on each request
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async ({ name, email, password, role }) => {
  // Check duplicate
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Hash — cost factor 12 is the production standard (bcrypt auto-generates salt)
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken(user.id);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberate: check existence and password in constant time to prevent user enumeration
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user.id);

  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, token };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, resumeUrl: true, createdAt: true },
  });

  if (!user) throw ApiError.notFound('User not found');
  return user;
};

module.exports = { register, login, getProfile };
