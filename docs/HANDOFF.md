# Paykop Platform — End-to-End System Handoff Document

> **Strict System Architecture, Implementation State, and Operational Runbook**  
> **Target Repositories:** `paykop-backend` (`otp_auth`), `paykop-admin` (`div_dev`), `paykop-user` (`div_dev`)  
> **Scope:** Complete end-to-end technical handoff with zero omissions or placeholder abstractions.

---

## Table of Contents
1. [Executive Platform Architecture](#1-executive-platform-architecture)
2. [Technology Stack & Runtime Matrix](#2-technology-stack--runtime-matrix)
3. [Authentication, Session & Security Architecture](#3-authentication-session--security-architecture)
4. [Database Architecture & Core Domain Models](#4-database-architecture--core-domain-models)
5. [Hyperlocal Geolocation & Serviceability Engine](#5-hyperlocal-geolocation--serviceability-engine)
6. [Seller Lifecycle & KYC Verification Architecture](#6-seller-lifecycle--kyc-verification-architecture)
7. [Field Agent Subsystem & In-Field Merchant Onboarding](#7-field-agent-subsystem--in-field-merchant-onboarding)
8. [Payments, Razorpay & Financial Ledger Engine](#8-payments-razorpay--financial-ledger-engine)
9. [Interactive Guided Tours Engine (driver.js 1.4.0)](#9-interactive-guided-tours-engine-driverjs-140)
10. [Federated Hyperlocal Search & Catalog Discovery](#10-federated-hyperlocal-search--catalog-discovery)
11. [Real-time Communication, Chat & WebSockets](#11-real-time-communication-chat--websockets)
12. [Admin Dashboard & Operational Tooling](#12-admin-dashboard--operational-tooling)
13. [End-to-End API Endpoint Inventory](#13-end-to-end-api-endpoint-inventory)
14. [Current Working Tree & Uncommitted Work in Progress](#14-current-working-tree--uncommitted-work-in-progress)
15. [Verification, Testing & Deployment Runbook](#15-verification-testing--deployment-runbook)

---

## 1. Executive Platform Architecture

Paykop is a two-sided hyperlocal commerce and community marketplace connecting neighborhood buyers, verified local merchants/service providers, field onboarding agents, and administrative oversight teams.

```
                                  ┌─────────────────────────────┐
                                  │       End-User Mobile       │
                                  │          Expo / React       │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────┐   REST (Bearer)  ┌─────────────────────────────┐
│       Paykop User Web       │ ────────────────►│      Paykop Backend         │
│     (Next.js 16 Storefront  │   WS / Chat      │     (Go 1.25.3 / Gin)       │
│     + Field Agent Portal)   │ ◄───────────────►│  Port 8080 (devapi staging) │
└─────────────────────────────┘                  └──────────────┬──────────────┘
                                                                ▲
┌─────────────────────────────┐     BFF Proxy                   │
│      Paykop Admin Web       │   HttpOnly Cookie               │
│     (Next.js 16 Dashboard)  │ ────────────────► /api/proxy/* ─┘
└─────────────────────────────┘
                                                 │
            ┌───────────────────┬────────────────┼───────────────────┐
            ▼                   ▼                ▼                   ▼
    ┌───────────────┐   ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐
    │Neon PostgreSQL│   │ Redis Broker  │ │ Cloudflare R2 │ │ Razorpay Engine │
    │ 97 Migrations │   │ Rate Limit /  │ │ Presigned S3  │ │ Paise / Single  │
    │  & PostGIS    │   │ PubSub Stream │ │ Object Store  │ │ Orders & Subs   │
    └───────────────┘   └───────────────┘ └───────────────┘ └─────────────────┘
```

### Core Platform Roles
- **Buyer:** End-consumer browsing local inventory, placing delivery/pickup orders, booking local professional services, initiating chat with merchants, raising emergency blood requests, or donating to community campaigns.
- **Seller / Service Provider:** Merchant listing catalog items or professional services. Gated strictly by `RequireSellerReady` (requires phone verification, KYC submission & approval, and active commercial subscription).
- **Field Agent:** On-the-ground representative using `/agent` to onboard local shopkeepers, select commercial subscription tiers, facilitate merchant payments via Razorpay QR/UPI, submit instant auto-verified KYC documents, pin store GPS coordinates, and add initial product listings.
- **Support Staff:** Administrative operators managing tickets (`/tickets`), viewing user records (`/users`), and reviewing basic KYC (`/kyc`). Gated by RBAC.
- **Super Admin:** Unrestricted access across all domains including dashboard analytics, user status mutations, agent commissions, category hierarchies, banner promotions, subscription plan configurations, and developer debug consoles.

---

## 2. Technology Stack & Runtime Matrix

| Subsystem | Core Runtime / Framework | Key Dependencies | Port / URL | State Management |
|---|---|---|---|---|
| **`paykop-backend`** | Go 1.25.3, Gin v1.12.0 | GORM v1.31.1, pgx, golang-migrate v4.19.1, Redis, Cloudflare R2 SDK, Razorpay SDK | `:8080` (Local) / `paykop-devapi.podhupu.com` | PostgreSQL + Redis cache / Outbox workers |
| **`paykop-admin`** | Next.js 16.2.9, React 19, Tailwind CSS | Axios, Zustand 5.0, Zod, driver.js 1.4.0, Lucide React, Playwright 1.55 | `:3000` (Local) | Zustand persist + HttpOnly Cookie BFF |
| **`paykop-user`** | Next.js 16.3.1, React 19.2.8, Tailwind CSS v4 | TanStack React Query v5.101, Zustand 5.0, driver.js 1.4.0, Sentry v9.47, Vitest 3.2 | `:3001` (Local) | React Query + Zustand + LocalStorage |

### Environment Variables Matrix

#### `paykop-backend` (`.env`)
```bash
PORT=8080
DATABASE_URL=postgresql://user:pass@ep-neon.us-east-2.aws.neon.tech/paykop?sslmode=require
REDIS_URL=redis://default:token@upstash.io:6379
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_ACCESS_KEY_SECRET=...
CLOUDFLARE_R2_BUCKET_NAME=paykop-media
CLOUDFLARE_R2_PUBLIC_URL=https://media.paykop.com
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
GOOGLE_MAPS_API_KEY=AIzaSy... # Optional: triggers sandbox fallback if omitted
JWT_SECRET=...
FIREBASE_CREDENTIALS_JSON=...
```

#### `paykop-admin` (`.env.local`)
```bash
API_URL=http://localhost:8080 # Server-only Go backend URL
NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS=paykop-devapi.podhupu.com,images.unsplash.com,r2.dev
NEXT_PUBLIC_DISABLE_TOURS=false # Set to true during Playwright CI
```

#### `paykop-user` (`.env.local`)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/v1/communication/ws/v2 # wss:// in production
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
NEXT_PUBLIC_IMAGE_HOSTS=paykop-devapi.podhupu.com,images.unsplash.com,www.gravatar.com,r2.dev
NEXT_PUBLIC_SUPPORT_PHONE=919999999999
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 3. Authentication, Session & Security Architecture

### A. Admin Dashboard Auth Flow (BFF Pattern)
Admin browser clients never communicate directly with the Go API and never store tokens in `localStorage`.
1. **Request Code:** Admin navigates to `/sign-in`, inputs registered email. Calls `POST /api/v1/admin/auth/otp/request`.
   - *Dev / Debug Feature:* In development/staging environments, the API response schema echos the OTP (`otp` or `debug_otp`). The SignIn UI renders an automatic dev banner with a 1-click **Auto-fill** button.
2. **Verify Code:** User enters 6-digit OTP. Calls `POST /api/v1/admin/auth/otp/verify`.
3. **Session Establishment:** The Next.js BFF endpoint receives `{ access_token, refresh_token }` from Go and issues `Set-Cookie`:
   - `access_token`: `HttpOnly; Secure; SameSite=Lax; Path=/` (expires in 15m).
   - `refresh_token`: `HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh` (expires in 7d).
4. **Proxy Route (`/api/proxy/[...path]`):** All client store requests dispatch to `/api/proxy/*`. The server-side proxy reads the HttpOnly cookie, injects `Authorization: Bearer <access_token>`, and handles silent upstream refresh if Go signals `TOKEN_EXPIRED`.
5. **Route Gate (`proxy.ts`):** The Next.js proxy middleware intercepts all non-static paths, verifies token existence and expiration, and enforces redirects to `/sign-in`.

### B. User Storefront & Agent Auth Flow
1. **Phone / Firebase OTP:** User authenticates via phone OTP. Receives Firebase JWT or Go-issued session token.
2. **Cookie Anchor:** Writes `paykop_session=1` to allow route evaluation in `src/proxy.ts`.
3. **Role Gating:**
   - Buyer routes: open or basic auth.
   - Seller routes (`/seller/*`): requires `role === "seller"` and `kyc_status === "verified"`.
   - Agent routes (`/agent/*`): requires `role === "agent"` or `role === "admin"`.
4. **Onboarding Guard:** Incomplete profiles (`first_name`, `last_name`, `profile_picture_url`) are automatically gated and directed to `/onboarding`.

### C. RBAC Access Matrix
| Path / Action | Super Admin | Support Staff | Field Agent | Seller | Buyer |
|---|:---:|:---:|:---:|:---:|:---:|
| **Dashboard Analytics (`/`)** | Full | Denied | Denied | Denied | Denied |
| **User Directory (`/users`)** | Read + Write + Roles | Read Only | Denied | Denied | Denied |
| **Support Tickets (`/tickets`)**| Full Read + Reply | Full Read + Reply | Denied | Denied | Denied |
| **KYC Moderation (`/kyc`)** | Approve / Reject | Review Only | Denied | Denied | Denied |
| **Catalog & Moderation (`/products`)** | Approve / Remove | Denied | Denied | Denied | Denied |
| **Banners & Categories** | Full CRUD | Denied | Denied | Denied | Denied |
| **Commercial Commissions** | Full Access | Denied | Denied | Denied | Denied |
| **Field Agent Portal (`/agent`)** | Full | Denied | Dedicated Hub | Denied | Denied |
| **Seller Hub (`/seller`)** | Full | Denied | Denied | Dedicated Hub | Denied |
| **Storefront Shopping (`/`)** | Read | Read | Read | Read | Full |

---

## 4. Database Architecture & Core Domain Models

Database migrations run via `golang-migrate` up to migration **`000097`**. GORM connects via pgx with `PreferSimpleProtocol: true` to prevent prepared statement collisions when running behind PgBouncer.

### Critical Database Entities
- **`users`:** Primary identity record storing `phone`, `email`, `role` (`buyer`, `seller`, `agent`, `support`, `admin`), `auth_provider`, `current_city_id`, `is_suspended`, `is_verified`.
- **`sellers`:** 1-to-1 extension of `users` with `business_name`, `kyc_status` (`not_started`, `submitted`, `verified`, `rejected`), `subscription_id`, `onboarding_step` (`profile`, `subscription`, `kyc`, `location`, `ready`), `latitude`, `longitude`, `service_radius_km`.
- **`products`:** Catalog items linked to `seller_id`, `category_id`, `city_id`. Includes `price` (paise), `stock`, `status` (`pending`, `approved`, `rejected`, `removed`), and `images` (array of R2 URLs).
- **`services` & `service_categories`:** Local services catalog with hourly/fixed rates, provider availability calendar, and buffer conflict prevention.
- **`kyc_submissions`:** Document verification tracking `seller_id`, `agent_id` (nullable if self-serve), `documents` (JSON array of document types and URLs), `status`, `submitted_at`, `reviewed_at`, `rejection_reason`.
- **`subscription_plans` & `subscriptions`:** Commercial monetization tiers (e.g. Free/Commission, Starter, Pro, Enterprise).
- **`orders` & `order_items`:** Multi-item purchases with snapshot pricing, seller fulfillment status, delivery address references, and COD delivery OTP verification.
- **`bookings`:** Appointment scheduling with slot reservation (`±59m` collision protection) and completion verification.
- **`donations` & `blood_requests`:** Public community listings; blood claims enforce donor city matching (`ErrWrongCity`).
- **`tickets` & `ticket_messages`:** Customer support threads with statuses `open`, `in_progress`, `waiting_user`, `resolved`, `closed`.
- **`audit_logs`:** Immutable record of admin mutations (`actor_id`, `action`, `resource`, `payload`).

---

## 5. Hyperlocal Geolocation & Serviceability Engine

Paykop operates as a strict city-first hyperlocal marketplace. Entities are pinned to canonical city IDs.

```
                    User GPS / Location Selector
                                 │
                                 ▼
                     PATCH /users/me/current-location
                                 │
            ┌────────────────────┴────────────────────┐
     Within 2 Minutes?                         After 2 Minutes?
            │                                         │
            ▼                                         ▼
   Return Cached Profile                     Resolve Canonical City
  (Skip Geocoding & DB write)             (Google Maps / Rajahmundry mock)
                                                      │
                                                      ▼
                                            Update DB & Pinned City
```

1. **City Catalog (`cities` table):** Pinned launch city is `Rajamahendravaram` (slug: `rajamahendravaram`, aliases: `rajahmundry`, `rjy`).
2. **GPS Write Debounce Guard:** `internal/users/service.go` enforces a 2-minute memory guard. Frequent location pings from moving mobile devices within 2 minutes return cached profile coordinates to protect Neon Postgres from connection exhaustion and write churn.
3. **Saved Addresses:** Endpoints `GET/POST /api/v1/addresses` return IDs prefixed with `addr_`. Toggle default via `PATCH /api/v1/addresses/:id/set-default`.
4. **Serviceability Enforcement:**
   - Product orders evaluate the buyer's delivery coordinate against merchant `service_radius_km`.
   - Blood donation claims via `POST /api/v1/donations/blood/:id/claim` strictly verify that the donor's `current_city_id` matches the request's pinned `city_id`.

---

## 6. Seller Lifecycle & KYC Verification Architecture

Merchants cannot sell products or book services without completing the onboarding pipeline enforced by Go middleware `RequireSellerReady`.

```
                    ┌───────────────────────────────┐
                    │      1. User Profile Setup    │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  2. Commercial Subscription   │
                    │   (Commission / Paid Tier)    │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
    [ Self-Serve Flow ]                             [ Field Agent Flow ]
 3. Submit KYC via /seller/kyc                   3. Agent submits at /agent/sellers/:id/kyc
 4. Enters status 'submitted'                    4. AUTO-VERIFIED instantly ('verified')
 5. Admin manual approval in /kyc                5. Pinned store GPS location
            │                                               │
            └───────────────────────┬───────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │    Status = 'ready'           │
                    │ Product/Service Listing Live  │
                    └───────────────────────────────┘
```

### KYC Submission Implementation Details
- **Presigned Upload Helper:** File uploads never route through the web servers. Files obtain presigned PUT URLs via `POST /api/v1/storage/presigned-url` with `purpose=kyc` or `purpose=product` and upload directly to Cloudflare R2.
- **Document Payload:** Requires business proof (GSTIN/Trade License), PAN, and government ID (Aadhaar).
- **Self-Serve vs Agent Distinction:** Self-serve submissions enter `submitted` status and await Admin approval in `/kyc`. Field Agent submissions via `POST /agent/sellers/:id/kyc/submit` are marked `verified` instantly upon submission, recognizing field agent identity verification.

---

## 7. Field Agent Subsystem & In-Field Merchant Onboarding

The Field Agent application (`/agent`) provides specialized field tools for agents operating on mobile tablets and phones.

### Onboarding Steps for Agents
1. **Merchant Registration (`/agent`):** Registers merchant name, phone, and category.
2. **Subscription Selection:**
   - *Commission Plan:* Activates instantly with zero payment.
   - *Paid Tier:* Generates Razorpay payment intent. Opens Razorpay QR / UPI Modal directly on the agent device for the merchant to scan/pay.
3. **KYC Verification (`/agent/sellers/:id/kyc`):** Queries category requirements via `GET /agent/sellers/:id/kyc/requirements?kind=...&category_id=...`. Agent captures photos of documents. Submits via `POST /agent/sellers/:id/kyc/submit`. Marked verified immediately.
4. **Shop GPS Pinning:** Agent captures precise storefront latitude/longitude coordinates and address.
5. **Initial Cataloging (`/agent/sellers/:id/products`):** Once `next_onboarding_step === "ready"`, the agent can immediately add initial inventory items with title, price, stock, category, and photo via the in-modal product creator.

---

## 8. Payments, Razorpay & Financial Ledger Engine

All monetary calculations strictly use integer **paise** (`₹1.00 = 100 paise`). Floating point math is strictly forbidden.

### Critical Razorpay Checkout Logic
Both `paykop-user` (`src/components/checkout/RazorpayCheckout.tsx` and `src/lib/agent/openSellerSubscriptionCheckout.ts`) and `paykop-backend` maintain strict separation between **Orders** and **Subscriptions**:

```typescript
// Critical Contract: Razorpay Subscriptions derives the amount from the server entity.
// Passing 'amount' alongside 'subscription_id' throws an immediate error in Razorpay Checkout!
if (intent.razorpay_subscription_id) {
  options.subscription_id = intent.razorpay_subscription_id;
  // DO NOT PASS options.amount!
} else if (intent.razorpay_order_id) {
  options.order_id = intent.razorpay_order_id;
  options.amount = intent.amount || amountPaise;
}
```

### Phone Contact Sanitization
Indian phone numbers must be sanitized before passing to the Razorpay SDK to prevent validation rejects:
```typescript
const cleanContact = (rawPhone || "")
  .replace(/^\+91|^91/, "")
  .replace(/\D/g, "")
  .slice(-10);
```

### Cash on Delivery (COD) Engine
- Uses single ledger accounting.
- Generates a 6-digit delivery verification OTP.
- Delivery driver or merchant enters the buyer's OTP upon physical delivery to complete the order and finalize commission reconciliation.

---

## 9. Interactive Guided Tours Engine (`driver.js` 1.4.0)

Both the Admin Dashboard and User Storefront implement non-intrusive, theme-matched interactive walkthroughs powered by `driver.js` 1.4.0.

### Architecture & Anti-Crash Patterns
1. **Module Singleton Protection:** `driver.js` maintains module-level singletons. Hooks always destroy active instances prior to new instantiation.
2. **Infinite Recursion Guard:** In `onDestroyStarted`, the public `instance.destroy()` is called once, followed by status persistence.
3. **E2E Test Silencing:** The tour engine checks `NEXT_PUBLIC_DISABLE_TOURS === "true"`. Playwright sets this environment variable to prevent modal overlays from blocking automated click targets.

### Tour Catalog
| App | Tour ID | Target Selectors | Persistence |
|---|---|---|---|
| **Admin** | `admin-overview` | `[data-tour="header-handshake"]`, `[data-tour="overview-metrics"]`, `[data-tour="sidebar-nav"]`, `[data-tour="header-notifications"]` | Zustand `paykop_admin_tours` |
| **Admin** | `support-tickets` | `[data-tour="tickets-filter-bar"]`, `[data-tour="tickets-list"]`, `[data-tour="tickets-reply-box"]` | Zustand `paykop_admin_tours` |
| **Admin** | `kyc-tab` | `[data-tour="kyc-status-tabs"]`, `[data-tour="kyc-document-viewer"]`, `[data-tour="kyc-actions"]` | Zustand `paykop_admin_tours` |
| **Admin** | `users-tab` | `[data-tour="users-search-input"]`, `[data-tour="users-role-filter"]`, `[data-tour="users-table-actions"]` | Zustand `paykop_admin_tours` |
| **User** | `buyer_home` | `[data-tour="location-selector"]`, `[data-tour="search-input"]`, `[data-tour="categories-shelf"]`, `[data-tour="cart-button"]` | LocalStorage `paykop_completed_tours` |
| **User** | `seller_hub` | `[data-tour="seller-kyc-badge"]`, `[data-tour="seller-quick-actions"]`, `[data-tour="seller-plans"]` | LocalStorage `paykop_completed_tours` |
| **User** | `agent_hub` | `[data-tour="agent-stats"]`, `[data-tour="agent-create-seller"]`, `[data-tour="agent-sellers-list"]` | LocalStorage `paykop_completed_tours` |

---

## 10. Federated Hyperlocal Search & Catalog Discovery

The search subsystem uses database-level partial matching (`ILIKE`) to provide instant discovery across diverse platform entities.

- **Federated Autocomplete (`GET /api/v1/search?q=&limit=8`):** Header search bar debounces input and matches across:
  - Products
  - Services
  - Emergency Blood Requests
  - Charity Donation Campaigns
  - Public Profiles
- **Catalog Filtering (`GET /api/v1/search/products`):** Supports pagination (`page`, `limit`), sorting (`price_asc`, `price_desc`, `newest`), category filtering, and location radius bounding.

---

## 11. Real-time Communication, Chat & WebSockets

- **Gateway URL:** `ws://localhost:8080/api/v1/communication/ws/v2` (Local) / `wss://...` (Production).
- **Authentication Subprotocol:** Secures WebSocket handshake by verifying the session token in connection headers.
- **Redis Pub/Sub Channel Broker:** Horizontally scales chat connections across backend instances.
- **WebRTC Signaling:** Powers direct browser/device peer-to-peer calling negotiation between buyers and sellers/providers.

---

## 12. Admin Dashboard & Operational Tooling

The admin dashboard (`paykop-admin`) provides complete operational management:
- **Overview Tab (`/`):** Real-time KPI cards for gross volume, ticket count, active sellers, and system health metrics.
- **Users Management (`/users`):** Paginated directory, role filtering, manual seller verification, account suspension/reactivation, and dedicated role updates (`PATCH /api/v1/admin/users/:id/role`).
- **KYC Pipeline (`/kyc`):** Status tabs (Pending, Approved, Rejected). Secure modal renders sanitized document URLs with 1-click Approval or Rejection (with mandatory compliance reason notes).
- **Tickets Helpdesk (`/tickets`):** Queue management with status filters (`open`, `in_progress`, `waiting_user`, `resolved`, `closed`), customer history inspector, and threaded reply box.
- **Catalog Moderation (`/products`):** Review pending seller products, approve, reject, or take down non-compliant listings.
- **DevTools Console (`/devtools`):** Admin-only diagnostic tab displaying server health checks (`/health`), live permissions, and direct API debug execution.

---

## 13. End-to-End API Endpoint Inventory

The Paykop Admin platform tracks **73 verified API endpoints** defined in `scripts/sync/endpoint-inventory.ts`:

### Core Domain Summary
| Domain | Path Prefix | Handlers / Methods | Status |
|---|---|---|---|
| **Auth** | `/api/v1/admin/auth/*` | OTP request, verify, refresh, logout, session | `synced` |
| **Users** | `/api/v1/admin/users/*` | List, detail, update name, update role, suspend, verify | `synced` |
| **Dashboard** | `/api/v1/admin/dashboard`, `/metrics` | Analytics KPIs, system throughput metrics | `synced` |
| **Tickets** | `/api/v1/admin/tickets/*` | List, detail, status patch, reply post | `synced` |
| **KYC** | `/api/v1/admin/kyc/*` | Submissions list, detail, approve, reject | `synced` |
| **Products** | `/api/v1/admin/products/*` | Moderation list, status put, delete | `synced` |
| **Categories** | `/api/v1/admin/categories/*` | Tree CRUD, icon upload (pending-verify on live deploy) | `pending-verify` |
| **Banners** | `/api/v1/banners`, `/admin/banners` | Public read with `only_active=false`, Admin CRUD | `synced` |
| **Agents** | `/api/v1/admin/agents/*` | Agent creation, seller assignment, status revocation | `synced` |
| **Payments** | `/api/v1/admin/payments/*` | Transaction reports, refund execution | `synced` |
| **Commerce** | `/api/v1/admin/commerce/*` | Commission batches, payout mark-paid | `synced` |
| **Subscriptions**| `/api/v1/admin/subscriptions/*` | Plan CRUD, seller subscription histories, reconciliation | `synced` |
| **Campaigns** | `/api/v1/admin/donations/*` | Charity campaign moderation and status updates | `synced` |
| **Blood Requests**| `/api/v1/donations/blood/*` | Emergency blood requests, donor matches | `synced` |
| **Services** | `/api/v1/admin/services/*` | Professional service moderation and category hierarchy | `synced` |
| **Logs** | `/api/v1/admin/audit-logs` | Immutable audit trail query | `synced` |
| **Storage** | `/api/v1/storage/presigned-url` | Direct Cloudflare R2 presigned upload authorization | `synced` |

---

## 14. Current Working Tree & Uncommitted Work in Progress

### A. `paykop-admin` (Branch `div_dev`)
- **Unstaged Modifications:**
  - `app/sign-in/page.tsx`: Dev OTP auto-detection and 1-click Auto-fill banner.
  - `app/globals.css`: Overrides for `.driver-popover` dark mode styling.
  - `components/DashboardLayout.tsx` & `DashboardSidebar.tsx`: Injected `data-tour` attributes for header and navigation.
  - `components/OverviewTab.tsx` & `TicketsTab.tsx`: Integrated `useTour` hooks with readiness guards.
  - `package.json` & `package-lock.json`: Added `driver.js@1.4.0`.
  - `playwright.config.ts`: Added `NEXT_PUBLIC_DISABLE_TOURS: "true"`.
  - `schemas/authSchema.ts`: Added `otp` and `debug_otp` to `otpRequestResponseSchema`.
- **Untracked Files:**
  - `lib/tour/tours.ts`: Tour step definitions and configuration for 4 admin tours.
  - `lib/tour/useTour.ts`: Custom hook managing driver lifecycle and mount delays.
  - `store/useTourStore.ts`: Zustand persistent store for admin tour completion states.

### B. `paykop-user` (Branch `div_dev`)
- **Unstaged Modifications:**
  - `src/lib/tours/`: Tour registry, types, storage helpers, and `useTour.ts`.
  - `src/app/page.tsx`, `src/app/seller/page.tsx`, `src/app/agent/page.tsx`: Triggering tours with auto-start delays.
  - `src/components/checkout/RazorpayCheckout.tsx` & `src/lib/agent/openSellerSubscriptionCheckout.ts`: Corrected Razorpay subscription options (omitting `amount` when `subscription_id` is supplied) and contact sanitization.
  - `src/app/agent/sellers/[id]/products/page.tsx`: Live catalog view + Add Product modal with presigned R2 upload.
  - `src/lib/api/endpoints.ts`: Normalized donation campaign and blood request array responses; added `profiles.get` and `getSellerProducts`.
  - `src/lib/agent/onboarding.ts`: Synchronized payment intent caching between `localStorage` and `sessionStorage`.

### C. `paykop-backend` (Branch `otp_auth`)
- Working tree clean. Latest commits implemented agent portal endpoints, KYC submission timestamp fields, requirements discovery, and mobile calling integrations.

---

## 15. Verification, Testing & Deployment Runbook

### A. Automated Verification Commands

#### In `paykop-admin`:
```bash
# 1. Type check & Lint
npm run lint

# 2. Automated Sync Verification Suite
npm run sync:all         # Runs deploy checklist, auth smoke, schema fixtures, and crosscheck
npm run sync:auth        # Tests OTP request/verify against running Go API
npm run sync:schemas     # Validates Zod schemas against live and fixture responses
npm run sync:matrix      # Audits all GET endpoints across domains
npm run sync:crosscheck  # Compares endpoint inventory against Go router source

# 3. End-to-End Playwright Tests
npm run test:e2e
```

#### In `paykop-user`:
```bash
# 1. Unit & Tour Storage Tests
npm test                 # Executes Vitest suite (including useTour.test.ts)

# 2. Type Check
npm run typecheck

# 3. Production Build Validation
npm run build            # Validates environment and runs Next.js production build

# 4. End-to-End Smoke Tests
npm run test:e2e
```

### B. Production Deployment Checklist
1. **Backend (`paykop-backend`):**
   - Verify all 97 migrations are applied: `golang-migrate -path migrations -database "$DATABASE_URL" up`.
   - Ensure Redis is reachable and PgBouncer supports simple protocol.
   - Confirm Cloudflare R2 bucket permissions and CORS headers permit PUT uploads from storefront domains.
2. **Admin Web (`paykop-admin`):**
   - Point `API_URL` to internal production Go API address.
   - Set `NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS` to include production R2 and CDN hostnames.
   - Confirm SSL/TLS is terminated properly to allow `Secure` cookie issuance.
3. **User Storefront (`paykop-user`):**
   - Set `NEXT_PUBLIC_API_BASE_URL` to public API gateway.
   - Set `NEXT_PUBLIC_WS_URL` to secure WebSocket endpoint (`wss://...`).
   - Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` to production live key.
   - Verify Sentry DSN for live error telemetry.
