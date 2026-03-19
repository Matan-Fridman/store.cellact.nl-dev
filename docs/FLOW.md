# End-to-end flow and GCP functions

## Overview

**Three separate pieces:**

1. **Payment link generator** (GCP) – creates Stripe Checkout, writes order to Firestore
2. **Stripe webhook** (GCP) – receives Stripe events, calls insert-commitment, stores result in Firestore; **also** serves GET /order-result so the success page can fetch claimUrl
3. **Insert-commitment API** (GCP, JS) – **only** insert commitment (called by webhook) and **activate** (called by browser on claim). Nothing else.

The browser never calls the insert-commitment API for purchase. Only the webhook does.

---

## Step-by-step flow

### 1. User clicks “Purchase Number” (frontend)

- Frontend calls **payment link generator** → gets Stripe Checkout URL → redirects to Stripe

### 2. User pays on Stripe

- Stripe redirects to **success_url** (e.g. `https://your-store.com/success?session_id=<uuid>&user_address=...`)

### 3. Stripe sends webhook (server → server)

- Stripe sends **POST** to your **Stripe webhook** with event `checkout.session.completed`
- Webhook verifies signature, updates Firestore order `status: 'paid'`
- If order is Secnum, webhook calls **insert-commitment API**:  
  `POST { action: "purchase", checkoutSessionId: "<order_uuid>" }`
- Insert-commitment API allocates a number, runs insert commitment, returns `{ claimUrl }`
- Webhook writes `claimUrl` into Firestore `orders/<uuid>`

### 4. Success page (browser)

- User is already on `/success?session_id=<uuid>` (from step 2)
- Frontend **polls** the **webhook**: `GET /order-result?session_id=<uuid>`
- Webhook reads Firestore, returns `{ claimUrl }` (or null while still provisioning)
- When `claimUrl` is set, frontend shows success and the QR code (Arnacon deep link)

So the **browser** fetches the result (claimUrl / secret & label) **from the webhook** (or from a bucket if you switch to that). The JS insert-commitment endpoint is not involved in this step.

### 5. Activate (claim page)

- User opens claim link from QR → `/claim?secret=...&label=...&walletAddress=...`
- User taps “Activate” → frontend calls **insert-commitment API**:  
  `POST { action: "activate", userSecret, label, owner }`

---

## Summary

| Who            | Calls whom              | Purpose |
|----------------|-------------------------|--------|
| Browser        | Payment link generator  | Start checkout |
| Browser        | Stripe webhook GET /order-result | Poll for claimUrl after payment |
| Browser        | Insert-commitment API  | `activate` only (on claim page) |
| Stripe         | Stripe webhook          | POST `checkout.session.completed` |
| Stripe webhook | Insert-commitment API  | `purchase` → insert commitment, get claimUrl |
| Stripe webhook | Firestore               | Read/update orders |

---

## CORS (success page → webhook)

The success page fetches **GET /order-result** from the webhook. The webhook sets **CORS headers on the response** (`Access-Control-Allow-Origin: *` etc.) so the browser can read it.

If you still see “blocked by CORS” with status 200:

1. **Redeploy the webhook** – the code now uses `make_response` and `_add_cors(resp)` on the GET /order-result and OPTIONS responses so headers are on the same response object Cloud Run returns.
2. **Cloud Run** – In GCP Console, open the webhook service (Cloud Run or Cloud Functions Gen 2). If there is a “CORS” or “Security” / “Networking” option, ensure it allows the frontend origin or “*”.
3. **Stripe webhook URL** – In Stripe Dashboard → Developers → Webhooks, the endpoint URL must be exactly your webhook’s URL so Stripe can reach it. Missing or wrong URL is why “the webhook doesn’t succeed” (no events received).
