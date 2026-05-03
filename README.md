# SyncUp — Job Matching Platform

A scalable, production-ready job matching platform built as a technical assignment. This project demonstrates full-stack development capabilities, AI integration, and cloud-native architecture.

## 🚀 Tech Stack
- **Frontend**: Next.js (JSX), Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (Job search caching)
- **Real-time**: Socket.io (Real-time notifications)
- **AI Matching**: Groq / Llama 3 (OpenAI-compatible) for resume scoring
- **Storage**: AWS S3 (Resume uploads)
- **Deployment**: AWS EC2 (Backend), Vercel (Frontend)

## ✨ Key Features
1. **User Authentication**: Secure JWT-based authentication for Employers and Job Seekers.
2. **Job Management**: Complete CRUD for job postings with Redis caching for optimized search performance.
3. **AI Matching**: Automated resume-to-job matching score calculated upon application.
4. **Real-time Notifications**: Employers receive instant WebSocket alerts when new candidates apply.
5. **AWS S3 Integration**: Direct-to-S3 resume uploads using pre-signed URLs for maximum security and scalability.

## 📁 Project Structure (Clean Architecture)
```text
/backend
  /src
    /config      # DB, S3, AI, Redis configurations
    /controllers # Request handling & response formatting
    /middleware  # Auth, Validation (Zod), Error handling
    /routes      # API route definitions
    /services    # Core business logic (AI Matcher, Job logic)
    /utils       # Reusable helpers (ApiError, ApiResponse)
/frontend
  /app           # Next.js App Router (Pages & Layouts)
  /components    # Reusable UI components
  /lib           # API & Socket clients
  /store         # State management (Zustand)
```

## 🛠️ Local Setup
1. **Database**: Ensure PostgreSQL is running and update `DATABASE_URL` in `.env`.
2. **Backend**:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## ☁️ Deployment Strategy
- **Backend**: Containerized with **Docker** and deployed on **AWS EC2**.
- **Database**: Hosted on **Neon/RDS** for high availability.
- **Cache**: **Upstash Redis** for low-latency job lookups.
- **Frontend**: **Vercel** for optimal Next.js performance.

## ⚖️ Evaluation Highlights
- **Scalability**: Decoupled AI scoring (setImmediate) ensures fast API responses even under load.
- **API Design**: Standardized JSON envelopes for all responses.
- **Resilience**: Implemented a keyword-based fallback for AI matching to ensure 100% uptime.
