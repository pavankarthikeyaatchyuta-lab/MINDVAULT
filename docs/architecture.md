# MindVault — Architecture Documentation

## 1. System Overview

MindVault is a production-grade personal journal powered by Google Gemini and built on Google Cloud Platform. It transforms ephemeral journal entries into searchable personal memories, goals, growth timelines, and visual retrospectives while enforcing strict privacy and user data isolation.

```
USER
 │
 ▼
Firebase Authentication (Google Sign-in / Email & Password)
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

---

## 2. Core Architectural Principles

### 2.1 Dual Security Boundary
- **Client-Side Boundary**: Direct Firestore access (if ever enabled) is strictly constrained by `firestore.rules`.
- **Server-Side Boundary**: All backend API routes in Cloud Run use Firebase Admin SDK to verify the Firebase ID token and derive the caller's verified `uid`. Request-body or query-string UIDs are never trusted.

### 2.2 Strict UID-Scoped Data Partitioning
Every user's personal journal data resides under their unique root:
```
users/{uid}/journals/{journalId}
users/{uid}/memories/{memoryId}
users/{uid}/goals/{goalId}
users/{uid}/insights/{insightId}
users/{uid}/rewinds/{rewindId}
```

### 2.3 Production Secret Management
- Zero secrets in frontend JavaScript bundles.
- Zero secrets committed to source control (`.gitignore` + `.env.example`).
- Server credentials and API keys dynamically resolved via Google Cloud Secret Manager (`SecretManagerServiceClient`) with in-memory caching and fallback to local environment for local development.

---

## 3. Google Cloud Technologies Used

| Technology | Purpose | Implementation Detail |
| :--- | :--- | :--- |
| **Firebase Authentication** | Identity & Session Management | Google Sign-In & Email/Password with ID token verification |
| **Cloud Firestore** | Isolated Personal Data Store | Subcollections scoped under `users/{uid}/*` |
| **Gemini API** | Generative Reflection & Memory | `@google/genai` with `gemini-2.5-flash` |
| **Secret Manager** | Sensitive Server Credential Storage | `@google-cloud/secret-manager` client with 10-min cache |
| **Google Cloud Run** | Serverless Container Runtime | Multi-stage Docker container running Next.js standalone |
