
# AI Journal & Cognitive Reflection Engine 🧠⚡

> Built for the **Google APAC Cohort 3 Ideathon** | `#AccelerateAIwithCloudRun`

A production-ready, user-authenticated personal journaling platform and cognitive synthesis engine built to transform daily unstructured thoughts into executive life insights. Powered by **Gemini 3.6 Flash**, **Firebase Authentication**, **Cloud Firestore**, and deployed as decoupled full-stack microservices on **Google Cloud Run**.

---

## 🌟 Live Architecture & Deployment Links

* **Frontend Client (Cloud Run):** [https://journal-client-525249553704.asia-south1.run.app](https://journal-client-525249553704.asia-south1.run.app)
* **Backend Microservice (Cloud Run):** [https://googlecohort3-ideathon-525249553704.asia-south1.run.app](https://googlecohort3-ideathon-525249553704.asia-south1.run.app)

---

## 🔥 Key Features

### 1. Multi-Turn Cognitive Reflection Dialogue
* **Context-Aware Prompts:** Engages users in multi-turn dialogues driven by Gemini 3.6 Flash across 4 tailored reflection modes:
  * **Reflect:** Deep-dives into daily thoughts and emotional states.
  * **Brainstorm:** Examines hidden trade-offs and alternative angles.
  * **Deepen:** Anchors gratitude and small breakthroughs.
  * **Synthesis:** Summarizes dialogue turns into actionable next steps.
* **Stream & History Injection:** Chat history and initial raw entries are injected into backend prompt payloads to maintain context awareness across turns.

### 2. Executive Synthesis Engine
* Automated, out-of-band extraction that compiles entire conversation streams into structured JSON objects containing:
  * Executive Summary
  * Dominant Mood Analysis
  * Key Realizations & Breakthroughs
  * Interactive Action Items (with local completion tracking)
  * Smart Auto-Tags

### 3. Geocoding & Location Pinning
* Secure Node.js reverse-geocoding route (`/api/location/geocode`) translates browser coordinates into human-readable locations.
* Integrated Google Maps redirection for spatial journaling context.

### 4. Cognitive Analytics & Insights
* Real-time aggregation of reflection stats: Total Entries, Total Words, Gemini Turns, and Realizations.
* Dynamic Emotional Landscape graph tracking dominant mood percentages.
* Master Archive of Realizations providing direct navigational access to historic breakthroughs.

### 5. Multi-Tenant Security & Isolation
* Built over **Cloud Firestore** with strict per-user document partitioning.
* Firebase Bearer token verification enforced on API endpoints to prevent unauthorized access.

### 6. Export & Data Portability
* Full Markdown (`.md`) export generator compiling raw thoughts, geolocation metadata, AI dialogues, and synthesized insights into downloadable files.

---

## 🛠️ Tech Stack & Google Cloud Services

| Layer | Technology / Service |
| :--- | :--- |
| **AI Model** | Gemini 3.6 Flash (via Google AI Studio / Gemini API) |
| **Hosting & Compute** | Google Cloud Run (Containerized Microservices) |
| **Containerization** | Docker + Nginx (Multi-Stage Builds) |
| **Build Pipeline** | Google Cloud Build & Artifact Registry |
| **Authentication** | Firebase Auth (Google OAuth, Email/Password, Anonymous Guest) |
| **Database** | Cloud Firestore (Document Partitioned, User-Isolated) |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide React, React Markdown |
| **Backend Runtime** | Node.js, Express.js |

---

## 📐 High-Level Architecture Flow

```text
[ React / Vite Client ]  ---> (Serving Static Assets via Nginx on Cloud Run)
         |
         |---> [ Firebase Auth ] (Google Sign-In / JWT Validation)
         |---> [ Cloud Firestore ] (User-Isolated Documents)
         |
         `---> [ Node.js Backend Microservice on Cloud Run ]
                     |
                     |---> [ Reverse Geocoding API ]
                     `---> [ Google AI Studio / Gemini 3.6 Flash API ]

```

---

## 🔒 Security & Data Isolation

* **Firestore Security Rules:** Access is strictly limited to authenticated user sessions (`request.auth.uid == userId`). No user can read, write, or query another user's journal entries or reflection history.
* **API Route Authorization:** The Node.js backend verifies Firebase ID tokens via Bearer headers on incoming requests (`/api/location/geocode`, `/api/gemini`) to enforce zero-trust endpoint access.
* **CORS Locking:** Backend API endpoints explicitly lock cross-origin requests to the frontend Cloud Run domain (`https://journal-client-525249553704.asia-south1.run.app`).

---

## ⚙️ Environment Configuration Reference

### Frontend Client (`/client`)
```env
VITE_API_URL=[https://googlecohort3-ideathon-525249553704.asia-south1.run.app](https://googlecohort3-ideathon-525249553704.asia-south1.run.app)
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=apac-cohort3-507521.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=apac-cohort3-507521
VITE_FIREBASE_STORAGE_BUCKET=apac-cohort3-507521.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=525249553704
VITE_FIREBASE_APP_ID=1:525249553704:web:bbec44868592e350b45c1d
VITE_FIREBASE_MEASUREMENT_ID=G-99V0XB9DZ7

```

### Backend Microservice (`/server`)

```env
NODE_ENV=production
GOOGLE_CLOUD_PROJECT=apac-cohort3-507521
GOOGLE_CLOUD_LOCATION=global
GEMINI_THINKING_LEVEL=MEDIUM
GEMINI_MODEL=gemini-3.6-flash
CORS_ORIGINS=[https://journal-client-525249553704.asia-south1.run.app](https://journal-client-525249553704.asia-south1.run.app)
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

```

---

## 📄 Documentation & Build Scripts

For container build scripts, Docker configurations, Nginx setups, and Cloud Build pipeline configurations, refer to [DEPLOYMENT.md](https://github.com/sumeet57/GoogleCohort3-Ideathon/DEPLOYMENT.md).

```

```