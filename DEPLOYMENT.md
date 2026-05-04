# CI/CD Setup

This repo uses:

- GitHub Actions for CI
- Vercel for Frontend
- Railway for Backend
- Render for MLService

## 1) GitHub Actions CI

Workflow: `.github/workflows/ci.yml`

It currently runs:

- Backend tests with Maven
- Frontend production build with Vite
- ML model training check

## 2) Frontend on Vercel

Connect the `Frontend/` app to Vercel and set:

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `Frontend`

Environment variables:

- `VITE_API_BASE_URL=<your-railway-backend-url>/api`
- `VITE_BACKEND_BASE_URL=<your-railway-backend-url>`

Notes:

- Vercel can deploy automatically from Git when the repo is connected.
- Use `main` as the production branch.

## 3) Backend on Railway

Connect the `Backend/` app to Railway and set:

- Root directory: `Backend`
- Start command: `./mvnw spring-boot:run`
- Production branch: `main`
- Enable `Wait for CI` in Railway so GitHub Actions must pass first

Environment variables:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NVIDIA_API_KEY`
- `NVIDIA_BASE_URL`
- `NVIDIA_TEXT_MODEL`
- `NVIDIA_VISION_MODEL`
- `DEFAULT_AVATAR_BASE_URL`
- `DEFAULT_BACKGROUND_URL`
- `NOTIFICATION_TIME_ZONE`
- `NOTIFICATION_VIP_REMINDER_CRON`
- `NOTIFICATION_VIP_REMINDER_DAYS_BEFORE`
- `NOTIFICATION_STREAK_REMINDER_CRON`
- `NOTIFICATION_STREAK_RESET_CRON`
- `CLOUD_NAME`
- `API_KEY`
- `API_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `PAYMENT_VNPAY_TMN_CODE`
- `PAYMENT_VNPAY_SECRET`
- `PAYMENT_VNPAY_PAY_URL`
- `PAYMENT_BANK_BIN`
- `PAYMENT_BANK_QR_BASE_URL`
- `PAYMENT_BANK_ACCOUNT_NUMBER`
- `PAYMENT_BANK_SECRET`
- `PAYMENT_MOMO_ENABLED`
- `PAYMENT_MOCK_CONFIRM_ENABLED`
- `ML_API_URL=https://ie303.onrender.com/predict`

## 4) MLService on Render

Connect the `MLService/` app to Render and set:

- Root directory: `MLService`
- Build command: `pip install -r requirements.txt`
- Start command: use the same command your existing Render service already uses
- Production branch: `main`

If you prefer webhook deploys on Render, create a deploy hook in the Render dashboard and trigger it after CI passes.

## 5) How the flow works

1. Push code to `main`
2. GitHub Actions runs CI
3. If CI passes:
   - Vercel deploys the frontend
   - Railway deploys the backend
   - Render deploys MLService
4. Backend calls ML using `ML_API_URL`
