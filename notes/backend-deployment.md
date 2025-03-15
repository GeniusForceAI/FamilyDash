# Backend Deployment Guide

## Railway Deployment Configuration

Our FastAPI backend is deployed on Railway using the following configuration:

### railway.toml
```toml
[build]
builder = "nixpacks"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "uvicorn server:app --host 0.0.0.0 --port 8080"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
```

### GitHub Actions Workflow (.github/workflows/backend-deploy.yml)
```yaml
name: Deploy Backend to Railway

on:
  push:
    branches: [ main ]
    paths:
      - '**.py'
      - 'requirements.txt'
      - 'railway.toml'
      - '.github/workflows/backend-deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

## Key Components

1. **Python Version**: 3.12
2. **Key Dependencies**:
   - FastAPI 0.104.1
   - Uvicorn 0.24.0

## Deployment Process

1. Code is pushed to the `main` branch
2. GitHub Actions workflow is triggered when Python files or configuration files change
3. Railway builds the application using nixpacks
4. Application is started using uvicorn on port 8080
5. Health check endpoint `/api/health` verifies successful deployment

## Production URL
The backend is accessible at: `https://web-production-f4beb.up.railway.app/`

## Local Testing
To test the backend locally:
```bash
uvicorn server:app --reload --port 8000
```

## Important Notes
- Railway requires a paid plan for deployment
- Environment variables are managed through Railway's dashboard
- Health check endpoint must respond within 100ms timeout
