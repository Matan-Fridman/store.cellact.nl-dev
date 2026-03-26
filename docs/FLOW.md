# Architecture: blockchain CF, processor, handler, adapters, client

## Mental model

| Layer | Responsibility |
|-------|----------------|
| **Blockchain CF** (`api/index.js`) | On-chain: `purchase`, `expire`, `activate`. |
| **Processor** (`processor/`) | **Ingest only:** validate `POST /v1/events`, **Firestore buckets**, **Pub/Sub** publish. |
| **Handler** (`handler/`) | **One HTTP function**: Pub/Sub **push** → `POST /_pubsub` + **`GET /order-result`**. |
| **Stripe adapter** (`webhook/`) | Stripe verify → **processor**; proxies **order-result** → **handler**. |
| **Client** | Polls **`/order-result`**; claim → **`activate`**. |

---

## End-to-end sequence

1. Client → Stripe Checkout.
2. Stripe → adapter → **`POST` processor** `checkout.completed` → bucket + Pub/Sub **202**.
3. **Handler worker** consumes message → Firestore order update → **`purchase`** on **`api/`** → `label` / `userSecret` on order.
4. Client polls **`GET /order-result`** (handler URL, often via adapter proxy).
5. Claim → **`api/`** `activate`.
6. Subscription deleted → adapter → **`subscription.ended`** → handler → **`expire`** on **`api/`**.

---

## Summary

| Who | Calls | What |
|-----|--------|------|
| Adapter | Processor | `POST /v1/events` |
| Processor | Firestore + Pub/Sub | Buckets + topic |
| Handler worker | Firestore + `api/` | Provision / expire |
| Client / adapter | Handler | `GET /order-result` |
| Client | `api/` | `activate` |

Details: **`docs/PAYMENT_ARCHITECTURE.md`**.
