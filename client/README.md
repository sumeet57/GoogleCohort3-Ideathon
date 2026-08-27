# AI Journal & Reflections (Gemini 3.6 Flash + Cloud Firestore)

A production-grade, user-authenticated reflective journaling and cognitive synthesis web application. Built with **Firebase Authentication**, **Cloud Firestore** (with strict path-bound user data isolation), **Express.js**, **React 19**, and **Gemini 3.6 Flash** via the `@google/genai` SDK.

---

## 🛡️ Agentic Threat Modeling & Security Posture

| Threat Zone | Identified Risks & Vectors | Countermeasures & Implementation Guardrails |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious injection in journal entries, oversized prompt payloads, NoSQL injection patterns. | Strict schema validation, text trimming, payload character constraints (`size <= 10000`), and defensive null/type parsing. |
| **2. Planning & Reasoning** | Prompt injection attempting to alter reflection persona or exfiltrate cross-session context. | Explicit system instructions separating system rules from user input. Resilient fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |
| **3. Tool & Server Execution** | API key leakage, unauthenticated AI endpoint invocations, SSRF / dynamic execution. | Server-side proxy (`/api/gemini/reflect` and `/api/gemini/summarize`), secrets kept strictly on server via environment variables / Secret Manager. |
| **4. Memory & State** | Cross-tenant data leaks, unauthorized reads/writes to other users' private journal entries. | Path-bound Firestore security rules (`request.auth.uid == userId`), strict subcollection isolation (`/users/{userId}/entries/{entryId}`), and defensive undefined-stripping prior to persistence. |
| **5. Inter-System Communication** | Token interception, unauthenticated Firebase calls. | Firebase Auth token verification, pop-up Google Auth with zero plain-text password handling. |

---

## 🔒 1. Firestore Security Rules

The application uses zero insecure defaults with path-bound owner validation to isolate each user's entries:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all root-level access by default
    match /{document=**} {
      allow read, write: if false;
    }

    // Strict User Data Isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🔑 2. Secret Management Setup (Google Cloud Secret Manager)

To configure the Gemini API key securely for Cloud Run deployments:

```bash
# Enable the Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 3. Cloud Run Deployment Flow & Verification Label

### Deploy the Application Container:
```bash
# Build and deploy to Google Cloud Run
gcloud run deploy ai-journal-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Apply Required Campaign Verification Label:
```bash
gcloud run services update ai-journal-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Comprehensive Functional Verification Walkthrough

Every user interaction is fully functional and can be tested through the following step-by-step test matrix:

### Test Case 1: Federated User Authentication (Google & Email)
1. Navigate to the landing page.
2. Click **"Continue with Google"** to authenticate via Google pop-up, or enter an email/password under **"Sign In"** / **"Sign Up"**.
3. Verify that on successful authentication, the private dashboard is immediately loaded and the navbar displays your profile avatar and user badge.

### Test Case 2: Multi-Turn Conversational Reflection with Gemini 3.6 Flash
1. On the **Reflect** tab, type a raw thought or brain dump into the **"Raw Journal Entry & Thoughts"** textarea (e.g. *"I am feeling torn between two career opportunities..."*).
2. Select a reflection mode pill from the prompt bar: **Reflect & Question**, **Brainstorm Ideas**, or **Deep Exploration**.
3. Click one of the cognitive starters (e.g. *"Decision Crossroads"*) or type a custom question in the prompt input and click **Send**.
4. Verify the loading indicator displays while Gemini generates the response using the resilient fallback ladder (`gemini-3.6-flash`).
5. Confirm the response renders properly formatted Markdown with bold headings, probing questions, and structured bullet points.
6. Verify the **"Saved to Firestore"** status badge confirms that both the user message and the Gemini response were persisted.

### Test Case 3: Executive Cognitive Synthesis
1. Click the **"Synthesize Reflection"** button in the reflection header.
2. Confirm that Gemini analyzes the raw text and conversation history to produce a structured JSON synthesis containing:
   - An executive summary.
   - 3 bulleted Key Insights & Realizations.
   - Concrete action items with clickable completion checkboxes.
   - Dominant mood tag (e.g. *Reflective*, *Focused*, *Hopeful*).
3. Test toggling completion on the action item checkboxes.
4. Verify the synthesis data is saved to the Firestore document.

### Test Case 4: Archive History, Search, & Export
1. Click the **"History"** tab in the top navigation.
2. Verify your saved entry appears in the list with title, date, mood badge, word count, and turn count.
3. Test the search bar by typing a keyword from your entry or synthesis.
4. Test filtering by **"Favorites Only"** or specific **Mood** dropdowns.
5. Click the **Download (Export)** icon to verify it downloads a clean `.md` Markdown file containing the title, date, journal text, synthesis, and dialogue.
6. Click the entry card to reload it into the active editor for continuation.

### Test Case 5: Cognitive Analytics & Insights
1. Click the **"Insights"** tab in the navigation bar.
2. Verify the metric cards display accurate real-time aggregates: **Total Reflections**, **Words Written**, **AI Dialogues**, and **Key Realizations**.
3. Check the **Dominant Emotional Landscape** progress bars and the **Master Archive of Realizations** list.
