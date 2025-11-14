# Quick Deployment Reference

## Your Project Details

- **GCP Project ID**: `read-later-478110`
- **Service Name**: `read-later-backend`
- **Region**: `us-central1`

## One-Time Setup

```powershell
# Install gcloud CLI (if not already installed)
# Download from: https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init

# Set your project
gcloud config set project read-later-478110

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

## Deploy/Update Backend

```powershell
# Navigate to project root
cd "d:\Learning Stuffs\Mini Project Series\01-Read Later"

# Build and push Docker image to GCR
gcloud builds submit --tag gcr.io/read-later-478110/read-later-backend ./backend

# Deploy to Cloud Run
gcloud run deploy read-later-backend `
  --image gcr.io/read-later-478110/read-later-backend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated
```

## Update Frontend

After deploying backend, update `script.js`:

```javascript
const BACKEND_API_URL = 'https://YOUR-SERVICE-URL/extract-metadata';
```

Then commit and push:

```powershell
git add script.js
git commit -m "Update backend URL"
git push
```

## Useful Commands

```powershell
# View service logs
gcloud run services logs read read-later-backend --region us-central1

# View service details
gcloud run services describe read-later-backend --region us-central1

# List all services
gcloud run services list

# Delete service (if needed)
gcloud run services delete read-later-backend --region us-central1
```

## Important Notes

- **Project ID**: `read-later-478110` (already configured in files)
- Service URL will be provided after first deployment (likely: `https://read-later-backend-478110.a.run.app`)
- Backend automatically scales to zero when not in use
- Free tier: 2M requests/month, 360K GB-seconds memory
- Always verify billing is enabled (even for free tier)

## Testing

```powershell
# Test root endpoint (in browser)
https://your-service-url/

# Test API endpoint (PowerShell)
Invoke-RestMethod -Method Post -Uri "https://your-service-url/extract-metadata" `
  -ContentType "application/json" `
  -Body '{"url": "https://example.com"}'
```
