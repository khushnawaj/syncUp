const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const applicationService = require('../services/application.service');

// getIO is injected at startup from server.js
let _getIO = () => null;
const setGetIO = (fn) => { _getIO = fn; };

const applyToJob = asyncHandler(async (req, res) => {
  const { coverLetter, resumeText } = req.body;
  const application = await applicationService.applyToJob({
    jobId: req.params.jobId,
    applicantId: req.user.id,
    coverLetter,
    resumeText,
    file: req.file, // Passed from multer
    getIO: _getIO,
  });
  res.status(201).json(new ApiResponse(201, application, 'Application submitted'));
});

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getApplicationsByApplicant(req.user.id);
  res.status(200).json(new ApiResponse(200, applications));
});

const getJobApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getApplicationsByJob(
    req.params.jobId,
    req.user.id
  );
  res.status(200).json(new ApiResponse(200, applications));
});

const updateStatus = asyncHandler(async (req, res) => {
  const updated = await applicationService.updateApplicationStatus({
    applicationId: req.params.id,
    employerId: req.user.id,
    status: req.body.status,
    getIO: _getIO,
  });
  res.status(200).json(new ApiResponse(200, updated, 'Application status updated'));
});

module.exports = { applyToJob, getMyApplications, getJobApplications, updateStatus, setGetIO };
