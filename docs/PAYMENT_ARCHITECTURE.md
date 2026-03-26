# Payment architecture: processor (ingest) + buckets + handler

## Goals

- **One canonical event model** for checkout/billing, independent of Stripe, Paddle, etc.
- **Processor** (ingest only): validate, **dedupe ingest**, write **Firestore buckets**, **publish Pub/Sub**. No orders, no blockchain.
- **Handler** (subscriber): **subscribes** to Pub/Sub (and/or can be extended to other triggers), runs **Firestore + blockchain** side effects, serves **`GET /order-result`**.
- **Adapters**: verify provider webhooks, map to canonical JSON, **`POST` processor** only.

---

## Components

| Service | Role |
|---------|------|
| **`processor/`** | `POST /v1/events` → ingest dedup key → **`payment_event_buckets/{bucket}/items`** → **Pub/Sub** topic. Returns **202** accepted. |
| **`handler/`** | **One HTTP** Cloud Function (`main`): **`GET /order-result`** + **`POST /_pubsub`** for [Pub/Sub push](https://cloud.google.com/pubsub/docs/push) (same envelope as topic). No second function — use a push subscription to this URL. |
| **`webhook/`** (Stripe adapter) | Stripe verify → `POST` **processor**; proxies **`GET /order-result`** to **`HANDLER_URL`** (or legacy `PROCESSOR_URL`). |
| **`api/`** | Blockchain only (`purchase`, `expire`, `activate`). Called by **handler**, not processor. |

```
Stripe  →  adapter  →  processor (buckets + Pub/Sub)
                           ↓
                     handler (subscriber)  →  Firestore orders + api/
Browser →  adapter or handler  →  GET /order-result (handler)
```

---

## Buckets (Firestore)

After a successful ingest (and before Pub/Sub publish), the processor writes:

- **Collection root:** `payment_event_buckets` (override: `PAYMENT_EVENT_BUCKET_ROOT`)
- **Path:** `{root}/{bucket}/items/{autoId}`
- **`bucket`** slug = canonical `type` with non-alphanumeric → `_` (e.g. `checkout_completed`)
- **Document:** `{ envelope: <full canonical body>, ingested_at: serverTimestamp }`

This is the **durable bucket** you can inspect in console; the **handler** is driven by **Pub/Sub** (same payload).

---

## Pub/Sub

- **Topic:** `PAYMENT_EVENTS_TOPIC` (default `secnum-payment-events`).
- **Message data:** UTF-8 JSON of the **full envelope** (same as `POST /v1/events` body).
- **Attributes:** `bucket` (= canonical `type`), `provider`, `type`.

Create a **push subscription** on this topic whose endpoint is **`{HANDLER_URL}/_pubsub`** (see `handler/README.md`). You do **not** deploy a separate Pub/Sub-triggered function.

---

## Ingest dedup (processor)

Firestore **`payment_event_ingest_keys/{provider:evtId}`** (override: `INGEST_KEYS_COLLECTION`).

- Created with **`create()`** so concurrent duplicate ingests collide → **200** `{ deduplicated: true }`.
- If Pub/Sub publish fails after bucket write, processor rolls back bucket row + ingest key so the adapter can retry.

---

## Processed dedup (handler)

Firestore **`payment_events_processed`** (override: `DEDUP_COLLECTION`).

- After **successful** handling (or permanent 4xx), the handler records `(provider, provider_event_id)` so Pub/Sub retries do not double-apply side effects.
- **502 / retryable** errors: handler **throws** → Pub/Sub **nack** → redelivery.

---

## Canonical event envelope (`spec_version: 1`)

Adapters send **JSON** to **`POST {PROCESSOR_URL}/v1/events`** with header:

`X-Processor-Secret: <PROCESSOR_INGEST_SECRET>`

### Processor responses

| Status | Meaning |
|--------|---------|
| **202** | Enqueued to bucket + published to Pub/Sub. |
| **200** | Duplicate ingest (`deduplicated: true`). |
| **401** / **400** | Auth or validation error. |
| **502** | Pub/Sub publish failed (rollback attempted). |

### Event catalog (`data` payloads)

Same as before — see previous sections in git history or **`docs/FLOW.md`**: `checkout.completed`, `subscription.ended`.

---

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `PROCESSOR_INGEST_SECRET` | Processor + adapters | Ingest auth. |
| `PAYMENT_EVENTS_TOPIC`, `GOOGLE_CLOUD_PROJECT` | Processor | Pub/Sub publish. |
| `HANDLER_URL` | Stripe adapter | `GET /order-result` proxy target (**handler** HTTP URL). |
| `PROCESSOR_URL` | Stripe adapter | Ingest URL. |
| `BLOCKCHAIN_CF_URL`, `STORE_ORIGIN`, … | **Handler** | Side effects + claim URLs. |
| `DEDUP_COLLECTION` | **Handler** | Default `payment_events_processed`. |

---

## Adding a new payment provider

1. New adapter: verify signature → map events → **`POST` processor** (canonical envelope).
2. If you add a new **`type`**, extend **handler** `dispatchCanonicalEvent` / `logic.js`.
3. Optional: add **Pub/Sub subscription filters** on `attributes.bucket` for dedicated workers.

---

## Deploy order

1. Create Pub/Sub topic; deploy **processor** (publisher + Firestore).
2. Deploy **handler** once (`--entry-point=main`, HTTP); create **push subscription** → `{handlerUrl}/_pubsub`.
3. Deploy **adapter** with `PROCESSOR_URL`, `HANDLER_URL`, secrets.

See `handler/README.md`, `processor/README.md`, `docs/FLOW.md`.

**Deploy order & env vars:** `docs/DEPLOYMENT.md`. **IAM:** `docs/SECURITY.md`.
