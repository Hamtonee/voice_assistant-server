## Africa's Talking SMS Setup

This project uses Africa's Talking to send phone verification codes.

### Required environment variables
- `AFRICASTALKING_USERNAME` (your Africa's Talking username)
- `AFRICASTALKING_API_KEY` (API key from Africa's Talking dashboard)

Optional:
- `AFRICASTALKING_SENDER_ID` (alphanumeric sender ID if enabled for your account)
- `SHOW_OTP` (`true` to include the OTP in the API response for local testing only)

### How it works
- The API creates a 6-digit OTP, stores a hashed copy, and sends it via SMS.
- OTPs expire after 10 minutes and are limited to 5 attempts.
- Users can request a new code after 60 seconds.

### Test flow
1. Configure the environment variables.
2. Start the server.
3. In the UI, enter your phone number and click **Send Code**.
4. Enter the received code and click **Verify & Save**.

### Notes
- Phone numbers are normalized to Kenya E.164 format (e.g. `0712345678` → `+254712345678`).
- If SMS fails, the API returns an error; verification cannot proceed.
