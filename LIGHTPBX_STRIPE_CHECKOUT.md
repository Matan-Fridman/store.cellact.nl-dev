# Light PBX Stripe checkout (refer)
> **Test store (this repo):** Pages at `https://matan-fridman.github.io/store.cellact.nl-dev/` — hostname is not `store.cellact.nl`, so checkout hits **staging** GCP `arnacon-staging-production`. Production CNAME is intentionally absent.


Cellact Store owns Stripe via GCP `payment-link-generator` (`lightpbx_*` packages). lightpbx-store never holds Stripe keys.

## Auth entry (locked)

Checkout **always** starts from the authenticated **lightpbx-store dashboard** with a known `systemId` + `userId` (Google id matching the lightpbx-store session).

- Base44 / marketing must **not** send anonymous users straight to refer.
- After Stripe, success always lands on lightpbx-store **`/billing/success`** (fulfillment). Their app then opens the dashboard — never marketing `/`.

## Public refer URL

```
https://store.cellact.nl/lightpbx/refer
  ?packageId=lightpbx_basic|lightpbx_standard|lightpbx_super
  &lang=en|he|nl
  &systemId=<required>
  &userId=<required Google user id>
```

**Aliases** (same page):

| Param | Accepts |
|---|---|
| package | `packageId`, `package_id`, `package`, `plan`, `type` |
| plan short names | `basic` \| `standard` \| `super` → `lightpbx_*` |
| ids | `system_id`, `user_id` |
| lang | `en` \| `he` \| `nl` (default `en`) |

`/lightpbx/pay` is a **backward-compatible alias** of the same page.

Optional overrides (rarely needed):

- `success_url` / `cancel_url` — **only** accepted if same origin as `VITE_LIGHTPBX_APP_URL` (default `https://lightpbx-store.vercel.app`) **or** `http://localhost:3000`, and pathname is exactly `/billing/success` or `/billing/cancel`. Marketing `/`, `/he`, etc. are rejected. Store still forces `session_id={CHECKOUT_SESSION_ID}` on success and `systemId` + `lang` on both.

## Package IDs

| Plan | `packageId` | Default EUR (generator env) |
|---|---|---|
| `basic` | `lightpbx_basic` | €20 (`LIGHTPBX_BASIC_PRICE_CENTS=2000`) |
| `standard` | `lightpbx_standard` | €40 (`LIGHTPBX_STANDARD_PRICE_CENTS=4000`) |
| `super` | `lightpbx_super` | €80 (`LIGHTPBX_SUPER_PRICE_CENTS=8000`) |

Generator **ignores** client prices for these package ids.

## Success / cancel URLs (store builds these)

Env:

- `VITE_LIGHTPBX_APP_URL` — default `https://lightpbx-store.vercel.app`
- `VITE_LIGHTPBX_APP_URL_STAGING` — docs / staging reference only

**Success** (exact shape — literal Stripe placeholder):

```
{APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}&systemId={id}&lang={lang}
```

**Cancel:**

```
{APP_URL}/billing/cancel?systemId={id}&lang={lang}
```

Critical: include the literal `{CHECKOUT_SESSION_ID}` in `success_url`. Stripe substitutes it with `cs_…`. Do **not** rely on generator auto-append alone.

### Double `session_id` (GCP follow-up)

The store sends the full success template **with** `session_id={CHECKOUT_SESSION_ID}` already present.

If `payment-link-generator` also appends `session_id={CHECKOUT_SESSION_ID}`, it **must skip** when the key is already on the URL (otherwise Stripe may see `session_id=…&session_id=…`). Store strips a duplicate placeholder client-side if one is accidentally present before create; GCP should still skip append when present.

## What the generator should set

- Stripe Checkout metadata: `product=lightpbx`, `packageId`, `plan`, `systemId`, `userId` (+ internal ids)
- Prefer store-built return URLs as-is (do not strip `session_id` / `systemId` / `lang`)
- `lang` may be `en` \| `he` \| `nl` — pass through; GCP may need to accept `nl` if it currently coerces to `en|he` only
- Optional: `client_reference_id` for Light PBX (GCP follow-up if not already set)

## After payment (lightpbx-store)

1. User lands on `/billing/success?session_id=cs_…&systemId=…&lang=…`.
2. Fulfillment reads `session_id` and completes purchase (S2S against Stripe / lightpbx-config as designed there).
3. App opens the **dashboard** — not marketing `/`.

## Dashboard caller example

```
https://store.cellact.nl/lightpbx/refer
  ?packageId=lightpbx_standard
  &systemId=sys_abc123
  &userId=google-oauth2|1234567890
  &lang=en
```

Open as a **full page** (top-level navigation). Stripe redirect uses iframe breakout when possible; sandboxed iframes will fail.

## Deploy checklist

1. Deploy updated `payment-link-generator` if needed (skip duplicate `session_id`; accept `lang=nl`).
2. Set generator price env if defaults are wrong.
3. Store Pages deploy includes `/lightpbx/refer` + `/lightpbx/pay` SPA fallbacks.
4. Optional: `VITE_LIGHTPBX_APP_URL` if fulfillment host differs from `https://lightpbx-store.vercel.app`.
5. lightpbx-store dashboard CTAs → `/lightpbx/refer` with `systemId`, `userId`, `packageId`, `lang`.

No Secnum SKUs or Secnum webhook secrets are reused. Primary path: Checkout → success_url → fulfillment(`session_id`).
