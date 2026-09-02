# MindVault — Official Hackathon Live Demo Script (3–5 Minutes)

> **"Your journal that remembers."**  
> *Google Cloud Gen AI Academy Cohort 3 Ideathon Submission*

---

## 1. The Core Problem (0:00 – 0:30)

> "Most people who try journaling abandon it. Traditional journals are write-only graveyards of thoughts: you write an entry, close the book or app, and those thoughts disappear into chronological archives you rarely revisit.
>
> What if your journal was an active, intelligent memory partner? What if you could ask it questions about your past decisions, see where you've traveled, track your personal growth patterns, and never lose an idea or achievement again?
>
> That is **MindVault**."

---

## 2. The Product Promise (0:30 – 0:45)

> "MindVault is a production-grade personal AI journal built on Next.js 15, Firebase, Google Cloud Run, Secret Manager, and Gemini 2.5 Flash.
>
> It operates on a strict Dual-Boundary Security Model: client-side requests never dictate authorization, user journal data is strictly isolated by authenticated UID, and all AI-generated assertions are grounded with verified source links."

---

## 3. Step 1: Write an Entry with the Gemini Thinking Companion (0:45 – 1:30)

1. **Open `/journal`**:
   - Point out the clean, writing-first interface.
2. **Type a realistic reflection**:
   ```text
   Today I arrived in Hyderabad for the Google Cloud Hackathon. I was struggling with the Cloud Run Docker build yesterday, but after fixing the non-root user permissions, I got the service running smoothly. My goal for this week is to build two high-quality cloud prototypes and focus on backend system security.
   ```
3. **Engage the Gemini Thinking Companion**:
   - Notice the multi-turn reflective companion: it doesn't judge, lecture, or diagnose. It asks an insightful clarifying question: *"What specific security boundaries were hardest to establish in your Dockerfile?"*
4. **Save Entry**:
   - Click **Save Entry**.
   - Notice what happens deterministically:
     - The entry is persisted into Firestore (`users/{uid}/journals/{id}`) **before** calling AI enrichment.
     - Gemini automatically synthesizes an evocative title: *"Hyderabad Hackathon & Docker Hardening"*.
     - Gemini extracts objective topics: `["Cloud Run", "Docker", "Security", "Hackathon"]`.
     - Gemini extracts structured memories across 9 categories.

---

## 4. Step 2: Explore Structured Memories (`/memories`) (1:30 – 2:00)

1. **Navigate to `/memories`**:
   - Show the extracted structured memory cards:
     - **[ACHIEVEMENT]**: *"Got Cloud Run Docker build working smoothly with non-root security"*
     - **[GOAL]**: *"Build two high-quality cloud prototypes this week"*
     - **[PLACE]**: *"Hyderabad (Google Cloud Hackathon)"*
2. **Filter by Category**:
   - Click the **GOAL** filter badge. Notice how the view instantaneously focuses on goals.
3. **Traceability**:
   - Click the **View source** link on a memory card. It navigates directly back to the original journal entry.

---

## 5. Step 3: Ask My Journal (`/ask`) (2:00 – 2:45)

1. **Navigate to `/ask`**:
   - Show the natural language query interface.
2. **Ask a targeted question**:
   ```text
   What goals and technical milestones have I mentioned recently?
   ```
3. **Explain the Multi-Signal Hybrid Retrieval**:
   - The backend runs multi-signal lexical, category-intent (`GOAL`, `ACHIEVEMENT`), and temporal-window scoring across the user's private Firestore documents.
   - Zero external vector database required; zero data leakage to third parties.
4. **Inspect the Answer**:
   - The response synthesizes the answer with high confidence: *"You recently achieved getting your Cloud Run Docker build running with non-root user permissions, and set a goal to build two high-quality cloud prototypes focusing on backend system security."*
   - Show the **Verified Source Citation Cards**:
     - Cites the exact journal entry ID, title, and excerpt.
     - Demonstrate that the model cannot fabricate citations: every citation is validated server-side.

---

## 6. Step 4: Journal Rewind & Growth Timeline (2:45 – 3:30)

1. **Open `/rewind`**:
   - Select **7 Days** or **30 Days**.
   - Show the **Deterministic Statistics**: Entry count, active days, and top themes are computed by database arithmetic, never guessed by AI.
   - Show the qualitative retrospective synthesis and standout moment.
2. **Open `/timeline`**:
   - Show the unified chronological stream of journal entries, memories, and milestones.
   - Highlight the **"What Changed?"** pattern shift card at the top, showing how recent themes compare to earlier themes.

---

## 7. Step 5: Personal Memory Map (`/map`) & Grounded Insights (`/insights`) (3:30 – 4:15)

1. **Open `/map`**:
   - Show the interactive map canvas with Hyderabad pinned.
   - Point out the badge: **"City-Level Centroid (Known Hub Database)"**.
   - Explain our **Zero Fabricated Coordinates** policy:
     - *"If a user writes 'Local coffee shop near work', we do NOT make up fake latitude and longitude. It sits cleanly in the 'Unresolved Places' list with its linked memories. We never invent fake precision."*
2. **Open `/insights`**:
   - Show **Emerging Interests**: Topics that increased in frequency recently vs earlier.
   - Show **Goal Momentum**: Non-judgmental status indicators (`active`, `completed`, `dormant`).
   - Show **Social & Geographic Footprint**: Top people and places mentioned in writing.

---

## 8. Closing Pitch (4:15 – 4:45)

> **"MindVault doesn't just store what you wrote.  
> It remembers it.  
> It lets you talk with your past.  
> And it helps you see how your life, goals, and interests are evolving.  
> All with zero synthetic coordinates, complete UID isolation, and prompt injection defense on Google Cloud."**

---

## Live Demo Troubleshooting Checklist

| Scenario | Immediate Action |
| :--- | :--- |
| **New Test Account with 0 entries** | Demonstrate the graceful empty state cards on `/insights`, `/map`, and `/rewind`, then write Entry #1 to show the immediate transformation. |
| **Rate limit warning (HTTP 429)** | Explain the in-memory sliding-window rate limiter protecting Cloud Run from quota exhaustion. Wait 30 seconds. |
| **Network latency** | Explain that Firestore persistence occurs synchronously first, ensuring no journal loss even under spotty connectivity. |
