const router = require('express').Router();
const prisma = require('../config/db');
const { getRedisClient } = require('../config/redis');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { authenticate } = require('../middleware/auth');

// GET /notifications — paginated, newest first
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(new ApiResponse(200, notifications));
  })
);

// PATCH /notifications/:id/read
router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json(new ApiResponse(404, null, 'Notification not found'));
    }
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(new ApiResponse(200, updated));
  })
);

// PATCH /notifications/read-all
router.patch(
  '/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json(new ApiResponse(200, null, 'All notifications marked as read'));
  })
);

module.exports = router;
