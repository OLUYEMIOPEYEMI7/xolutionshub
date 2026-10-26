# Xolutions Hub: frontend

React 18 + TypeScript + Vite. Self-hosted fonts (Fraunces, Manrope), no analytics or third-party scripts.

```bash
npm install
npm run dev        # local dev
npm run build      # typecheck + production build
npm run lint && npm test
```

## Structure
- `src/data/catalog.ts`: services, prices, delivery options, contact details (single source of truth)
- `src/lib/pricing.ts`, `validation.ts`, `orderMessage.ts`: pure, unit-tested logic
- `src/lib/ordersApi.ts`: **backend integration boundary** (currently "not connected")
- `src/components/`, `src/styles/`: UI and design tokens

## What is real vs. pending
- Real: service selection, live pricing, delivery surcharge, form validation, sending the order text via WhatsApp / email / copy.
- NOT connected (the UI says so): order submission and references, order tracking, payment confirmation, document upload, admin tools, email notifications, sign-in/out.

## Backend requirements (not implemented here)
Server-side validation and price calculation; rate limiting and abuse protection; unguessable order references with a second factor for tracking; authentication, authorisation and server-managed sessions for admin; private malware-scanned uploads with signed URLs; admin payment confirmation and audit logs; server-sent notifications.

## To confirm with the business
Dependency/conflict rules (`RULES` in catalog.ts, currently empty); durations for services other than the first four; groupings for services 6-12; bank details; the order-form fields; privacy notice wording; whether a logo asset exists (the current mark is a recreation of the "X" tile).

## Relationship to the existing app
This folder is a standalone redesign prototype and is **not wired into** the Express/EJS app at the repo root. That app already implements orders, auth, tracking, uploads and payments server-side. The prototype's `src/lib/ordersApi.ts` shows "not connected" because the prototype was built from pasted site content, before the backend was visible. Next step is either porting this design into `views/` + `public/css`, or implementing `OrdersApi` against the existing routes (`POST /order`, `POST /track`, ...).
