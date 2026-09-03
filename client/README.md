# Personal Gemini Journal — Client

Separate React client for the Node.js backend created for the Personal Gemini Journal challenge.

## Important architecture

The browser uses Firebase **Authentication only**. It no longer reads or writes Firestore directly and it never contains a Gemini API key. Journal data and Gemini calls go through the Node.js backend.

```text
React/Vite
   │
   ├── Firebase Auth → sign in / sign up / Google / guest
   │
   └── Bearer Firebase ID token
             │
             ▼
       Node.js / Cloud Run
          │        │
          ▼        ▼
      Firestore   Gemini
```

## 1. Configure Firebase Web App

Create/copy the Firebase Web App configuration into `.env.local`. The Firebase web configuration is public client configuration; **do not put the Gemini/Secret Manager key here**.

```bash
cp .env.example .env.local
```

Set:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:8080
```

Enable the same Firebase Authentication providers used by the original UI:
- Google
- Email/password
- Anonymous

## 2. Run locally

```bash
npm install
npm run dev
```

Run the server separately on port 8080. The browser will send Firebase ID tokens to it.

## 3. Production

Set `VITE_API_URL` to the deployed Cloud Run server URL **before building**:

```env
VITE_API_URL=https://YOUR-CLOUD-RUN-SERVICE-URL
```

Then:

```bash
npm run build
```

The included Dockerfile serves the Vite build through nginx on port 8080.

## Client → server API mapping

- `GET /api/entries` — load the signed-in user's entries
- `PUT /api/entries/:entryId` — save/update an entry
- `PATCH /api/entries/:entryId/favorite` — toggle favorite
- `PATCH /api/entries/:entryId/title` — update title
- `DELETE /api/entries/:entryId` — delete entry
- `POST /api/gemini/reflect` — multi-turn reflection
- `POST /api/gemini/summarize` — structured synthesis

Every API request automatically attaches the current Firebase ID token as `Authorization: Bearer <token>`.

## Real-time note

The original browser client used a Firestore `onSnapshot` listener. Because this architecture deliberately removes browser Firestore access, `subscribeToUserEntries()` uses a lightweight 5-second API refresh instead. Saves/deletes are still performed immediately through the backend.
