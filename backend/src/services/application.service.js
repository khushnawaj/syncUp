const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const openai = require('../config/openai');
const { getRedisClient } = require('../config/redis');

const redis = getRedisClient();

/**
 * Score a resume against a job description using OpenAI
 * Cost-efficient: gpt-3.5-turbo + 500 word truncation ≈ ~800 tokens ≈ $0.001/call
 */
const computeMatchScore = async (jobDescription, resumeText) => {
  // Truncate resume to control token usage
  const truncatedResume = resumeText.split(' ').slice(0, 500).join(' ');

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    max_tokens: 10, // We only need a number back
    temperature: 0,  // Deterministic scoring
    messages: [
      {
        role: 'system',
        content: 'You are a resume evaluator. Respond with ONLY a number between 0 and 100.',
      },
      {
        role: 'user',
        content: `Job Description:\n${jobDescription}\n\nResume:\n${truncatedResume}\n\nScore this resume for the job. Reply with only an integer 0-100.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  const score = parseInt(raw, 10);
  return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
};

const applyToJob = async ({ jobId, applicantId, coverLetter, resumeText, getIO }) => {
  // Verify job exists and is active
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw ApiError.notFound('Job not found');
  if (!job.isActive) throw ApiError.badRequest('This job is no longer accepting applications');
  if (job.employerId === applicantId) throw ApiError.badRequest('You cannot apply to your own job');

  // Check duplicate — DB also enforces @@unique but we give a friendlier message here
  const existing = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId, applicantId } },
  });
  if (existing) throw ApiError.conflict('You have already applied to this job');

  // Get applicant for resume snapshot
  const applicant = await prisma.user.findUnique({
    where: { id: applicantId },
    select: { resumeUrl: true },
  });

  // Create application with PENDING status
  const application = await prisma.application.create({
    data: {
      jobId,
      applicantId,
      coverLetter,
      resumeUrl: applicant.resumeUrl,
      status: 'PENDING',
    },
    include: { job: { select: { title: true, employerId: true } } },
  });

  // Fire-and-forget AI scoring — don't block the response
  if (resumeText) {
    setImmediate(async () => {
      try {
        const score = await computeMatchScore(job.description, resumeText);
        await prisma.application.update({
          where: { id: application.id },
          data: { matchScore: score },
        });

        // Notify employer via WebSocket
        const io = getIO();
        if (io) {
          io.to(`user:${job.employerId}`).emit('notification:new', {
            type: 'NEW_APPLICATION',
            message: `New application for "${job.title}" — Match Score: ${score}`,
            metadata: { applicationId: application.id, jobId, score },
          });
        }
      } catch (err) {
        console.error('AI scoring failed:', err.message);
      }
    });
  }

  return application;
};

const getApplicationsByApplicant = async (applicantId) => {
  return prisma.application.findMany({
    where: { applicantId },
    orderBy: { createdAt: 'desc' },
    include: {
      job: {
        select: { id: true, title: true, location: true, employer: { select: { name: true } } },
      },
    },
  });
};

const getApplicationsByJob = async (jobId, employerId) => {
  // Verify ownership
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw ApiError.notFound('Job not found');
  if (job.employerId !== employerId) throw ApiError.forbidden('Access denied');

  return prisma.application.findMany({
    where: { jobId },
    orderBy: [{ matchScore: 'desc' }, { createdAt: 'asc' }], // Highest score first
    include: {
      applicant: { select: { id: true, name: true, email: true, resumeUrl: true } },
    },
  });
};

const updateApplicationStatus = async ({ applicationId, employerId, status, getIO }) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { select: { title: true, employerId: true } } },
  });

  if (!application) throw ApiError.notFound('Application not found');
  if (application.job.employerId !== employerId) throw ApiError.forbidden('Access denied');

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });

  // Persist notification to DB
  const notification = await prisma.notification.create({
    data: {
      userId: application.applicantId,
      type: 'APPLICATION_UPDATE',
      message: `Your application for "${application.job.title}" has been updated to: ${status}`,
      metadata: { applicationId, jobId: application.jobId, status },
    },
  });

  // Emit real-time update to applicant
  const io = getIO();
  if (io) {
    io.to(`user:${application.applicantId}`).emit('notification:new', {
      type: notification.type,
      message: notification.message,
      metadata: notification.metadata,
    });
  }

  return updated;
};

module.exports = {
  applyToJob,
  getApplicationsByApplicant,
  getApplicationsByJob,
  updateApplicationStatus,
};
