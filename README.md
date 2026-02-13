# 👔 Meridian

A premium, AI-powered job application tracker that syncs with your Gmail to automatically organize your career search. Stop manual entry and let AI do the work.

[**Architecture Walkthrough 🏗️**](./ARCHITECTURE.md)

**Live Demo:** [meridian-job-sync.vercel.app](https://meridian-job-sync.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.0-blue)

## 🖼️ Visual Tour

### Dashboard Overview
![Dashboard Overview](./public/screenshots/dashboard.png)
*The premium Meridian command center featuring real-time career stats (Total Pulsed, Live Pipeline, Neural Screens), advanced status filtering, and a sleek glassmorphic UI.*

### Automated Gmail Sync (Agentic Flow)
![Sync Running](./public/screenshots/sync_running.png)
*Behold the **Neural Batch Sync Engine** in action. This high-performance pipeline processes Gmail data in parallel batches of 25, utilizing surgical date-range filters to scan months of history without hitting platform timeouts.*

### Smart Identity Consolidation
![Smart Consolidation](./public/screenshots/Smart_consolidation.png)
*Precision data resolution at work. Meridian uses L1-L4 identity layers to automatically merge fragmented email threads (interviews, offers, role updates) into a single, cohesive timeline for each application.*

## ✨ Features

- **📬 Automated Gmail Sync**: Scans your inbox for job applications, interview invites, and rejections.
- **🧠 AI-Powered Extraction**: Uses Google Gemini to extract company details, roles, salaries, recruiter info, and next steps.
- **🔍 Deep Re-analysis (Reflexion)**: A "Deep Flow" feature that performs iterative Gmail searches and uses AI to critique previous extractions based on new email context.
- **📂 Smart Threading**: Automatically groups follow-up emails (interviews, offers) into the original application timeline.
- **📊 Interactive Dashboard**: Visualize your pipeline with status badges, stale application alerts, and advanced filters.
- **🛠️ Maintenance Tools**: Built-in controls for database consolidation and cleanup.
- **🔒 Privacy First**: Your data stays on your local SQLite database/Vercel instance.

## 🚀 Tech Stack

- **Framework**: [Next.js 16 App Router](https://nextjs.org/)
- **Database**: PostgreSQL (Vercel Postgres) with [Prisma ORM](https://www.prisma.io/)
- **AI**: Google [Gemini 2.0 Flash](https://aistudio.google.com/) (Direct or via OpenRouter)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google Provider)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)

## 🧠 Agentic AI Flow

The core of Meridian is a multi-stage agentic workflow designed to handle the noise of a real inbox:

1. **Extraction Agent (Front-Line)**: 
   - Scans incoming emails and structures unstructured text into a standard Job schema.
   - Uses **Self-Correction Logic**: It fetches "Learned Rules" from the database (rules established by your previous "Ignore" or "Correction" actions) to avoid repeating mistakes like classifying newsletters as applications.

2. **The AI Judge (Identity Resolution)**:
   - When new data arrives, a context-aware agent determines if it belongs to an existing application or is a fresh one. 
   - It performs **Semantic Reasoning** (understanding that "SDE" at Google and "Software Dev" at Alphabet might be the same job) and **Time-Based Logic** (distinguishing a status update from a re-application months later).

3. **Reflexion Loop (Self-Healing)**:
   - Triggered when you request a "Deep Refresh". The AI re-analyzes original emails plus any follow-up threads.
   - It performs **Critique and Correction**: Identifying why the previous attempt was incorrect and using your direct feedback as the ultimate ground truth.

4. **Maintenance Agent (Consolidation)**:
   - Automatically runs across your database to merge legacy duplicates or fragmented threads into a cohesive career timeline.

5. **Neural Batch Sync (High-Performance Pipeline)**:
   - **Multi-Stage Orchestration**: Splits the sync into a **Prepare** stage (metadata discovery) and a **Process** stage (deep analysis), allowing it to handle up to 365 days of history.
   - **Parallel Batching**: Uses a client-orchestrated parallel threading model to bypass Vercel serverless timeout limits. It processes emails in concurrent batches of 25, delivering high throughput while maintaining platform stability.
   - **Surgical Search**: Supports advanced date-range parameters (`after:` and `before:`) mapped directly to the Gmail API query engine for precise historical discovery.

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18+ 
- A Google Cloud Project (for Gmail/OAuth)
- A Gemini API Key (or OpenRouter)

### 2. Installation
```bash
git clone https://github.com/your-username/job-hunt-dashboard.git
cd job-hunt-dashboard
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` (or `.env.local`):
```bash
cp .env.example .env
```

Fill in the following variables:
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From your [GCP Console](https://console.cloud.google.com/).
- `GEMINI_API_KEY`: From [Google AI Studio](https://aistudio.google.com/).
- `AUTH_SECRET`: Generate one using `npx auth secret`.

### 4. Database Setup
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Launch
```bash
npm run dev
```

## 📖 Usage Tips

- **Syncing**: Click the Sync button on the dashboard to pull latest emails.
- **Deep Re-analysis**: If a job info looks wrong, use the "Refresh" icon on the job card. You can provide a hint (e.g., "I actually got rejected yesterday") to guide the AI's deep search.
- **Ignore**: Use the trash icon for emails that aren't actually jobs; this helps the AI learn.

## 📄 License

MIT License - feel free to use and modify for your own job hunt!
