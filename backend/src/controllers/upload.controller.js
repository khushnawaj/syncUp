const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const uploadService = require('../services/upload.service');

/**
 * Step 1: Client requests a pre-signed URL
 * Client sends: { fileType: "application/pdf" }
 * Server returns: { presignedUrl, publicUrl }
 * Client then PUTs file directly to presignedUrl
 * Client then calls confirmUpload with publicUrl
 */
const getUploadUrl = asyncHandler(async (req, res) => {
  const { fileType } = req.body;

  if (!fileType) {
    return res.status(400).json(new ApiResponse(400, null, 'fileType is required'));
  }

  const result = await uploadService.getPresignedUploadUrl(req.user.id, fileType);
  res.status(200).json(new ApiResponse(200, result, 'Pre-signed URL generated'));
});

/**
 * Step 2: After successful S3 upload, update user's resumeUrl in DB
 */
const confirmUpload = asyncHandler(async (req, res) => {
  const { resumeUrl } = req.body;

  if (!resumeUrl) {
    return res.status(400).json(new ApiResponse(400, null, 'resumeUrl is required'));
  }

  // Delete old resume from S3 if user had one
  if (req.user.resumeUrl) {
    await uploadService.deleteOldResume(req.user.resumeUrl);
  }

  const user = await uploadService.confirmResumeUpload(req.user.id, resumeUrl);
  res.status(200).json(new ApiResponse(200, user, 'Resume updated successfully'));
});

module.exports = { getUploadUrl, confirmUpload };
