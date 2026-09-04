# MindVault — Social Media Post Draft

> **Ready to share on LinkedIn / X (Twitter) for the Google Cloud Gen AI Academy Cohort 3 APAC Ideathon**

---

### LinkedIn / X Post

🚀 Excited to present **MindVault — Your journal that remembers**, built for the **Google Cloud Gen AI Academy Cohort 3 APAC Ideathon**!

📖 **The Problem:**
Most personal journals are write-only graveyards of thoughts. You write an entry, close the book or app, and your reflections disappear into chronological archives you rarely revisit.

✨ **The Innovation:**
MindVault transforms journaling into an active, intelligent memory partner through a continuous loop:
**Write ➔ Remember ➔ Ask ➔ Reflect ➔ Understand ➔ Locate ➔ Evolve**

🧠 **How It Works:**
1. **Reflective Journaling**: Multi-turn conversational companion powered by **Google Gemini 2.5 Flash** (`@google/genai`).
2. **Structured Memories**: Automatically extracts actionable memories across 9 categories (goals, achievements, ideas, decisions, places, etc.).
3. **Ask My Journal**: Query your past thoughts with multi-signal hybrid retrieval and verified source citations.
4. **Journal Rewind & Timeline**: Retrospective period synthesis and pattern shift tracking ("What Changed?").
5. **Personal Memory Map**: Interactive memory map with verified location provenance and zero synthetic coordinates.
6. **MindVault Insights**: Grounded analytics tracking emerging interests and goal momentum over time.

🛡️ **Google Cloud Architecture & Privacy:**
- **Firebase Authentication & Firebase Admin SDK**: Strict token verification and UID derivation.
- **Cloud Firestore**: Dual-boundary isolation scoped strictly to `users/{authenticatedUid}/*`.
- **Google Cloud Secret Manager**: Secure server-side resolution of `MINDVAULT_GEMINI_API_KEY` with zero client key exposure.
- **Google Cloud Run**: Target serverless container architecture engineered with non-root security and health check monitoring.
- **AI Security Constitution**: Prompt injection defense, source validation, and in-memory rate limiting.

Check out our open-source codebase, full architecture documentation, and 70 passing automated security tests on GitHub:
👉 https://github.com/pavankarthikeyaatchyuta-lab/MINDVAULT

#GoogleCloud #GenAIAcademy #AccelerateAIwithCloudRun #NextJS #Firebase #GeminiAI #CloudRun #BuildWithAI
