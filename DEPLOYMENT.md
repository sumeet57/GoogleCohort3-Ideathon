
# Google Cloud Run Deployment Guide 🚀

This document outlines the step-by-step procedure used to deploy the decoupled full-stack application (React Client & Express Backend) to **Google Cloud Run** using **Docker** and **Cloud Build** for the **Google APAC Cohort 3 Ideathon**.

---

## 📋 Overview of Deployment Architecture

The application is deployed as two independent, user-authenticated microservices on Cloud Run:
* **Backend API (`googlecohort3-ideathon`):** Node.js / Express microservice communicating with Gemini 3.6 Flash, Google Maps Geocoding API, and Firestore.
* **Frontend UI (`journal-client`):** React 18 / Vite single-page application served via an optimized Nginx web server container listening on port `8080`.

---

## 1. Deploying Backend Microservice

Navigate to your `/server` directory and deploy using `gcloud run deploy` with all production environment variables set:

```bash
cd server

gcloud run deploy googlecohort3-ideathon \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV="production",GOOGLE_CLOUD_PROJECT="apac-cohort3-507521",GOOGLE_CLOUD_LOCATION="global",GEMINI_THINKING_LEVEL="MEDIUM",GEMINI_MODEL="gemini-3.6-flash",CORS_ORIGINS="[https://journal-client-525249553704.asia-south1.run.app](https://journal-client-525249553704.asia-south1.run.app)",GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

```

Once deployed, verify the output service URL: `https://googlecohort3-ideathon-525249553704.asia-south1.run.app`.

---

## 2. Deploying Frontend Client

### Step 1: Client Dockerfile (`client/Dockerfile`)

Ensure `client/Dockerfile` uses a multi-stage build to accept `ARG` build variables and output static assets to Nginx:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# Accept build arguments for Vite compilation
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

# Export build args to environment variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

```

### Step 2: Nginx Web Server Configuration (`client/nginx.conf`)

Configure Nginx to listen on port `8080` and route single-page application requests to `index.html`:

```nginx
server {
    listen 8080;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri$uri/ /index.html;
    }
}

```

### Step 3: Cloud Build Configuration (`client/cloudbuild.yaml`)

Create `client/cloudbuild.yaml` to bake client environment variables into the Docker build stage:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'asia-south1-docker.pkg.dev/apac-cohort3-507521/cloud-run-source-deploy/journal-client:latest'
      - '--build-arg'
      - 'VITE_API_URL=[https://googlecohort3-ideathon-525249553704.asia-south1.run.app](https://googlecohort3-ideathon-525249553704.asia-south1.run.app)'
      - '--build-arg'
      - 'VITE_FIREBASE_API_KEY=AIzaSyBLw1qorRo_3IpF9PSHQjxsVBTsM2oMUDs'
      - '--build-arg'
      - 'VITE_FIREBASE_AUTH_DOMAIN=apac-cohort3-507521.firebaseapp.com'
      - '--build-arg'
      - 'VITE_FIREBASE_PROJECT_ID=apac-cohort3-507521'
      - '--build-arg'
      - 'VITE_FIREBASE_STORAGE_BUCKET=apac-cohort3-507521.firebasestorage.app'
      - '--build-arg'
      - 'VITE_FIREBASE_MESSAGING_SENDER_ID=525249553704'
      - '--build-arg'
      - 'VITE_FIREBASE_APP_ID=1:525249553704:web:bbec44868592e350b45c1d'
      - '--build-arg'
      - 'VITE_FIREBASE_MEASUREMENT_ID=G-99V0XB9DZ7'
      - '.'

images:
  - 'asia-south1-docker.pkg.dev/apac-cohort3-507521/cloud-run-source-deploy/journal-client:latest'

```

### Step 4: Submit Build & Deploy Client to Cloud Run

Run these commands inside `/client`:

```bash
cd client

# 1. Trigger Cloud Build using cloudbuild.yaml
gcloud builds submit --config=cloudbuild.yaml .

# 2. Deploy Container Image to Cloud Run
gcloud run deploy journal-client \
  --image asia-south1-docker.pkg.dev/apac-cohort3-507521/cloud-run-source-deploy/journal-client:latest \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080

```

Verify client deployment URL: `https://journal-client-525249553704.asia-south1.run.app`.

---

## 3. Security & CORS Verification Checklist

1. **Backend CORS Environment Variable:** `CORS_ORIGINS` on the backend is strictly locked to `https://journal-client-525249553704.asia-south1.run.app` to prevent unauthorized cross-origin requests.
2. **Firebase Authorized Domains:** `journal-client-525249553704.asia-south1.run.app` is whitelisted under **Firebase Console > Authentication > Settings > Authorized Domains**.
3. **Firestore Security Rules:** Access is restricted to authenticated user sessions where `request.auth.uid == userId`.

```