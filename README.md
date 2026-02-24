# README
[![Netlify Status](https://api.netlify.com/api/v1/badges/12cc177d-6235-49af-9c7b-649aa516be5a/deploy-status)](https://app.netlify.com/projects/loadout-ai/deploys)
This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

## Google OAuth Setup

This application supports Google OAuth for authentication. Follow these steps to set it up:

### 1. Create a Google OAuth App

1. Go to the [Google Cloud Console](https://console.developers.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth 2.0 Client IDs**.
5. Set the application type to **Web application**.
6. Add your authorized JavaScript origins (e.g., `http://localhost:5173` for development).
7. Add your authorized redirect URIs if needed.
8. Copy the **Client ID**.

### 2. Configure the Backend

No additional backend environment variables are required. The backend verifies tokens directly via Google's userinfo API using the access token.

### 3. Configure the Frontend

Copy `app/frontend/.env.example` to `app/frontend/.env` and set:

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 4. How It Works

- The frontend uses `@react-oauth/google` to initiate Google's OAuth flow and obtain an access token.
- The access token is sent to the backend via the `googleOauthLogin` GraphQL mutation.
- The backend verifies the access token against Google's userinfo endpoint (`https://www.googleapis.com/oauth2/v3/userinfo`).
- If valid, a user account is created or retrieved, and a JWT is returned for subsequent API calls.
- Existing email/password users who sign in with Google will have their accounts linked.

### Security Notes

- Tokens are verified server-side via Google's userinfo API — the access token is sent in the Authorization header (not in the URL) for security.
- Users created via OAuth do not set a user-known password; a random password is generated internally.
- Always keep `VITE_GOOGLE_CLIENT_ID` secret-free in public repositories — it is a public client ID, not a secret.
