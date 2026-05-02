const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.register({ name, email, password, role });
  res.status(201).json(new ApiResponse(201, result, 'Account created successfully'));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, user));
});

module.exports = { register, login, getProfile };
