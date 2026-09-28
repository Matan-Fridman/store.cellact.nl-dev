# store.cellact.nl-dev (Light PBX testing)

Test / Pages copy of the Cellact store for **Light PBX Stripe refer + checkout**.

- **Not** production `store.cellact.nl` (no CNAME; GitHub project Pages only)
- Live: https://matan-fridman.github.io/store.cellact.nl-dev/
- Hostname is not `store.cellact.nl` → `getApiConfig` uses **staging** GCP:
  `https://europe-west1-arnacon-staging-production.cloudfunctions.net/payment-link-generator`
- Vite `base` for Pages: `/store.cellact.nl-dev/` (`VITE_BASE_PATH`)

## Refer URL (same contract as prod)

```
https://matan-fridman.github.io/store.cellact.nl-dev/lightpbx/refer
  ?packageId=lightpbx_basic|lightpbx_standard|lightpbx_super
  &lang=en|he|nl
  &systemId=<required>
  &userId=<required Google user id>
```

Aliases: `plan` / `type` / `package` / `package_id`; `system_id` / `user_id`.  
`/lightpbx/pay` is the same page (backward compatible).

See `LIGHTPBX_STRIPE_CHECKOUT.md` for the full refer contract (ported from prod).

## Light PBX app URL

Default fulfillment origin: `https://app.lightpbx.com` (`VITE_LIGHTPBX_APP_URL` override supported).

Optional `success_url` / `cancel_url` allowlist: `app.lightpbx.com`, `localhost:3000`, `lightpbx-store.vercel.app`.

