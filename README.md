# Reflog — Executive Intelligence for Founders

> **Your AI-powered strategic advisor. Brutally honest. Always available.**

Stop building in circles. Get clarity on what actually matters.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/rasinmuhammed/reflog-for-founders)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)](https://www.typescriptlang.org/)

---

## 🎯 What is Reflog?

**Reflog** is an AI-powered executive intelligence platform designed specifically for startup founders. Like `git reflog` tracks your complete development history, Reflog tracks your business decisions, patterns, and execution—giving you brutally honest feedback to break out of founder loops.

### Why Founders Need This

- **Stop the echo chamber:** Get strategic advice that challenges, not validates
- **Pattern recognition:** Identify when you're stuck in circular thinking
- **Execution accountability:** Track what you're actually doing vs. what you planned
- **Data-driven clarity:** Connect real metrics to AI-powered insights

---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Multi-LLM Support** — Choose Groq (fast, free), OpenAI (premium), or Ollama (self-hosted)
- **Multi-Agent Deliberation** — Business Strategist, Market Realist, Execution Enforcer agents
- **Strategic Chat** — Pressure-test decisions with AI advisors

### 📊 Founder Dashboard
- **Morning Brief** — AI-generated daily priorities and decisions needed
- **Quick Check-ins** — Track energy, blockers, and needle-moving tasks
- **Weekly Reviews** — Structured reflection with AI insights
- **Action Tracker** — Never lose track of commitments

### 🔗 Real Integrations
- **Google Calendar** — See today's meetings with AI context
- **Gmail** — Track threads going cold, inbox insights
- **GitHub** — (Coming soon) Code activity patterns

### 📈 Business Intelligence
- **Metrics Tracking** — MRR, users, runway, custom KPIs
- **Time Allocation** — Compare stated priorities vs. actual time spent
- **Pattern Detection** — Identify avoidance behaviors and execution gaps
- **Decision Log** — Track pivots, strategies, and their outcomes

### 🎨 Modern Experience
- **Beautiful Dark UI** — Premium design with animated gradients
- **Real-time Toasts** — Instant feedback on all actions
- **Mobile-Responsive** — Works on any device
- **Fast & Smooth** — Built with Next.js 14 + Turbopack

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL |
| **AI/LLM** | Groq, OpenAI, Ollama, CrewAI (multi-agent) |
| **Auth** | Clerk |
| **Integrations** | Google OAuth 2.0 (Calendar + Gmail) |
| **Rate Limiting** | SlowAPI with in-memory + Redis support |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or Neon.tech for serverless)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your GROQ_API_KEY, DATABASE_URL, etc.

uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## ⚙️ Environment Variables

### Backend (`.env`)
```env
# Required
DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...
ENCRYPTION_KEY=...  # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Optional - Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
INTEGRATION_MODE=production  # or "mock" for demo data

# Optional - Multi-LLM
PLATFORM_OPENAI_API_KEY=...
DEFAULT_LLM_PROVIDER=groq  # groq, openai, or ollama
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

---

## 📁 Project Structure

```
reflog-founders/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── cos_engine.py        # Chief of Staff AI engine
│   ├── llm/                  # Multi-LLM providers
│   ├── integrations/         # Google, GitHub, etc.
│   ├── routers/              # API endpoints
│   └── models.py             # SQLAlchemy models
├── frontend/
│   ├── app/                  # Next.js app router
│   ├── components/           # React components
│   │   ├── CommandCenter.tsx # Main dashboard
│   │   ├── Settings.tsx      # Settings modal
│   │   └── ...
│   └── public/               # Static assets
└── README.md
```

---

## 🗺️ Roadmap

- [x] Multi-LLM provider support (Groq, OpenAI, Ollama)
- [x] Google Calendar & Gmail integration
- [x] Rate limiting middleware
- [x] Settings with Google Connect UI
- [ ] Stripe billing integration
- [ ] GitHub activity insights
- [ ] Slack integration
- [ ] Mobile app (React Native)
- [ ] Team collaboration features

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built for founders who want clarity, not validation.</strong>
</p>
