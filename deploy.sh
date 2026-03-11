#!/bin/bash
# ==============================================================================
# Automated Deployment Script for Open House AI Storyteller
# This script automates packaging and deploying the Node.js backend to Cloud Run.
# ==============================================================================

PROJECT_ID="jane-luo-realtor"
REGION="europe-west1"
SERVICE_NAME="virtual-staging-storyteller"

echo "🚀 Starting automated deployment to Google Cloud Run..."

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --quiet

echo "✅ Deployment automation complete!"
echo "🌐 Your API is live at: https://virtual-staging-storyteller-346507335851.europe-west1.run.app"
