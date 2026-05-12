# TurantCare Platform

TurantCare Platform is a healthcare technology ecosystem focused on simplifying patient diagnostics, report interpretation, digital consultations, and medical workflow accessibility.

## Mission
To make quality healthcare guidance, diagnostic understanding, and digital medical support instantly accessible across India.

## Core Product Modules
- Clinical Report Summary Engine
- Patient Diagnostic Dashboard
- Doctor Consultation Workflow
- Secure Medical Record Access
- Smart Health Notifications
- QR Based Patient Retrieval System

## Engineering Stack
- React + TypeScript Frontend
- Tailwind Component System
- Supabase Cloud Infrastructure
- GitHub Actions CI Pipeline
- Vercel Production Deployment

## Security Standards
TurantCare follows healthcare-oriented secure engineering practices including:
- Protected API communication
- Controlled patient data access
- Secure cloud database policies
- Audit-based deployment workflows

## Deployment Lifecycle
Main branch commits trigger automated validation and production deployment.

## Local Development
1. Install dependencies:
   ```bash
   npm ci
   ```
2. Create `.env` from `.env.example` and set:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```
3. Apply Supabase migrations, including `20260508123000_cto_mvp_hardening.sql`.
4. Run the app:
   ```bash
   npm run dev
   ```

## CTO MVP Flow
- Patient signs up with name, phone, email, password, and consent.
- Patient dashboard auto-generates a 15-minute temporary PIN.
- Doctor or diagnostic center finds the patient by card, QR, or chip ID.
- Uploading reports does not require a PIN.
- Viewing reports, summaries, or adding visit notes requires the temporary PIN.
- Reports are stored by `patient/date` path and served with signed URLs after the hardening migration.
- Access logs capture report views and visit-note actions.

## Verification
Run before deployment:
```bash
npm run typecheck
npm test
npm run build
```

Known production follow-ups:
- Wire the Supabase Edge summary function to the selected clinical summary provider.
- Add backend compression for files above the configured limit if the upload limit is increased.
- Configure Vercel environment variables and Supabase production URL restrictions before launch.

## Maintained By
TurantCare Technologies Engineering Team
