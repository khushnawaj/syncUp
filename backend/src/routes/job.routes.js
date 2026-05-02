const router = require('express').Router();
const {
  createJob, listJobs, getJob, updateJob, deleteJob, getMyJobs,
} = require('../controllers/job.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createJobSchema } = require('../middleware/validate');

// Public
router.get('/', listJobs);
router.get('/:id', getJob);

// Employer only
router.post('/', authenticate, authorize('EMPLOYER'), validate(createJobSchema), createJob);
router.get('/my/listings', authenticate, authorize('EMPLOYER'), getMyJobs);
router.put('/:id', authenticate, authorize('EMPLOYER'), updateJob);
router.delete('/:id', authenticate, authorize('EMPLOYER'), deleteJob);

module.exports = router;
