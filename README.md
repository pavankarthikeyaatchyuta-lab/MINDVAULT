# MindVault

> **"Your journal that remembers."**  
> *Production-Grade Personal Gemini Journal built for the Google Cloud Gen AI Academy Cohort 3 Ideathon.*

---

## 1. Why MindVault?

Ordinary journals are write-only graveyards of thoughts: you write entries, and they disappear into pages or archives you rarely revisit. 

**MindVault** transforms your personal journal into an active, intelligent memory vault:
- Preserves what actually mattered
- Extracts structured memories (achievements, decisions, ideas, goals, people, places)
- Detects recurring themes and personal evolution across 7, 30, 90 days, or all time
- Enables natural language dialogue with your past thoughts with strict source grounding

---

## 2. Architecture & Security Model

```
USER
 │
 ▼
Firebase Authentication (Google Sign-In / Email & Password)
 │
 │ Authenticated Firebase ID Token
 ▼
Next.js Application (Cloud Run Container)
 │
 ├── Client-Side (React 19, Tailwind CSS, Lucide)
 │    ├── AuthContext (Session state & token refresh)
 │    ├── Dashboard & Journal Composer
 │    └── Privacy & Retrospective UI
 │
 └── Server-Side API Layer (/api/*)
      ├── auth-middleware (verifyIdToken -> extract verified UID)
      ├── Gemini Service (@google/genai via Secret Manager)
      ├── Firestore Repository Layer (Strict users/{uid}/* scoping)
      └── Secret Manager Client (SecretManagerServiceClient / Caching)
 │
 ├─────────────────────────┬─────────────────────────┐
 ▼                         ▼                         ▼
Cloud Firestore        Gemini API             Secret Manager
(users/{uid}/*)    (gemini-2.5-flash)     (MINDVAULT_GEMINI_API_KEY)
```

### Dual-Layer Security Boundary
1. **Server-Side Token Verification**: Every Cloud Run endpoint verifies the Firebase ID token using the Firebase Admin SDK. The effective UID is extracted strictly from `decodedToken.uid`. Request-body or query-param UIDs are rejected.
2. **Firestore UID Isolation**: All personal data is stored strictly under `users/{uid}/*`. Path validation blocks directory traversal (`../`).
3. **Firestore Security Rules**: Direct client access is constrained by `firestore.rules`, enforcing `request.auth.uid == userId`.
4. **Secret Manager**: Sensitive server credentials (e.g. Gemini API keys) are managed in Google Cloud Secret Manager with zero exposure to client bundles.

---

## 3. Mandatory Google Cloud Technologies

| Google Cloud Technology | Role in MindVault |
| :--- | :--- |
| **Firebase Authentication** | User sign-in (Google OAuth + Email/Password), session persistence, and cryptographic ID tokens. |
| **Cloud Firestore** | Isolated NoSQL document database partitioned by `users/{uid}/*`. |
| **Gemini API** | Generative conversational reflection, summarization, memory extraction, and retrospectives via `@google/genai`. |
| **Google Cloud Secret Manager** | Secure storage and access of server-side API keys and credentials. |
| **Google Cloud Run** | Scalable, serverless container hosting the Next.js standalone application with non-root security. |

---

## 4. Firestore Data Schema

```
users/{uid}
├── journals/{journalId}
│   ├── id: string
│   ├── uid: string
│   ├── title: string
│   ├── content: string
│   ├── messages: JournalMessage[]
│   ├── summary: string (optional)
│   ├── topics: string[] (optional)
│   ├── location: LocationObject (optional)
│   ├── createdAt: ISO timestamp
│   └── updatedAt: ISO timestamp
│
├── memories/{memoryId}
│   ├── id: string
│   ├── uid: string
│   ├── category: 'EVENT' | 'PERSON' | 'PLACE' | 'GOAL' | 'DECISION' | 'ACHIEVEMENT' | 'IDEA' | 'CONCERN' | 'PREFERENCE'
│   ├── title: string
│   ├── description: string
│   ├── sourceJournalId: string
│   ├── sourceDate: string
│   └── createdAt: ISO timestamp
│
├── goals/{goalId}
│   ├── id: string
│   ├── uid: string
│   ├── title: string
│   ├── status: 'active' | 'completed' | 'paused' | 'archived'
│   ├── sourceJournalIds: string[]
│   └── createdAt: ISO timestamp
│
└── rewinds/{rewindId}
    ├── id: string
    ├── uid: string
    ├── period: '7d' | '30d' | '90d' | 'all'
    ├── whatOccupiedYourMind: string[]
    ├── recurringThemes: ThemeItem[]
    ├── momentWorthRemembering: MomentItem
    └── createdAt: ISO timestamp
```

---

## 5. Local Setup & Environment

### Prerequisites
- Node.js 20+ (Node 22 / 24 recommended)
- npm 10+
- Google Cloud SDK (`gcloud`)

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/pavankarthikeyaatchyuta-lab/MINDVAULT.git
cd MINDVAULT
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Firebase and Gemini credentials:
```bash
cp .env.example .env.local
```

### Step 3: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 6. Automated Testing & Verification

MindVault includes an automated test suite verifying security controls, UID isolation, and API health:

```bash
# Run all tests
npm test

# Run security test suite specifically
npm run test:security

# Type checking
npm run typecheck

# Production build
npm run build
```

---

## 7. Cloud Run Deployment

MindVault is configured for containerized deployment to Google Cloud Run:

```bash
# 1. Build container image with Google Cloud Build
gcloud builds submit --tag gcr.io/[PROJECT_ID]/mindvault

# 2. Deploy to Cloud Run with Secret Manager access
gcloud run deploy mindvault \
  --image gcr.io/[PROJECT_ID]/mindvault \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=[PROJECT_ID],NODE_ENV=production \
  --set-secrets MINDVAULT_GEMINI_API_KEY=MINDVAULT_GEMINI_API_KEY:latest
```