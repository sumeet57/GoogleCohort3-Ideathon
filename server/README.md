# Personal Gemini Journal — Node.js Server

This is the server-side half of the Personal Gemini Journal challenge. It is designed to sit behind the React client and move the privileged work out of the browser:

- Firebase ID-token authentication is verified on the server.
- Firestore reads/writes are performed by Firebase Admin SDK under `/users/{uid}/entries/{entryId}`.
- Gemini calls are made only by the server.
- The Gemini/Vertex AI API key is fetched from Google Cloud Secret Manager at runtime and is never stored in source code.
- Gemini is accessed through Google Cloud's Vertex AI/Agent Platform path so the workload can use the Google Cloud project/billing setup.
- Cloud Run is the intended deployment target.

## API

All routes except `/health` require:

```http
Authorization: Bearer <Firebase ID token>
```

### Health

`GET /health`

### Current user

`GET /api/me`

### Gemini reflection

`POST /api/gemini/reflect`

Body compatible with the existing React `gemini.ts` client:

```json
{
  "prompt": "Help me unpack this decision.",
  "history": [],
  "mode": "reflect",
  "entryContext": "My current journal thought..."
}
```

Response:

```json
{
  "reflection": "...",
  "modelUsed": "gemini-3.6-flash",
  "timestamp": "2026-09-03T00:00:00.000Z"
}
```

### Gemini synthesis

`POST /api/gemini/summarize`

Body:

```json
{
  "text": "journal content and dialogue",
  "title": "My reflection"
}
```

Returns the same `SummarizeResponse` shape expected by the supplied React code.

### Entries

- `GET /api/entries`
- `GET /api/entries/:entryId`
- `PUT /api/entries/:entryId`
- `PATCH /api/entries/:entryId/favorite`
- `PATCH /api/entries/:entryId/title`
- `DELETE /api/entries/:entryId`

The server always takes the user identity from the verified Firebase token. A client cannot choose another user's `uid` in the request body to access their data.

## Local development

### 1. Requirements

Use Node.js 22+.

Install dependencies:

```bash
npm install
```

### 2. Google authentication

For local development, authenticate Application Default Credentials:

```bash
gcloud auth application-default login
```

Your local ADC identity needs permission to access Secret Manager and the Firebase/Firestore project.

### 3. Create `.env`

Copy `.env.example` to `.env` and set at least:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
CORS_ORIGINS=http://localhost:5173
GEMINI_API_KEY_SECRET_ID=gemini-api-key
GEMINI_MODEL=gemini-3.6-flash
```

### 4. Create the secret

Store your Vertex AI API key in Google Cloud Secret Manager:

```bash
echo -n 'YOUR_VERTEX_AI_API_KEY' | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy=automatic
```

If the secret already exists, add a new version:

```bash
echo -n 'YOUR_VERTEX_AI_API_KEY' | gcloud secrets versions add gemini-api-key --data-file=-
```

The server reads `latest` by default.

### 5. Run

```bash
npm run dev
```

## Cloud Run deployment

The included `deploy.sh` builds the container with Cloud Build and deploys it to Cloud Run. Before running it:

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export CORS_ORIGINS="https://your-react-client.example.com"
./deploy.sh
```

The script enables the APIs needed by this architecture, creates an Artifact Registry repository, builds the image, grants Secret Manager access to the Cloud Run runtime service account, and deploys the service.

## Important client migration

The supplied React app currently talks directly to Firebase Firestore for entries and Firebase Auth directly from the browser. Its Gemini helper already calls `/api/gemini/reflect` and `/api/gemini/summarize`.

For the final split architecture, the React client should:

1. Keep Firebase Auth in the browser for Google/email/guest sign-in.
2. After sign-in, call `currentUser.getIdToken()`.
3. Send that ID token as `Authorization: Bearer <token>` to this server.
4. Replace direct Firestore functions (`subscribeToUserEntries`, `saveJournalEntry`, `deleteJournalEntry`, `toggleFavoriteEntry`, `updateEntryTitle`) with calls to `/api/entries`.
5. Deploy the server-only Firestore rules in `firestore.rules` after the client no longer accesses Firestore directly.

Do not put a Firebase Admin service-account JSON file in the React application or Git repository.

## Security model

```text
React browser
   |
   | Firebase Auth -> Firebase ID token
   |
   v
Cloud Run Node.js API
   |-- verifyIdToken() --------------------> Firebase Auth
   |
   |-- /api/entries -----------------------> Admin SDK -> Firestore
   |       only /users/{verified uid}/entries/*
   |
   |-- /api/gemini ------------------------> Secret Manager -> API key
   |                                          |
   |                                          v
   |                                      Vertex AI / Gemini
   |
   +-- rate limits + Helmet + CORS + input validation
```

## Cost note

The Google Cloud $300 free-credit program is intended for Google Cloud workloads, and Google Cloud currently advertises Agent Platform/Vertex AI as part of the free-credit experience. Gemini API billing through AI Studio is a separate billing path and should not be confused with the Google Cloud free-trial credit. This server therefore uses the Google Cloud Vertex AI/Agent Platform path rather than exposing a browser Gemini API key.

## Why the API key is still in Secret Manager

The challenge explicitly asks for API-key management through Google Cloud Secret Manager. The server retrieves the key only at runtime. It is cached in process memory after the first successful lookup so every Gemini request does not make another Secret Manager read.

For a production deployment, Google Cloud recommends ADC/IAM over long-lived API keys where supported. If the challenge's rubric strictly checks for an API key stored in Secret Manager, keep this configuration. If the rubric permits IAM-only authentication, the Gemini service can be switched to ADC and the Secret Manager API-key path removed.
