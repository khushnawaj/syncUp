const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/s3');
const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Generates a pre-signed URL for direct-to-S3 upload from browser
 * Why pre-signed URLs vs server proxy?
 * - File never passes through EC2 → no memory/bandwidth bottleneck
 * - Works within EC2 free tier bandwidth limits
 * - Client uploads directly to S3 over HTTPS
 */
const getPresignedUploadUrl = async (userId, fileType) => {
  if (!['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(fileType)) {
    throw new Error('Only PDF and Word documents are allowed');
  }

  const ext = fileType === 'application/pdf' ? 'pdf' : 'docx';
  const key = `resumes/${userId}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
    Metadata: { userId },
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min

  const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { presignedUrl, publicUrl, key };
};

/**
 * Called after successful upload to update the user's resumeUrl in DB
 */
const confirmResumeUpload = async (userId, resumeUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { resumeUrl },
    select: { id: true, name: true, email: true, resumeUrl: true },
  });
};

/**
 * Delete old resume from S3 when user uploads a new one
 * Key is extracted from the URL
 */
const deleteOldResume = async (resumeUrl) => {
  try {
    const url = new URL(resumeUrl);
    const key = url.pathname.slice(1); // Remove leading /
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // Non-fatal — log but don't fail the request
    console.warn('Could not delete old resume from S3');
  }
};

module.exports = { getPresignedUploadUrl, confirmResumeUpload, deleteOldResume };
