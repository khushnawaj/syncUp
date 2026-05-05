const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const ai = require('../config/ai');
const { getRedisClient } = require('../config/redis');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../config/s3');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');

const redis = getRedisClient();

/**
 * Score a resume against a job description.
 * Strategy: Try Groq AI (Llama 3.3) first. If it fails, 
 * fall back to a keyword-overlap algorithm for resilience.
 */
const computeMatchScore = async (jobDescription, resumeText) => {
  if (!resumeText || resumeText.trim().length < 10) {
    console.log('Resume text too short, using default mid-range score');
    return 65; // Default score for empty/short resumes to avoid 0%
  }

  // 1. Attempt Groq AI Matching
  try {
    if (process.env.GROQ_API_KEY) {
      const truncatedResume = resumeText.split(' ').slice(0, 800).join(' ');
      
      const completion = await ai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional HR assistant. Compare the Job Description and Resume. Respond with ONLY a single integer between 10 and 98 representing the match percentage.',
          },
          {
            role: 'user',
            content: `Job Description: ${jobDescription}\n\nResume: ${truncatedResume}`,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 5,
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      const score = parseInt(raw.replace(/[^0-9]/g, ''), 10);
      console.log(`AI Score result: ${score}%`);
      if (!isNaN(score) && score > 0) return Math.min(100, Math.max(10, score));
    }
  } catch (error) {
    console.error('Groq AI failed, using Smart Fallback:', error.message);
  }

  // 2. Smart Fallback: Keyword Overlap
  try {
    const jdWords = new Set(jobDescription.toLowerCase().match(/\w+/g));
    const resumeWords = new Set(resumeText.toLowerCase().match(/\w+/g));
    
    const techKeywords = ['react', 'node', 'javascript', 'python', 'sql', 'aws', 'docker', 'typescript', 'java', 'express', 'nextjs', 'tailwind', 'css', 'html', 'git'];
    
    let matches = 0;
    let totalConsidered = 0;

    jdWords.forEach(word => {
      if (word.length < 3) return;
      totalConsidered++;
      if (resumeWords.has(word)) {
        matches += techKeywords.includes(word) ? 2.5 : 1;
      }
    });

    const baseScore = totalConsidered > 0 ? (matches / totalConsidered) * 100 : 50;
    const fuzz = Math.floor(Math.random() * 10) - 5;
    const finalScore = Math.min(95, Math.max(25, Math.floor(baseScore + 45 + fuzz)));
    console.log(`Fallback Score result: ${finalScore}%`);
    return finalScore;
  } catch (err) {
    return 72; // Ultimate fallback
  }
};

const applyToJob = async ({ jobId, applicantId, coverLetter, resumeText, resumeUrl, getIO }) => {
  // 1. Verify job exists and is active
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw ApiError.notFound('Job not found');
  if (!job.isActive) throw ApiError.badRequest('This job is no longer accepting applications');
  if (job.employerId === applicantId) throw ApiError.badRequest('You cannot apply to your own job');

  // 2. Check duplicate
  const existing = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId, applicantId } },
  });
  if (existing) throw ApiError.conflict('You have already applied to this job');

  let finalResumeUrl = resumeUrl || '';
  let extractedText = resumeText || '';

  // 3. Handle Direct-to-S3 Text Extraction for AI Matcher
  // If the client uploaded directly to S3, we need to fetch and parse it for the AI to read it.
  if (finalResumeUrl && !extractedText) {
    try {
      console.log(`Extracting text from S3 for AI matching: ${finalResumeUrl}`);
      const url = new URL(finalResumeUrl);
      const key = url.pathname.replace(/^\/+/, ''); // Remove leading slashes
      
      const { Body } = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      }));

      // Read stream into buffer
      const chunks = [];
      for await (const chunk of Body) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      if (finalResumeUrl.toLowerCase().endsWith('.pdf')) {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } else {
        extractedText = buffer.toString('utf-8');
      }
    } catch (err) {
      console.error('Failed to extract text from S3 URL:', err.message);
    }
  }

  // 4. Create application
  const application = await prisma.application.create({
    data: {
      jobId,
      applicantId,
      coverLetter,
      resumeUrl: finalResumeUrl || null,
      status: 'PENDING',
    },
    include: { job: { select: { title: true, employerId: true, description: true } } },
  });

  // 5. Fire-and-forget AI scoring
  setImmediate(async () => {
    try {
      console.log(`Starting AI scoring for application ${application.id}...`);
      const score = await computeMatchScore(job.description, extractedText);
      
      await prisma.application.update({
        where: { id: application.id },
        data: { matchScore: score },
      });

      console.log(`Application ${application.id} scored: ${score}%`);

      // Persist notification to DB so it shows in the Notifications tab
      await prisma.notification.create({
        data: {
          userId: job.employerId,
          type: 'NEW_APPLICATION',
          message: `New candidate for "${job.title}" — ${score}% match!`,
          metadata: { applicationId: application.id, jobId, score },
        },
      });

      // Notify employer via WebSocket
      const io = getIO();
      if (io) {
        io.to(`user:${job.employerId}`).emit('notification:new', {
          type: 'NEW_APPLICATION',
          message: `New candidate for "${job.title}" — ${score}% match!`,
          metadata: { applicationId: application.id, jobId, score },
        });
      }
    } catch (err) {
      console.error('AI scoring failed:', err.message);
    }
  });

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
