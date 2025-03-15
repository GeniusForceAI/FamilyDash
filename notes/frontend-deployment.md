# Frontend Deployment Guide

## GitHub Pages Deployment Configuration

Our frontend is deployed on GitHub Pages using GitHub Actions. The deployment automatically triggers when changes are made to frontend-related files.

### GitHub Actions Workflow (.github/workflows/frontend-deploy.yml)
```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [ main ]
    paths:
      - 'index.html'
      - 'css/**'
      - 'js/**'
      - 'pages/**'
      - '.github/workflows/frontend-deploy.yml'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## API Configuration

The frontend automatically detects the environment and uses the appropriate API endpoint:

### js/config.js
```javascript
const config = {
  apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : 'https://web-production-f4beb.up.railway.app/api'
};
```

## Production URL
The frontend is accessible at: `https://geniusforceai.github.io/FamilyDash/`

## Local Development
To test the frontend locally:
1. Run a local HTTP server (e.g., using Python):
   ```bash
   python -m http.server
   ```
2. Access the site at: `http://localhost:8000`

## Important Notes
- GitHub Pages must be enabled in repository settings
- Frontend automatically detects environment for API calls
- All static assets are served from the root directory
- No build step is required as we use vanilla JavaScript
