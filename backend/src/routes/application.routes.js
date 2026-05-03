const router = require('express').Router();
const {
  applyToJob, getMyApplications, getJobApplications, updateStatus,
} = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, applyJobSchema, updateStatusSchema } = require('../middleware/validate');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Seeker: apply to a job
router.post('/jobs/:jobId/apply', authenticate, authorize('JOB_SEEKER'), upload.single('resume'), validate(applyJobSchema), applyToJob);

// Seeker: view my applications
router.get('/my', authenticate, authorize('JOB_SEEKER'), getMyApplications);

// Employer: view all applications for a specific job
router.get('/jobs/:jobId', authenticate, authorize('EMPLOYER'), getJobApplications);

// Employer: update application status
router.patch('/:id/status', authenticate, authorize('EMPLOYER'), validate(updateStatusSchema), updateStatus);

module.exports = router;
