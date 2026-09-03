# Deployment checklist

1. Deploy the Node.js server first.
2. Copy its HTTPS Cloud Run URL into `VITE_API_URL`.
3. Configure the Firebase Web App values in `.env.local` / hosting environment.
4. Add the production frontend origin to the server `CORS_ORIGINS` environment variable.
5. Run `npm install && npm run build`.
6. Deploy the generated `dist/` or use the included nginx Dockerfile.

Do not add a Gemini API key to this project. The key belongs in Google Secret Manager on the backend.
