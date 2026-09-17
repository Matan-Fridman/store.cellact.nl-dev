# Light PBX Stripe checkout (Base44 web2)

Staging-first. Store holds Stripe via GCP `payment-link-generator`. Base44 never holds Stripe keys.

## Package IDs (align with `lightpbx-config` plans)

| Plan (`lightpbx-config`) | Store / generator `packageId` | Default EUR (override with env on generator) |
|---|---|---|
| `basic` | `lightpbx_basic` | €20 (`LIGHTPBX_BASIC_PRICE_CENTS=2000`) |
| `standard` | `lightpbx_standard` | €40 (`LIGHTPBX_STANDARD_PRICE_CENTS=4000`) |
| `super` | `lightpbx_super` | €80 (`LIGHTPBX_SUPER_PRICE_CENTS=8000`) |

Defaults are **staging placeholders** until Matan sets real Stripe amounts. Generator **ignores** client prices for these package ids.

## How Base44 starts checkout

Open (browser redirect or link):

```
https://store.cellact.nl/lightpbx/pay
  ?systemId=<Light PBX system id>
  &userId=<Google / Base44 user id>
  &plan=basic|standard|super
  &success_url=https://<base44-app>/billing/success
  &cancel_url=https://<base44-app>/billing/cancel
  &lang=en
```

Staging store host may differ; same path. If `success_url` / `cancel_url` omitted, store uses `VITE_LIGHTPBX_SUCCESS_URL` / `VITE_LIGHTPBX_CANCEL_URL` (defaults to `https://lightpbx-staging.base44.app/billing/success|cancel`).

### What the generator adds

- Stripe Checkout metadata: `product=lightpbx`, `packageId`, `plan`, `systemId`, `userId` (+ internal `uuid`)
- Redirect URLs get `systemId`, `plan`, `packageId` query params
- On success/cancel Stripe appends **`session_id={CHECKOUT_SESSION_ID}`** (real `cs_…`, required by `lightpbx-config.purchase`)

## After payment (Base44 backend)

1. Read `session_id` from the success URL (`cs_…`).
2. S2S `POST` staging `lightpbx-config` action `purchase` with web2 HMAC + `{ session_id, systemId, … }` (dual-auth already on staging).
3. Do **not** trust the browser alone — GCP retrieves the session from Stripe and checks metadata.

## Deploy checklist (Matan)

1. Deploy updated `payment-link-generator` to **staging** (`arnacon-staging-production`).
2. Set env on that function if defaults are wrong: `LIGHTPBX_BASIC_PRICE_CENTS`, `LIGHTPBX_STANDARD_PRICE_CENTS`, `LIGHTPBX_SUPER_PRICE_CENTS`.
3. Push / Pages-deploy `store.cellact.nl` (includes `/lightpbx/pay`).
4. Optional store env: `VITE_LIGHTPBX_SUCCESS_URL`, `VITE_LIGHTPBX_CANCEL_URL`.
5. Base44: point pay CTA at `/lightpbx/pay` with the query params above.

No Secnum SKUs or Secnum webhook secrets are reused. Optional Light-PBX-only webhook can come later; primary path is Checkout → success_url → `purchase(session_id)`.
