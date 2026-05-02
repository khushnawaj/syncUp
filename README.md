# SyncUp — Job Matching Platform

A highly scalable job matching platform built as a full-stack assignment.

### Features
- **Role-Based Auth:** Job Seekers & Employers (JWT based).
- **AI Matching:** Uses Azure OpenAI to score resumes automatically.
- **Real-time WebSockets:** Instant notifications for employers and seekers.
- **Resilient Caching:** Redis cache-aside with graceful degradation.
- **S3 Uploads:** Pre-signed URLs for zero-bandwidth resume uploads.

### Getting Started
1. Configure `.env` in the backend.
2. `npm install` in both `frontend` and `backend`.
3. Start backend: `npm run dev` in `backend` (Port 5000)
4. Start frontend: `npm run dev` in `frontend` (Port 3000)
