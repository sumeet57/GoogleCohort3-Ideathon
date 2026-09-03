#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID first}"
: "${REGION:?Set REGION first, e.g. us-central1}"
: "${SERVICE_NAME:=personal-gemini-journal-api}"
: "${SECRET_ID:=gemini-api-key}"
: "${CORS_ORIGINS:?Set CORS_ORIGINS to your deployed React URL}"

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/journal/journal-api:latest"

printf '\n==> Selecting project\n'
gcloud config set project "$PROJECT_ID"

gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com firestore.googleapis.com aiplatform.googleapis.com iamcredentials.googleapis.com

printf '\n==> Creating Artifact Registry repository if needed\n'
gcloud artifacts repositories create journal \
  --repository-format=docker \
  --location="$REGION" \
  --description="Personal Gemini Journal containers" 2>/dev/null || true

printf '\n==> Building container\n'
gcloud builds submit --tag "$IMAGE" .

printf '\n==> Creating least-privilege Cloud Run runtime service account\n'
RUNTIME_SA_NAME="journal-runtime"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud iam service-accounts create "$RUNTIME_SA_NAME" \
  --display-name="Personal Gemini Journal Cloud Run runtime" 2>/dev/null || true

printf '\n==> Granting runtime permissions\n'
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/datastore.user" \
  --quiet

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/aiplatform.user" \
  --quiet

gcloud secrets add-iam-policy-binding "$SECRET_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="$PROJECT_ID" \
  --quiet

printf '\n==> Deploying Cloud Run\n'
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=global,GEMINI_API_KEY_SECRET_ID=${SECRET_ID},GEMINI_API_KEY_SECRET_VERSION=latest,GEMINI_MODEL=gemini-3.6-flash,GEMINI_THINKING_LEVEL=MEDIUM,CORS_ORIGINS=${CORS_ORIGINS}" \
  --min-instances 0 \
  --max-instances 3 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 120 \
  --service-account "${RUNTIME_SA}"

echo "\nDeployed."
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)'
