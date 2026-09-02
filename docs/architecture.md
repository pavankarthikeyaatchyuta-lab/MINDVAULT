# MindVault — Architecture Documentation

## 1. System Architecture Diagram

```
USER BROWSER / CLIENT
 │
 ├── 1. Firebase Authentication (Google Sign-in / Email & Password)
 │    └── Obtains cryptographically signed Firebase ID Token
 │
 ├── 2. Client-Side Experience (React 19, Tailwind CSS, Lucide)
 │    ├── /dashboard — High-level hub & quick navigation
 │    ├── /journal — Reflective multi-turn conversational journal
 │    └── /memories — Categorized structured memory gallery (9 types) with source linking
 │
 ▼
HTTPS API Requests (with Authorization: Bearer <idToken>)
 │
 ▼
GOOGLE CLOUD RUN BACKEND CONTAINER
 │
 ├── 3. Server-Side Authentication Verification (auth-middleware.ts)
 │    ├── Invokes Firebase Admin SDK verifyIdToken(idToken, checkRevoked=true)
 │    └── Extracts authoritative authenticated UID: context.uid = decodedToken.uid
 │
 ├── 4. Server-Side Authorization Enforcement
 │    └── Rejects any client-supplied spoofed UID in request body or parameters
 │
 ├── 5. Zod Input & Output Schema Validation (validation/schemas.ts)
 │    ├── Bounds input lengths (e.g. max 4000 chars/msg, max 50 turns)
 │    └── Validates Gemini structured output schemas (titles, summaries, memories)
 │
 ├── 6. UID-Scoped Repository Layer (repositories.ts)
 │    └── Enforces path scoping: users/{authenticatedUid}/*
 │
 ├── 7. Google Cloud Secret Manager (secret-manager.ts)
 │    └── Resolves GEMINI_API_KEY with 10-minute in-memory caching
 │
 └── 8. Gemini Service Layer (gemini/journal-service.ts)
      ├── Reflective multi-turn chat (gemini-2.5-flash)
      ├── Resilient automatic titling (2-6 words)
      ├── Objective journal summarizer & topic tagger
      └── Structured memory extractor (9 strict categories)
 │
 ├─────────────────────────────────────────┬─────────────────────────────────────────┐
 ▼                                         ▼                                         ▼
Cloud Firestore                        Gemini API                            Secret Manager
(users/{authenticatedUid}/*)      (gemini-2.5-flash)                   (MINDVAULT_GEMINI_API_KEY)
```

---

## 2. CRITICAL SECURITY INVARIANT: Dual Security Boundaries

> [!CAUTION]
> **Admin SDK Bypass Warning**: All operations executed by the Firebase Admin SDK on Cloud Run bypass Firestore Security Rules.
> Therefore, Firestore Security Rules protect direct client access, but **Server-Side Token Verification & UID Extraction are strictly mandatory** to prevent cross-user data leakage on all backend API routes.

```mermaid
flowchart TD
    subgraph ClientDirectAccess["Direct Client Access Boundary"]
        ClientApp["Client App"] -->|Protected by| Rules["firestore.rules\n(request.auth.uid == userId)"]
        Rules -->|Enforces| FSClient["Firestore users/{userId}/*"]
    end

    subgraph ServerAdminAccess["Cloud Run Server Boundary"]
        APIReq["Client HTTP Request\n(Bearer token)"] -->|Step 1: Verify| AdminAuth["Firebase Admin verifyIdToken()"]
        AdminAuth -->|Step 2: Extract| AuthUID["Verified authenticatedUid"]
        AuthUID -->|Step 3: Mandate| Repo["UID-Scoped Repositories\nusers/{authenticatedUid}/*"]
        Repo -->|Step 4: Execute| AdminSDK["Admin SDK Firestore\n(Bypasses Rules - Relies on Server Authorization)"]
    end
```

---

## 3. Technology Integration Details

| Technology | Role | Implementation Detail |
| :--- | :--- | :--- |
| **Firebase Authentication** | Identity & Session Provider | Google Sign-in & Email/Password with cryptographic token exchange |
| **Cloud Firestore** | Isolated Personal Data Store | Subcollections scoped under `users/{authenticatedUid}/*` |
| **Gemini API** | Generative AI Journal Companion | `@google/genai` (`gemini-2.5-flash`) for reflection, titling, summarization, and memory extraction |
| **Google Cloud Secret Manager** | Sensitive Credential Storage | `@google-cloud/secret-manager` client with TTL cache & local dev fallback |
| **Google Cloud Run** | Serverless Container Runtime | Multi-stage Docker container running Next.js standalone with non-root user |

---

## 4. Implementation Status vs Roadmap

### Implemented in Stage 1, Stage 2 & Stage 3 (P0 Foundation, P1 Core Product, P2 Differentiation)
- [x] Next.js 15 App Router + TypeScript + Tailwind CSS
- [x] Firebase Client Authentication (Google OAuth + Email/Password)
- [x] Firebase Admin ID Token Verification Middleware (`verifyAuthHeader`)
- [x] UID-Scoped Firestore Repositories (`JournalRepository`, `MemoryRepository`, `GoalRepository`, `RewindRepository`)
- [x] Strict Firestore Security Rules (`firestore.rules`)
- [x] Google Cloud Secret Manager integration with caching
- [x] Multi-stage production Dockerfile for Cloud Run with non-root security
- [x] Production security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [x] Automated Security Test Suite (47 security & unit tests passing across 12 suites)
- [x] Multi-turn Gemini conversational journal session (`/api/journal/chat` & `/journal`)
- [x] Resilient journal saving pipeline with automatic titling (`/api/journal/save`)
- [x] Automatic journal summarizer & topic extraction (`/api/journal/summarize`)
- [x] Structured AI memory extraction across 9 categories (`/api/journal/extract-memory`)
- [x] Categorized Memories Gallery (`/memories`) with category filtering and source linking
- [x] Zod request & Gemini structured output schema validation
- [x] "Ask My Journal" natural-language query engine (`POST /api/journal/ask` & `/ask`)
- [x] Strict source reference validation (rejection of any hallucinated source IDs)
- [x] "Journal Rewind" retrospective synthesis for 7d, 30d, 90d, all-time (`POST /api/journal/rewind` & `/rewind`)
- [x] Deterministic statistics aggregation (entry count, active days, topic frequency)
- [x] Personal Growth Timeline with category filtering and shift detection (`GET /api/timeline` & `/timeline`)

### Planned for Stage 4 (P3 Polish & Features)
- [ ] Goal memory tracker with explicit user state confirmation
- [ ] Optional Google Places API (New) & Maps JS personal memory map
- [ ] Privacy Center UI with UID data audit controls

