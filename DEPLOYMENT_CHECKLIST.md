# Deployment Checklist

Use this checklist to ensure a smooth deployment to Google Cloud Run.

## Pre-Deployment

- [ ] Google Cloud account created
- [ ] Billing enabled on GCP project (required even for free tier)
- [ ] GCP Project ID obtained
- [ ] gcloud CLI installed and initialized
- [ ] Logged into gcloud with `gcloud init`
- [ ] Project set with `gcloud config set project YOUR_GCP_PROJECT_ID`

## Backend Files Ready

- [ ] `backend/app.py` - Flask application exists
- [ ] `backend/requirements.txt` - Includes Flask, flask-cors, requests, beautifulsoup4, gunicorn
- [ ] `backend/Dockerfile` - Docker configuration created
- [ ] `backend/.dockerignore` - Docker ignore file created

## Enable GCP Services

- [ ] Cloud Build API enabled
- [ ] Cloud Run API enabled
- [ ] Command: `gcloud services enable cloudbuild.googleapis.com run.googleapis.com`

## Build and Deploy

- [ ] Navigate to project root directory
- [ ] Build Docker image: `gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/read-later-backend ./backend`
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Deploy to Cloud Run with command in DEPLOYMENT.md
- [ ] Note the Service URL from deployment output

## Update Frontend

- [ ] Copy the Cloud Run Service URL
- [ ] Update `script.js` with new backend URL
- [ ] Format: `https://read-later-backend-xxxxxx-uc.a.run.app/extract-metadata`
- [ ] Commit changes: `git add script.js`
- [ ] Commit message: `git commit -m "Update backend URL to Cloud Run"`
- [ ] Push to repository: `git push`

## Testing

- [ ] Test backend root: Visit `https://your-service-url/` (should show "Read Later Backend is running!")
- [ ] Test API endpoint with curl or Postman
- [ ] Wait for frontend redeployment (Vercel/Netlify auto-deploys)
- [ ] Test full application by adding an article URL
- [ ] Verify metadata extraction works
- [ ] Test read/unread toggle
- [ ] Test tag filtering
- [ ] Test view mode switching (list/grid)

## Post-Deployment

- [ ] Monitor logs in GCP Console
- [ ] Check Cloud Run metrics dashboard
- [ ] Set up billing alerts (optional but recommended)
- [ ] Bookmark Cloud Run service URL
- [ ] Save your GCP Project ID for future updates

## Future Updates

When you update your backend code:

1. [ ] Make changes to `backend/app.py`
2. [ ] Rebuild: `gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/read-later-backend ./backend`
3. [ ] Redeploy: Use same deploy command as initial deployment
4. [ ] Cloud Run will create new revision automatically
5. [ ] Test the updated functionality

## Common Issues Checklist

If deployment fails, verify:

- [ ] Billing is enabled on GCP project
- [ ] gcloud CLI is up to date
- [ ] You have Owner or Editor role on GCP project
- [ ] All required APIs are enabled
- [ ] Dockerfile syntax is correct
- [ ] requirements.txt includes gunicorn
- [ ] app.py Flask instance is named 'app'
- [ ] Region is spelled correctly (us-central1, not us-central-1)

## Monitoring Checklist

- [ ] Check Cloud Run dashboard: [console.cloud.google.com/run](https://console.cloud.google.com/run)
- [ ] Review request counts
- [ ] Monitor memory usage
- [ ] Check error rates
- [ ] Verify you're staying within free tier limits

## Notes

**Your GCP Project ID**: `read-later-478110`

**Your Cloud Run Service URL**: `https://read-later-backend-478110.a.run.app` (verify after deployment)

**API Endpoint**: `https://read-later-backend-478110.a.run.app/extract-metadata`

**Deployment Date**: ___________________________

**Region Used**: `us-central1`

**Deployment Revision**: ___________________________
