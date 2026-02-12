# Job Hunt Dashboard

A smart job application tracker that syncs with your Gmail to automatically organize your job hunt.

## Features

- **Automated Sync**: Scans your Gmail for job application emails.
- **AI-Powered Parsing**: Uses Gemini AI to extract company name, role, status, salaries, and next steps.
- **Smart Grouping**: Automatically groups updates (interviews, rejections) into the original application thread.
- **Dashboard**: Visualize your progress with stats and filtering.
- **Deep Search**: Filter by company, role, or status.
- **Deduplication**: Intelligently merges duplicate emails using Thread IDs and Job IDs.

## Tech Stack

- **Framework**: Next.js 15
- **Database**: SQLite (via Prisma)
- **AI**: Google Gemini Flash Lite
- **Auth**: NextAuth.js (Google)
- **UI**: Tailwind CSS + Shadcn/ui

## Getting Started

1. **Clone & Install**
   ```bash
   git clone <url>
   cd job-hunt-dashboard
   npm install
   ```

2. **Environment Setup**
   Copy `.env.local.example` to `.env.local` and add:
   - `DATABASE_URL`="file:./dev.db"
   - `GOOGLE_CLIENT_ID`="your-google-client-id"
   - `GOOGLE_CLIENT_SECRET`="your-google-client-secret"
   - `GEMINI_API_KEY`="your-gemini-api-key"
   - `AUTH_SECRET`="generated-secret"

3. **Run Database Migrations**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start Dev Server**
   ```bash
   npm run dev
   ```

## License

MIT
