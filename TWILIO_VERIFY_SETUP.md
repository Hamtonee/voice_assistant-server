# Twilio Verify setup (SMS & email OTP)

Sign-up and subscription phone verification use **Twilio Verify API v2**.

---

## Where env files go

| App        | Env file location   | Used for |
|-----------|----------------------|----------|
| **Server** (Node) | **`server/.env`** | Twilio, SendGrid, JWT, `DATABASE_URL`, etc. The server loads this via `dotenv.config()` in `server/index.js`. |
| **Client** (React) | **`client/.env`** or `client/.env.local` | Only `REACT_APP_*` (e.g. `REACT_APP_API_BASE_URL`). **Do not put Twilio keys in the client** — they are used only on the server. |

**Twilio credentials** → put them only in **`server/.env`**.

---

## Twilio env vars (in `server/.env`)

**Option A – API Key (recommended; what you have from “Create API Key”)**

```env
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **API Key SID** (starts with `SK`) and **Secret**: from [Twilio Console](https://console.twilio.com) → Keys & Credentials → API keys & tokens → Create API Key. The secret is shown only once—store it safely.
- **Verify Service SID** (starts with `VA`): from [Verify → Services](https://console.twilio.com/us1/develop/verify/services) → Create service (e.g. "SemaNami Verify") → copy the Service SID. This is required for sending/checking OTPs.

**Option B – Account SID + Auth Token**

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **Account SID** and **Auth Token**: same API keys & tokens page (main account credentials).
- The code uses API Key if `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET` are set; otherwise it uses Account SID + Auth Token.

---

## Where the two Twilio usages are

There is **one** shared service; it’s used in **two** places:

| # | Use case | File | What it does |
|---|----------|------|----------------|
| 1 | **Sign-up & auth phone verification** | `server/controllers/authController.js` | Sends OTP on register (if phone given), `POST /auth/send-phone-verification`, and `POST /auth/verify-phone`. |
| 2 | **Subscription payment phone** | `server/controllers/subscriptionController.js` | Sends/checks OTP for the “verify payment phone” modal: `POST /subscriptions/payment-phone/verify/start` and `.../verify/confirm`. |

Both use the same module: **`server/services/twilioVerifyService.js`** (which reads `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` from `process.env`).

---

## Database

After adding `phone_number` and `phone_verified` to `AuthUser` in Prisma, run:

```bash
cd server
npx prisma migrate dev --name add_phone_to_auth_user
# or
npx prisma db push
```

Then `npx prisma generate` if you use Prisma Client from the server.

## Behaviour

- **Sign-up**: Optional phone on register → Twilio sends SMS OTP; user can verify on `/verify-phone`.
- **Auth**: `POST /auth/send-phone-verification` (body: `{ "phone": "0712345678" }`), `POST /auth/verify-phone` (body: `{ "phone", "code" }`).
- **Subscription**: Payment-phone verification (modal) uses the same Twilio Verify service for sending and checking the code.
