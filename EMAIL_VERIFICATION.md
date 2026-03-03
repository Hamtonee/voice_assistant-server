# Email verification

Email verification is implemented so new users must verify their email after signup. This improves security and reduces spam/fake accounts.

## Services used

- **Email sending**: **SendGrid** (SMTP) via **Nodemailer** — already used for forgot-password. No new service signup required if you already send mail.
- **Token storage**: PostgreSQL via Prisma (`email_verification_tokens` table).

## Environment variables

Ensure these are set (same as for forgot-password):

| Variable           | Description                          |
|--------------------|--------------------------------------|
| `SENDGRID_HOST`    | e.g. `smtp.sendgrid.net`             |
| `SENDGRID_PORT`    | e.g. `587`                           |
| `SENDGRID_USER`    | SendGrid API username (often `apikey`) |
| `SENDGRID_API_KEY` | SendGrid API key                     |
| `FROM_EMAIL`       | Sender address (must be verified in SendGrid) |
| `FRONTEND_URL`     | Base URL of your app (e.g. `https://app.example.com`) for verification links |

## API endpoints

| Method | Endpoint                | Description |
|--------|-------------------------|-------------|
| POST   | `/api/auth/verify-email` | Verify email with `{ "token": "..." }` (or use GET with `?token=...` for link clicks). |
| GET    | `/api/auth/verify-email?token=...` | Same as above, for links in emails. |
| POST   | `/api/auth/resend-verification` | Resend verification email. Body: `{ "email": "user@example.com" }`. Can also be called when logged in (email from session). |

## Flow

1. **Register** – User signs up → account created with `is_verified: false` → verification email sent with link.
2. **Verify** – User clicks link (or frontend calls API with token) → `is_verified` set to `true` → token deleted.
3. **Resend** – User can request a new verification email (e.g. “Resend link” on a “Verify your email” screen).

Login is **allowed** before verification. The response includes `user.is_verified` so the frontend can:

- Show a banner like “Please verify your email” and a “Resend link” button.
- Optionally restrict certain actions until verified.

## Optional: require verification before login

To block login until the email is verified, add this in `authController.js` in the `login` handler, after validating the password and before generating tokens:

```js
if (!user.is_verified) {
  return res.status(403).json({
    error: 'Please verify your email before signing in. Check your inbox or request a new link.',
    code: 'EMAIL_NOT_VERIFIED',
    requiresVerification: true
  });
}
```

Then the client can show a dedicated “Verify your email” page and a “Resend verification email” button that calls `POST /api/auth/resend-verification` with `{ "email": "..." }`.

## Frontend checklist

1. **Verify-email page** – Route (e.g. `/verify-email`) that reads `token` from the query string and calls `POST /api/auth/verify-email` with `{ token }` (or redirects to the same page so a GET with `?token=...` can be used). Show success or error and a link to login.
2. **After register** – Show “Check your email to verify your account” and a link to login or to a “Resend verification” flow.
3. **Resend verification** – Button that calls `POST /api/auth/resend-verification` with the user’s email (from form or from session if logged in). Throttle (e.g. once per 60 seconds) to avoid abuse.
4. **Optional** – If you allow login before verification, show a banner when `user.is_verified === false` with “Verify your email” and “Resend link”.

## Database

Run migrations so the new tables exist:

```bash
cd prisma   # or from project root: npx prisma migrate dev --schema=./prisma/schema.prisma
npx prisma migrate dev --name add_email_verification_and_reset_tokens
```

This creates `email_verification_tokens` and `reset_tokens` (used by forgot-password).

## Rate limiting (recommended)

To avoid abuse of `POST /api/auth/resend-verification`, add rate limiting per email or per IP (e.g. max 3–5 requests per 15 minutes per email). You can use your existing `express-rate-limit` setup or a dedicated middleware for this route.
