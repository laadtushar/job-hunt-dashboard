# 👔 Meridian

A premium, AI-powered job application tracker that syncs with your Gmail to automatically organize your career search. Stop manual entry and let AI do the work.

[**Architecture Walkthrough 🏗️**](./ARCHITECTURE.md)

**Live Demo:** [meridian-job-sync.vercel.app](https://meridian-job-sync.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.0-blue)

## ✨ Features

- **📬 Automated Gmail Sync**: Scans your inbox for job applications, interview invites, and rejections.
- **🧠 AI-Powered Extraction**: Uses Google Gemini to extract company details, roles, salaries, recruiter info, and next steps.
- **🔍 Deep Re-analysis (Reflexion)**: A "Deep Flow" feature that performs iterative Gmail searches and uses AI to critique previous extractions based on new email context.
- **📂 Smart Threading**: Automatically groups follow-up emails (interviews, offers) into the original application timeline.
- **📊 Interactive Dashboard**: Visualize your pipeline with status badges, stale application alerts, and advanced filters.
- **🛠️ Maintenance Tools**: Built-in controls for database consolidation and cleanup.
- **🔒 Privacy First**: Your data stays on your local SQLite database/Vercel instance.

## 🚀 Tech Stack

- **Framework**: [Next.js 15 App Router](https://nextjs.org/)
- **Database**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **AI**: Google [Gemini 2.0 Flash](https://aistudio.google.com/) (Direct or via OpenRouter)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google Provider)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

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
