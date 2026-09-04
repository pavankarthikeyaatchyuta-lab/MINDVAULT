# MindVault — Official Hackathon Submission Information

> **Google Cloud Gen AI Academy Cohort 3 APAC Ideathon Submission**

---

### TRACK
Ideathon Challenge

### PROJECT NAME
MindVault

### TAGLINE
Your journal that remembers.

### BRIEF DESCRIPTION
MindVault is a privacy-focused AI journal that remembers the user's story. Users can write journal entries, reflect through multi-turn Gemini conversations, preserve meaningful memories, ask questions about their past, rewind their history, explore a timeline and map, and discover personal insights. Firebase Authentication securely identifies users, while Firestore stores journals and memories with strict per-user isolation. Gemini powers grounded reflection, memory extraction, natural-language questions, and insights using bounded personal context. Google Cloud Secret Manager securely provides the Gemini API key, and the application is containerized for deployment on Cloud Run. Additional features include hybrid evidence-based retrieval, source validation, prompt-injection defenses, rate limiting, memory provenance, and unresolved-location handling.

### CORE GOOGLE CLOUD SERVICES USED
1. **Google Gemini API (`gemini-2.5-flash` via `@google/genai`)**: Powers multi-turn reflective journaling, automatic evocative titling, objective summarization, 9-category structured memory extraction, grounded natural-language answers in Ask My Journal, period retrospectives in Rewind, and longitudinal pattern analysis in Insights.
2. **Firebase Authentication**: Provides secure user authentication (Google Sign-In & Email/Password), session management, and cryptographically signed ID tokens verified server-side with Firebase Admin SDK.
3. **Cloud Firestore**: Provides isolated NoSQL document storage strictly scoped to `users/{authenticatedUid}/*` for journals, extracted memories, goals, and retrospectives.
4. **Google Cloud Secret Manager**: Securely stores and resolves `MINDVAULT_GEMINI_API_KEY` server-side with in-memory caching, eliminating hardcoded keys and browser exposure.
5. **Google Cloud Run**: Target serverless container platform hosting the standalone Next.js 15 application with non-root security (`nextjs:nodejs`), dynamic `$PORT` binding, and health check monitoring.

### OTHER TECHNOLOGIES
Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Zod Schema Validation, Multi-Signal Hybrid Retrieval, Dual-Boundary Authorization Model, Sliding-Window In-Memory Rate Limiting, Jest Security Test Suite (70 tests across 16 suites).

### REPOSITORY URL
https://github.com/pavankarthikeyaatchyuta-lab/MINDVAULT

### DEPLOYMENT ARCHITECTURE NOTE
The application is fully containerized and Cloud Run-ready with a multi-stage Dockerfile, health check probe (`GET /api/health`), and Secret Manager integration. For the hackathon evaluation, a comprehensive video walkthrough demonstration is provided.
