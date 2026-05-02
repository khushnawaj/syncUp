const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const jobService = require('../services/job.service');

const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob({ ...req.body, employerId: req.user.id });
  res.status(201).json(new ApiResponse(201, job, 'Job posted successfully'));
});

const listJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, location, skills } = req.query;
  const result = await jobService.listJobs({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    location,
    skills,
  });
  res.status(200).json(new ApiResponse(200, result));
});

const getJob = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(req.params.id);
  res.status(200).json(new ApiResponse(200, job));
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.updateJob(req.params.id, req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, job, 'Job updated successfully'));
});

const deleteJob = asyncHandler(async (req, res) => {
  await jobService.deleteJob(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, null, 'Job removed successfully'));
});

const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.getEmployerJobs(req.user.id);
  res.status(200).json(new ApiResponse(200, jobs));
});

module.exports = { createJob, listJobs, getJob, updateJob, deleteJob, getMyJobs };
