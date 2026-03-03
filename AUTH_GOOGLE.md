# Google (Gmail) sign-in

Sign-in and sign-up with Google is supported so you can avoid setting up email verification (SES, SendGrid, etc.). Users who sign in with Google are treated as verified (`is_verified: true`).

## Setup

### 1. Where to go in Google: get Client ID and Secret

Use **Google Cloud Console** → **APIs & Services** → **Credentials**.

1. **Open:** [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. **Sign in** with the Google account that will own the project.
3. **Select or create a project** (top bar: click the project name → create or choose a project).
4. **Create OAuth client ID**
   - On the Credentials page, click **“+ Create credentials”**.
   - Choose **“OAuth client ID”**.
5. **OAuth consent screen (if prompted)**
   - If this is your first OAuth client, you’ll be asked to configure the **OAuth consent screen** first (User type: External, App name, support email, etc.). Save, then return to **Credentials** and create the OAuth client again.
6. **Create the OAuth client**
   - **Application type:** **Web application**.
   - **Name:** e.g. “SemaNami” or “SemaNami Web”.
   - **Authorized redirect URIs** → click **“Add URI”** and add:
     - Production: `https://api.semanami-ai.com/api/auth/google/callback`
     - Local: `http://localhost:5000/api/auth/google/callback`
   - Click **Create**.
7. **Copy the credentials**
   - In the popup you’ll see **Client ID** and **Client secret**.
   - Put them in `server/.env` (see below).

### 2. Environment variables (in `server/.env`)

   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   FRONTEND_URL=https://semanami-ai.com
   ```

   `FRONTEND_URL` is used to send the user back to your app after sign-in. If unset, the first URL from `FRONTEND_URLS` is used.

3. **Database**

   The `auth_users` table must have `google_id` and optional `hashed_password`. From the **server** directory (so `DATABASE_URL` in `.env` is loaded):

   ```bash
   cd server
   npm run db:migrate    # applies pending migrations
   npm run db:generate   # regenerates Prisma client
   ```

   Or from project root if `DATABASE_URL` is set in the environment or in a root `.env`:

   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma
   npx prisma generate --schema=prisma/schema.prisma
   ```

## Behaviour

- **Login** and **Sign up** pages already have a “Continue with Google” / “Sign up with Google” button; they redirect to `/api/auth/google`, then to Google, then back to `/auth/google/callback` on your API, which issues a JWT and redirects to the frontend `/auth/callback?token=...`. The frontend stores the token and sends the user to `/chats`.
- New users signing in with Google get an account with `is_verified: true` (no email verification step).
- Existing email/password users can link Google: the first time they use “Continue with Google” with the same email, the account is linked and `is_verified` is set to true.
- Users who only signed up with Google have no password; if they try email/password login they see: “This account uses Google sign-in. Please use Continue with Google.”

## Gmail-only option

If you want **only** Gmail (no email/password sign-up or login):

1. In the frontend, you can hide or remove the email/password form and “Sign up” link on the login page, and show only the “Continue with Google” button.
2. You can keep the backend email/password routes disabled or remove them later; the app will work with only the Google OAuth routes and the existing trial/subscription logic.

No changes are required on the backend for “Gmail only”; it’s mainly a UI choice (what you show on login/signup).
