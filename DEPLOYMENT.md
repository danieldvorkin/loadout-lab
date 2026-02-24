# Deployment Guide

## Overview

This application consists of two parts:
- **Rails API** → Deployed to Heroku
- **React Frontend** → Deployed to Netlify

---

## Part 1: Deploy Rails API to Heroku

### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Heroku account

### Steps

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   heroku create your-prs-builder-api
   ```

3. **Add PostgreSQL addon**
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

4. **Set environment variables**
   ```bash
   # Generate secrets
   heroku config:set SECRET_KEY_BASE=$(rails secret)
   heroku config:set DEVISE_JWT_SECRET_KEY=$(rails secret)
   
   # Set your Netlify frontend URL (update after deploying frontend)
   heroku config:set FRONTEND_URL=https://your-app.netlify.app
   
   # Rails settings
   heroku config:set RAILS_ENV=production
   heroku config:set RAILS_LOG_TO_STDOUT=enabled
   heroku config:set RAILS_SERVE_STATIC_FILES=enabled
   ```

5. **Deploy the app**
   ```bash
   git push heroku main
   ```

6. **Run database migrations and seeds**
   ```bash
   heroku run rails db:migrate
   heroku run rails db:seed
   ```

7. **Verify deployment**
   ```bash
   heroku open
   # Visit /up to check health status
   ```

### Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `SECRET_KEY_BASE` | Rails secret key (auto-generated) |
| `DEVISE_JWT_SECRET_KEY` | JWT signing key |
| `FRONTEND_URL` | Netlify frontend URL for CORS |
| `DATABASE_URL` | PostgreSQL URL (auto-set by Heroku) |

---

## Part 2: Deploy React Frontend to Netlify

### Prerequisites
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed (optional)
- Netlify account

### Option A: Deploy via Netlify UI (Recommended)

1. **Push your code to GitHub/GitLab**

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your repository

3. **Configure build settings**
   - Base directory: `app/frontend`
   - Build command: `npm run build`
   - Publish directory: `app/frontend/build/client`

4. **Set environment variables**
   - Go to Site Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-heroku-app.herokuapp.com`

5. **Deploy**
   - Click "Deploy site"

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and initialize**
   ```bash
   cd app/frontend
   netlify login
   netlify init
   ```

3. **Set environment variables**
   ```bash
   netlify env:set VITE_API_URL https://your-heroku-app.herokuapp.com
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your Heroku API URL (e.g., `https://your-app.herokuapp.com`) |
| `NODE_VERSION` | Node.js version (set to `20` in netlify.toml) |

---

## Post-Deployment Checklist

### 1. Update CORS on Heroku
After deploying to Netlify, update the Heroku FRONTEND_URL:
```bash
heroku config:set FRONTEND_URL=https://your-actual-netlify-url.netlify.app
```

### 2. Test the integration
- Visit your Netlify URL
- Try logging in with:
  - Admin: `admin@example.com` / `password123`
  - Demo: `demo@prsbuilder.com` / `password123`

### 3. Monitor logs
```bash
# Heroku logs
heroku logs --tail

# Netlify logs (via dashboard)
```

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` on Heroku matches your Netlify URL exactly
- Check that the URL includes `https://`

### API Connection Errors
- Verify `VITE_API_URL` is set correctly on Netlify
- Ensure the Heroku app is running: `heroku ps`

### Database Issues
- Run migrations: `heroku run rails db:migrate`
- Check database: `heroku pg:info`

### Build Failures on Netlify
- Check Node version in `netlify.toml`
- Review build logs in Netlify dashboard

---

## Continuous Deployment

Both platforms support automatic deploys:

### Heroku
```bash
# Enable GitHub integration in Heroku Dashboard
# Or use Heroku CI
```

### Netlify
- Automatically deploys on push to main branch
- Preview deploys for pull requests
