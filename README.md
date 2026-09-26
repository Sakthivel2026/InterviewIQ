# InterviewIQ — AI Mock Interview System

InterviewIQ is a full-stack production-grade AI SaaS application designed to empower candidates with personalized voice-based mock interviews, resume & job description analysis, real-time AI evaluation across multi-dimensional criteria, and actionable readiness reports.

---

## 🌟 Key Features

1. **Candidate Profile & Resume Parsing**:
   - Upload PDF, DOCX, or TXT resume (up to 5MB).
   - Anthropic Claude AI parses skills, frameworks, tools, education, experience, and projects into structured JSON.
2. **Job Description & Skill Matcher**:
   - Paste job descriptions to extract required/preferred tech stack.
   - Intelligent skill match engine computes match percentage, identifies skill gaps, and evaluates experience level compatibility.
3. **Interactive AI Interview Wizard**:
   - Customizable parameters: Target Role, Experience Level (Entry, Mid, Senior, Lead), Difficulty (Easy, Medium, Hard, FAANG), and Interview Type (Technical, Behavioral, System Design, Mixed).
   - Generates 8-10 targeted interview questions specifically referencing candidate experience and job criteria.
4. **Voice Interview Studio**:
   - Web Speech API integration (SpeechSynthesis TTS for question vocalization & SpeechRecognition STT for voice input).
   - Live transcript, recording indicator, pause, skip, and voice toggle controls.
5. **Adaptive AI Follow-Up Engine**:
   - Evaluates each answer on 5 dimensions: Technical, Relevance, Clarity, Completeness, and Communication.
   - Claude dynamically injects follow-up probes based on previous response depth.
6. **Final Interview Report & Readiness Analytics**:
   - Radar scoring breakdown, readiness percentage, executive summary, top strengths, critical weaknesses, and prioritized learning plan.
   - Performance history tracking with Recharts data visualization on the user dashboard.
7. **Security & Performance (Phase 9)**:
   - Rate limiting on Auth (15 req/15min), AI endpoints (30 req/15min), and API (100 req/15min).
   - Zod schema input validation across all endpoints.
   - Helmet secure headers and strict CORS origin lockdown.
   - React Error Boundary UI fallback.

---

## 🏗 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express (REST API v1 under `/api/v1`).
- **Database & ORM**: PostgreSQL / SQLite with Prisma ORM.
- **AI Integration**: Anthropic Claude API (`claude-3-5-sonnet`) with strict JSON schema prompts & resilient fallback generators.
- **Auth**: Custom JWT (Access + Refresh tokens, httpOnly cookies) & bcryptjs hashing.
- **Testing**: Vitest for unit testing, Playwright for E2E testing.
- **Containerization**: Multi-stage Dockerfile & Docker Compose.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.x
- npm >= 9.x

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Sakthivel2026/InterviewIQ.git
cd interview-iq
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in root and `/server`:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_jwt_secret_key_2026"
JWT_REFRESH_SECRET="your_refresh_secret_key_2026"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
CLIENT_URL="http://localhost:5173"
UPLOAD_DIR="uploads"
```

### 3. Initialize Database
```bash
npm run db:generate
npm run db:migrate
```

### 4. Run Development Stack
Launch client and server concurrently:
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`
- Server API runs at: `http://localhost:5000`

---

## 🧪 Testing

### Server Unit Tests (Vitest)
```bash
npm run test
```

### End-to-End Tests (Playwright)
```bash
npx playwright test
```

---

## 🐳 Docker Deployment

Build and run using Docker Compose:
```bash
docker-compose up --build -d
```
The application will be accessible on `http://localhost:5000`.

---

## 📄 License
MIT License
