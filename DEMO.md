# MindVault — Hackathon Live Walkthrough & Video Demo Guide

> **"Your journal that remembers."**  
> *Google Cloud Gen AI Academy Cohort 3 APAC Ideathon Submission*

---

## The Product Story (0:00 – 0:30)

> "Traditional journals are write-only graveyards of thoughts. You write an entry, close the book, and your thoughts disappear into chronological archives you rarely revisit.
>
> **MindVault** changes this. It doesn't just store what you wrote: **it builds an active, usable memory of your own story**."

---

## Complete 17-Step Walkthrough Sequence (3–5 Minutes)

### Step 1: Landing Page (`/`)
- Show the hero section: *"Your journal that remembers."*
- Highlight the core loop: **Write → Remember → Ask → Reflect → Understand → Locate → Evolve**.

### Step 2: Sign In (`/login`)
- Demonstrate authentication via Google Sign-In or Email/Password.
- Mention: Client receives a cryptographically signed Firebase ID token.

### Step 3: Open Journal (`/journal`)
- Show the writing-first, distraction-free journaling interface.

### Step 4: Write a Realistic Journal Entry
- Type a realistic, multi-faceted reflection:
  ```text
  Today I arrived in Hyderabad for the Google Cloud Hackathon. I was struggling with the Cloud Run Dockerfile build yesterday, but after setting up the non-root nextjs user, the container compiled cleanly. My goal this week is to build two high-quality cloud prototypes and focus on system security.
  ```

### Step 5: Show Gemini Reflection
- Engage the interactive thinking companion powered by Gemini 2.5 Flash.
- Point out that Gemini acts as an empathetic Socratic companion without offering medical or psychological diagnosis.

### Step 6: Save Entry & Show Extracted Memories
- Click **Save Entry**.
- Show that Firestore persists the journal entry **before** AI enrichment.
- Show the generated title (*"Hyderabad Hackathon & Docker Build"*), summary, topic tags, and extracted memories.

### Step 7: Explore & Manage Memories (`/memories`)
- Navigate to `/memories`.
- Show extracted structured memories across categories:
  - **[ACHIEVEMENT]**: *"Resolved Cloud Run Docker build with non-root security"*
  - **[GOAL]**: *"Build two high-quality cloud prototypes this week"*
  - **[PLACE]**: *"Hyderabad (Google Cloud Hackathon)"*
- Filter by category (`GOAL`) and demonstrate one-click "View source" navigation back to the originating journal.

### Step 8: Open Ask My Journal (`/ask`)
- Navigate to the `/ask` interface.

### Step 9: Ask a Grounded Question About the Past
- Type:
  ```text
  What goals and technical milestones have I mentioned recently?
  ```

### Step 10: Show Evidence & Source References
- Review the synthesized answer: clearly states the Cloud Run milestone and prototype goals.
- Show the **Verified Source Citation Cards** linking directly to the specific journal ID.
- Explain: Model citations are strictly validated server-side; hallucinated IDs are rejected.

### Step 11: Ask a Question with No Supporting Evidence
- Type:
  ```text
  What did I write about visiting Paris?
  ```
- Show the **Zero-Evidence Fallback**:
  - The system detects no relevant evidence and explicitly replies: *"I couldn't find enough information in your journal to answer that confidently."*
  - Gemini is bypassed, eliminating hallucination risk.

### Step 12: Show Journal Rewind (`/rewind`)
- Select **7 Days** or **30 Days**.
- Show deterministic arithmetic metrics (total entries, active days, top topics) combined with a qualitative retrospective synthesis.

### Step 13: Show Personal Growth Timeline (`/timeline`)
- Show the unified chronological stream of journal entries, memories, and milestones.
- Highlight the **"What Changed?"** pattern shift insight at the top.

### Step 14: Show Personal Memory Map (`/map`)
- Show Hyderabad pinned on the interactive SVG canvas with a **"City-Level Centroid"** badge.
- Explain our **Zero Fabricated Coordinates Policy**:
  - Unresolved venues (e.g. *"Coffee shop near my office"*) remain cleanly listed in the offline list with `latitude: null, longitude: null`, preventing fake precision.

### Step 15: Show MindVault Insights (`/insights`)
- Show **Emerging Interests** (earlier vs recent mention count comparison).
- Show **Goal Momentum** with non-judgmental status indicators (`active`, `completed`, `dormant`).
- Show **Social & Geographic Footprint**.

### Step 16: Briefly Show Security & Privacy Architecture
- Explain the **Dual-Boundary Security Model**:
  - Firebase Admin token verification on all Cloud Run API routes.
  - Strict UID isolation (`users/{authenticatedUid}/*`).
  - Google Cloud Secret Manager for runtime Gemini API key resolution.
  - Per-user sliding-window rate limiting.

### Step 17: Briefly Show GitHub Repository
- Show the clean GitHub repository:
  - `https://github.com/pavankarthikeyaatchyuta-lab/MINDVAULT`
  - 70 automated tests passing across 16 test suites.
  - Multi-stage Dockerfile and full documentation.

---

## Closing Pitch (0:30)

> **"MindVault doesn't just store what you wrote.  
> It remembers it.  
> It lets you talk to your past.  
> And it helps you see how your life, goals, and interests are evolving — with verified security, zero synthetic coordinates, and strict source grounding on Google Cloud."**
