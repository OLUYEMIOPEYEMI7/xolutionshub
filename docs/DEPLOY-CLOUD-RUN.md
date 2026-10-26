# Deploying XOLUTIONS HUB to Google Cloud Run

Cloud Run runs the app from the `Dockerfile` in this repo and rebuilds automatically
on every push to `main`. It scales to zero when idle and wakes in about 1–3 seconds
(Render's free plan takes 30–60 seconds). A site this size normally stays inside the
monthly free allowance, but Google requires a billing account, so set the budget
alert in step 7.

The database stays on Supabase and email stays on the Apps Script relay. Nothing
about them changes.

## 1. Google Cloud account and project
1. Go to https://console.cloud.google.com and sign in (xolutionshub@gmail.com is fine).
2. Accept the terms and create a billing account (card required for identity).
3. Create a project named `xolutionshub` (top bar → project picker → **New project**).

## 2. Create the service
1. Open https://console.cloud.google.com/run and click **Create service**
   (it may say **Deploy container**). Enable the APIs it asks for.
2. Choose **Continuously deploy from a repository** → **Set up with Cloud Build**.
3. Connect GitHub, authorise Google Cloud Build, and pick
   `OLUYEMIOPEYEMI7/xolutionshub`.
4. Branch: `^main$`. Build type: **Dockerfile**, path `/Dockerfile`. Save.

## 3. Service settings
| Setting | Value |
|---|---|
| Service name | `xolutionshub` |
| Region | `europe-west3 (Frankfurt)`, next to the Supabase database |
| Authentication | **Allow unauthenticated invocations** (it's a public website) |
| Billing | **Request-based** (CPU only during requests), the free-tier friendly option |
| Minimum instances | `0` |
| Maximum instances | `1` (keeps the login/order rate limits consistent and costs bounded) |
| Container port | `8080` |
| Memory / CPU | `512 MiB` / `1` |
| Request timeout | `60` seconds |

## 4. Environment variables
Under **Containers → Variables & secrets**, add the same values the Render service has:

| Name | Value |
|---|---|
| `DATABASE_URL` | copy from Render (the Supabase pooler URL) |
| `SESSION_SECRET` | copy from Render, **the same value**, or everyone is logged out |
| `MAIL_RELAY_URL` | copy from Render |
| `MAIL_RELAY_SECRET` | copy from Render |
| `BANK_NAME` | `Sterling Bank` |
| `BANK_ACCOUNT_NAME` | `OPEYEMI OLUYEMI` |
| `BANK_ACCOUNT_NUMBER` | `0116927597` |
| `ADMIN_EMAILS` | `xolutionshub@gmail.com,oluyemiopeyemi726@gmail.com` |

Do **not** add `PORT` (Cloud Run sets it). `GMAIL_APP_PASSWORD` is optional (only used if
the relay variables are removed).

Click **Create**. The first build takes a few minutes.

## 5. Point the app at its new address
1. When it's running, copy the service URL shown at the top, e.g.
   `https://xolutionshub-xxxxxxxxxx.europe-west3.run.app`.
2. **Edit & deploy new revision** → Variables → add `APP_BASE_URL` = that URL → **Deploy**.
   This makes links in emails (track order, activation, password reset) point to Cloud Run.

## 6. Test, then retire Render
1. Open the new URL, place a small test order, and check both emails arrive.
2. Log in at `/login` and cancel the test order.
3. When happy, share the new address and delete (or suspend) the `xolutionshub`
   service on Render, so you aren't running two copies.

## 7. Avoid surprise charges
- **Budget alert:** Billing → Budgets & alerts → create a budget of $1 with email alerts.
- **Old images:** Artifact Registry keeps every build (about 0.1 GB each, 0.5 GB free).
  Artifact Registry → your repository → **Cleanup policies** → keep the most recent 3 versions.

## How the code handles Cloud Run
- Emails are awaited before the page responds, because Cloud Run throttles the CPU
  once a response is sent.
- Admin bootstrap and the session table run before the server starts listening.
- `K_SERVICE` (set by Cloud Run) marks it as production, so login cookies are `Secure`.
- The Dockerfile fails the build if `npm ci` leaves packages missing.
