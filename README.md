# Paykop User Web

Next.js 16 storefront for the Paykop hyperlocal marketplace. It talks to the same Go API as the Expo app.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Point `NEXT_PUBLIC_API_BASE_URL` at the backend (`http://localhost:8080` or `:8083` if that is how you run `paykop-backend`).
3. Set `NEXT_PUBLIC_WS_URL` to the chat gateway (`ws://localhost:8080/api/v1/communication/ws/v2` locally; **`wss://...` in production**).
4. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` to a real Razorpay key. Checkout is disabled without it.
5. Optional: `NEXT_PUBLIC_SUPPORT_PHONE` for the promo bar.
6. Optional: `NEXT_PUBLIC_IMAGE_HOSTS` — comma-separated HTTPS hostnames for product/media images (`next/image`). Defaults include `paykop-devapi.podhupu.com`, `images.unsplash.com`, `www.gravatar.com`, and Cloudflare R2 (`**.r2.dev`). Do not use a full `**` wildcard for all hosts.
7. Optional: `NEXT_PUBLIC_SENTRY_DSN` for error monitoring.

```bash
npm install
npm run dev
```

## Scripts

| Script              | Description                            |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start development server               |
| `npm run build`     | Production build (runs env validation) |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | TypeScript check                       |
| `npm test`          | Vitest unit tests                      |
| `npm run test:e2e`  | Playwright smoke tests                 |

## Deployment

### Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.example.com/api/v1/communication/ws/v2 \
  --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx \
  -t paykop-user .
docker run -p 3000:3000 paykop-user
```

### Vercel

Set all `NEXT_PUBLIC_*` environment variables in the Vercel project settings. Production builds require `NEXT_PUBLIC_WS_URL` to use `wss://`.

On the backend, include `http://localhost:3000` in `ALLOWED_ORIGINS`. Local OTP uses `OTP_TEST_MODE=true`; the API may return `debug_otp` in development only.

## Product notes

- Money is stored in **paise** and shown as INR.
- Home, catalog, services, donations, and blood are driven by `/api/v1`. Empty lists render empty states — no dummy catalog.
- Buyer orders are one product per order. Cart checkout is per line item.
- **Online product checkout** creates a buyer order first, then opens Razorpay with that `order_id`. Payment intents never send a client-chosen amount; the Go API must derive amount from the linked order / booking / campaign / subscription and reject intents without a valid entity.
- User onboarding uses snake_case fields (`first_name`, `last_name`, `profile_picture_url`).
- Staging API used by admin: `https://paykop-devapi.podhupu.com`.

## Seller KYC policy

- **Self-serve sellers** must have `kyc_status=verified` (plus onboarded + subscription on the API) before listing products/services. The storefront disables “Add product” until verified; the Go API enforces this via `RequireSellerReady`.
- **Seller KYC UI** is at **`/seller/kyc`** (auth + seller gate). Flow: fetch requirements → upload documents via `POST /storage/presigned-url` (`purpose=kyc`) → save draft (`PUT /sellers/me/kyc`) → submit (`POST /sellers/me/kyc/submit`). `/kyc` redirects to `/seller/kyc`.
- **Agent onboarding** (same readiness gates as self-serve): profile → subscribe (Commission activates instantly; paid plans open Razorpay UPI / QR for the seller on the agent device) → KYC at `/agent/sellers/:id/kyc` (requirements via `GET /agent/sellers/:id/kyc/requirements` with `kind` + `category_id`; **auto-verified** on agent submit) → business location. When `next_onboarding_step=ready`, onboarding is complete; products/services are optional and added one at a time. Agent product/service APIs also require seller-ready (KYC + commercial access).
- **Donations and blood requests** are public-service / community flows — **not** KYC-gated.
- Product and KYC images use the shared presigned upload helper (`src/lib/upload/presignedUpload.ts`).

## Search

- Global federated search: `GET /search?q=` (partial ILIKE match across products, services, donations, blood, users).
- Product-only search: `GET /search/products` with filters.
- Header autocomplete debounces and calls `GET /search?q=&limit=8`. Full results at `/search?q=`.
