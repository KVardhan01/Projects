# Deployment Guide

Qubify is a static single-page application (SPA).

## Hosting Platforms
1. **Google Cloud Run / Firebase Hosting**:
   Run `npm run build` to generate `dist/`. Serve static assets with standard rewrite rules:
   ```json
   {
     "rewrites": [{ "source": "**", "destination": "/index.html" }]
   }
   ```
2. **Vercel / Netlify / Cloudflare Pages**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework Preset: Vite
