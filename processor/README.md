# Payment processor (ingest only, Node.js)

Validates **`POST /v1/events`** from adapters, then:

1. **Ingest dedup** — Firestore `payment_event_ingest_keys/{provider:evtId}` (fails if duplicate → `200 { deduplicated: true }`).
2. **Bucket** — Firestore `payment_event_buckets/{bucket}/items/{id}` with `{ envelope, ingested_at }` (`bucket` slug from canonical `type`).
3. **Pub/Sub** — Publishes the same canonical JSON to **`PAYMENT_EVENTS_TOPIC`** with attributes `bucket`, `provider`, `type`.

The **handler** service subscribes to that topic and runs orders + blockchain logic.

`GET /order-result` lives on the **handler** (`http` target), not here.

## Env

| Variable | Purpose |
|----------|---------|
| `PROCESSOR_INGEST_SECRET` | `X-Processor-Secret` |
| `PAYMENT_EVENTS_TOPIC` | Pub/Sub topic id (default `secnum-payment-events`) |
| `GOOGLE_CLOUD_PROJECT` / `GCP_PROJECT` | GCP project for Pub/Sub |
| `INGEST_KEYS_COLLECTION` | Override ingest dedup collection name |
| `PAYMENT_EVENT_BUCKET_ROOT` | Override bucket root collection (default `payment_event_buckets`) |

## Create topic (once)

```bash
gcloud pubsub topics create secnum-payment-events
```

## Run locally

```bash
npm install
export PROCESSOR_INGEST_SECRET=dev
export GOOGLE_CLOUD_PROJECT=your-project
npm start
```

Grant the processor service account **Pub/Sub Publisher** and **Firestore** read/write.

**Who can call `POST /v1/events`:** use Cloud Run **IAM** (`roles/run.invoker`) — see **`docs/SECURITY.md`**. Keep **`X-Processor-Secret`** as an app-level check; GCP handles identity at the edge.
