# Google Cloud Run Deployment Guide

This guide will walk you through deploying the Flask backend to Google Cloud Run.

## Prerequisites

### 1. Google Cloud Account
- Active Google Cloud Platform account
- **Important**: Enable billing on your GCP project (required even for free tier)
- Free Tier includes: 2 million requests/month, 360,000 GB-seconds memory, 180,000 vCPU-seconds

### 2. GCP Project
- Have an active GCP Project ID ready
- You can create a new project at [console.cloud.google.com](https://console.cloud.google.com)

### 3. Install Google Cloud SDK
- Install the gcloud CLI: [Install gcloud CLI](https://cloud.google.com/sdk/docs/install)
- After installation, initialize the SDK:
```bash
gcloud init
```
- Log in with your Google account and select your GCP project

### 4. Docker (Optional)
- Docker is useful for local testing but not required
- Cloud Build can handle remote builds

## Project Structure

Your backend directory should contain:
```
backend/
├── app.py              # Flask application (app instance must be named 'app')
├── requirements.txt    # Python dependencies including gunicorn
├── Dockerfile          # Container configuration
└── .dockerignore       # Files to exclude from Docker build
```

## Deployment Steps

### Step 1: Configure gcloud CLI

Open your terminal and navigate to your project root directory:

```powershell
cd "d:\Learning Stuffs\Mini Project Series\01-Read Later"
```

Set your GCP Project ID (replace with your actual project ID):

```powershell
gcloud config set project YOUR_GCP_PROJECT_ID
```

Enable required APIs:

```powershell
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

### Step 2: Build and Push Docker Image

Build your Docker image and push it to Google Container Registry:

```powershell
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/read-later-backend ./backend
```

**What this does**:
- Builds a Docker image using your Dockerfile
- Pushes the image to Google Container Registry (GCR)
- The tag format is: `gcr.io/PROJECT_ID/IMAGE_NAME`

This process may take 2-5 minutes. You'll see build progress in your terminal.

### Step 3: Deploy to Cloud Run

Deploy your container to Cloud Run:

```powershell
gcloud run deploy read-later-backend `
  --image gcr.io/YOUR_GCP_PROJECT_ID/read-later-backend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated
```

**Command breakdown**:
- `read-later-backend`: Your Cloud Run service name
- `--image`: The Docker image from GCR
- `--platform managed`: Use fully managed Cloud Run
- `--region us-central1`: Choose region (options: us-central1, us-east1, europe-west1, asia-east1)
- `--allow-unauthenticated`: Makes API publicly accessible (required for frontend)

**Prompts**:
- Service name: Press Enter to accept
- Region: Press Enter to accept
- Allow unauthenticated invocations: Type `Y` and press Enter

### Step 4: Get Your Service URL

After deployment completes, you'll see output like:

```
Service [read-later-backend] revision [read-later-backend-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://read-later-backend-xxxxxx-uc.a.run.app
```

**Copy this Service URL** - this is your backend API endpoint!

### Step 5: Update Frontend Configuration

Update your `script.js` file with the new backend URL:

```javascript
// In script.js
const BACKEND_API_URL = 'https://read-later-backend-xxxxxx-uc.a.run.app/extract-metadata';
```

Replace `https://read-later-backend-xxxxxx-uc.a.run.app` with your actual Service URL from Step 4.

### Step 6: Deploy Updated Frontend

Commit and push your changes to trigger frontend redeployment:

```powershell
git add script.js
git commit -m "Update backend URL to Cloud Run endpoint"
git push
```

Your frontend platform (Vercel/Netlify) will automatically redeploy.

## Testing Your Deployment

### Test Backend Directly

1. **Check the root endpoint** in your browser:
   ```
   https://read-later-backend-xxxxxx-uc.a.run.app
   ```
   Should display: "Read Later Backend is running!"

2. **Test the API endpoint** using curl:
   ```powershell
   curl -X POST https://read-later-backend-xxxxxx-uc.a.run.app/extract-metadata `
     -H "Content-Type: application/json" `
     -d '{\"url\": \"https://example.com\"}'
   ```

3. **Use Postman or Insomnia**:
   - Method: POST
   - URL: `https://your-service-url/extract-metadata`
   - Body (JSON):
     ```json
     {
       "url": "https://www.theverge.com/tech"
     }
     ```

### Test Full Application

Open your deployed frontend and try adding an article URL. It should successfully fetch metadata!

## Updating Your Backend

When you make changes to your backend code:

1. **Rebuild and push** the new image:
   ```powershell
   gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/read-later-backend ./backend
   ```

2. **Redeploy** to Cloud Run:
   ```powershell
   gcloud run deploy read-later-backend `
     --image gcr.io/YOUR_GCP_PROJECT_ID/read-later-backend `
     --platform managed `
     --region us-central1 `
     --allow-unauthenticated
   ```

Cloud Run automatically creates new revisions and routes traffic to them.

## Monitoring and Management

### View Service in Console
Visit [console.cloud.google.com/run](https://console.cloud.google.com/run) to:
- View service logs
- Monitor requests and latency
- Check resource usage
- Manage revisions
- View metrics

### View Logs
```powershell
gcloud run services logs read read-later-backend --region us-central1
```

### View Service Details
```powershell
gcloud run services describe read-later-backend --region us-central1
```

## Cost Management

### Free Tier Limits (Monthly)
- **Requests**: 2 million
- **Memory**: 360,000 GB-seconds
- **CPU**: 180,000 vCPU-seconds
- **Egress**: 1 GB

### Best Practices
- Monitor usage in GCP Console
- Set up billing alerts
- Cloud Run scales to zero when not in use (no charges)
- You're only billed when requests are being processed

## Troubleshooting

### Build Fails
- Check Dockerfile syntax
- Verify all files exist in backend directory
- Ensure requirements.txt includes all dependencies

### Deployment Fails
- Verify APIs are enabled (Cloud Build, Cloud Run)
- Check billing is enabled on project
- Ensure you have necessary IAM permissions

### 403 Forbidden Errors
- Verify `--allow-unauthenticated` flag was used
- Check CORS settings in Flask app

### Backend Not Responding
- Check logs: `gcloud run services logs read read-later-backend`
- Verify container is listening on PORT 8080
- Check that gunicorn is in requirements.txt

### CORS Issues
- Ensure `flask-cors` is installed
- Verify CORS is properly configured in app.py

## Security Considerations

### Current Setup (Development/Personal Use)
- `--allow-unauthenticated`: Public API access
- CORS enabled for all origins
- No authentication required

### For Production
Consider implementing:
- API key authentication
- Rate limiting
- CORS restrictions to specific domains
- Cloud Run authentication
- Secret Manager for sensitive data

## Regions Available

Choose a region close to your users:
- **US**: us-central1, us-east1, us-west1
- **Europe**: europe-west1, europe-north1
- **Asia**: asia-east1, asia-northeast1
- **Other**: See [Cloud Run locations](https://cloud.google.com/run/docs/locations)

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference/run)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Best Practices](https://cloud.google.com/run/docs/tips)

## Quick Reference Commands

```powershell
# Set project
gcloud config set project YOUR_GCP_PROJECT_ID

# Build and push
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/read-later-backend ./backend

# Deploy
gcloud run deploy read-later-backend --image gcr.io/YOUR_GCP_PROJECT_ID/read-later-backend --platform managed --region us-central1 --allow-unauthenticated

# View logs
gcloud run services logs read read-later-backend --region us-central1

# List services
gcloud run services list

# Delete service (if needed)
gcloud run services delete read-later-backend --region us-central1
```

---

**Note**: Replace `YOUR_GCP_PROJECT_ID` with your actual Google Cloud Project ID throughout all commands.
