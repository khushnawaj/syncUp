const router = require('express').Router();
const { getUploadUrl, confirmUpload } = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth');

// Both seekers and employers can upload resumes
router.post('/presign', authenticate, getUploadUrl);
router.post('/confirm', authenticate, confirmUpload);

module.exports = router;
