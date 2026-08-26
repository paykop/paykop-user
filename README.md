# Paykop User Web

Next.js 16 storefront for the Paykop hyperlocal marketplace. It talks to the same Go API as the Expo app.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Point `NEXT_PUBLIC_API_BASE_URL` at the backend (`http://localhost:8080` or `:8083` if that is how you run `paykop-backend`).
3. Set `NEXT_PUBLIC_WS_URL` to the chat gateway (`ws://localhost:8080/api/v1/communication/ws/v2`).
4. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` to a real Razorpay key. Checkout is disabled without it.
5. Optional: `NEXT_PUBLIC_SUPPORT_PHONE` for the promo bar.
6. Optional: `NEXT_PUBLIC_IMAGE_HOSTS` — comma-separated HTTPS hostnames for product/media images (`next/image`). Defaults include `paykop-devapi.podhupu.com`, `images.unsplash.com`, `www.gravatar.com`, and Cloudflare R2 (`**.r2.dev`). Do not use a full `**` wildcard for all hosts.

```bash
npm install
npm run dev
```

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
- **Agent trial listings** do **not** require KYC. Agents can create products/services for a seller without verification. KYC applies when that seller later publishes via self-serve APIs.
- **Donations and blood requests** are public-service / community flows — **not** KYC-gated.
- KYC document upload is via the seller app / API (`POST /storage/presigned-url` `purpose=kyc` + `/sellers/me/kyc`), not this storefront yet.
