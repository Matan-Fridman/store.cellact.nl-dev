# Securing Cloud Functions (GCP config only)

Cloud Functions **2nd gen** run on **Cloud Run**. Who may call them is controlled by **IAM** on the underlying Cloud Run service — Google validates the caller **before** your code runs. You do **not** need extra token-verification libraries in the repo for that.

## How it works

1. **Do not** grant `roles/run.invoker` to `allUsers` (and avoid `allAuthenticatedUsers` unless you mean any Google account).
2. Grant **`roles/run.invoker`** only to identities that should call the service (a **service account** used by your Stripe adapter, Pub/Sub push, etc.).
3. Callers must send an **identity token** for the **target URL** in `Authorization: Bearer <token>` (when using authenticated invoke). Cloud Run checks signature + audience.

Your app can still use **`X-Processor-Secret`** (or similar) as an extra shared secret — that stays in env / Secret Manager, not in “verify JWT in code”.

---

## Processor (`POST /v1/events`)

**Goal:** Only your adapter (e.g. Stripe webhook service) can reach it.

1. Deploy **without** public invoker (e.g. omit `--allow-unauthenticated`, or remove public access after deploy).
2. Grant invoker to the adapter’s runtime service account:

```bash
# Replace with your project, region, service name, and caller SA email
gcloud run services add-iam-policy-binding PROCESSOR_SERVICE_NAME \
  --region=REGION \
  --member="serviceAccount:stripe-adapter@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

3. Configure the **Stripe adapter** (or whatever calls the processor) to run as that service account and to obtain an **ID token** for the **processor URL** and send it as `Authorization: Bearer …` (standard for service-to-service calls on GCP).

---

## Order-result (`GET /order-result`) vs payment worker (`POST /_pubsub`)

These are **two** Cloud Run services in production (`handler/orderResult.js` and `handler/worker.js`).

- **Order-result:** **Public** invoker (`allUsers`). The browser cannot send a Google ID token. Add a **poll token** on the success URL when you want stronger binding than `session_id` alone.
- **Payment worker:** **No** public invoker. Use [authenticated Pub/Sub push](https://cloud.google.com/pubsub/docs/push#authentication); grant **`roles/run.invoker`** only to the push service account. The worker calls **chain-server** with an **ID token** (`BLOCKCHAIN_SERVER_URL`); grant the **worker’s** runtime SA **`roles/run.invoker`** on **chain-server**.

---

## Chain-server vs chain-activate

- **chain-server** (`api/chainServer.js`): **`purchase`** and **`expire`** only — **private**; invoker = payment worker SA (or break-glass admin SA).
- **chain-activate** (`api/chainActivate.js`): **`activate`** only — **public** invoker for `/claim`; consider App Check / rate limits later.

Legacy **`api/index.js`** (`main`) combines all three actions on one URL — avoid for production IAM.

---

## Pub/Sub → payment worker

When creating the push subscription, use **`--push-auth-service-account`**. Grant that SA **`roles/run.invoker`** on the **payment-worker** service (not on order-result).

---

## References

- [Authenticating for invocation](https://cloud.google.com/functions/docs/securing/authenticating) (Gen2 / Cloud Run)
- [Pub/Sub push authentication](https://cloud.google.com/pubsub/docs/push#authentication)
