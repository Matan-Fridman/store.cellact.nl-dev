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

## Handler (same URL for `GET /order-result` and `POST /_pubsub`)

**Constraint:** One Cloud Run service = **one** invoker policy for **all** paths.

- **`GET /order-result`** is usually called from the **browser** → it cannot send a Google ID token for your API → you typically keep this endpoint **publicly invokable** (`allUsers` invoker) and treat `session_id` as an unguessable capability id (or add a separate small public function later).
- **`POST /_pubsub`** should be **authenticated**: use a [Pub/Sub push subscription with authentication](https://cloud.google.com/pubsub/docs/push#authentication) so Google calls your URL with a valid identity, and grant **`roles/run.invoker`** only to Pub/Sub’s push service account (or the SA you attach to push).

If you need **both** strict IAM on push **and** no public access on the same host, split into two services (e.g. public `order-result` + private `/_pubsub`).

---

## Pub/Sub → handler

When creating the push subscription, use **`--push-auth-service-account`** (see `gcloud pubsub subscriptions create` help). Grant that SA **`roles/run.invoker`** on the handler Cloud Run service. Pub/Sub will attach the token; Cloud Run enforces it.

---

## References

- [Authenticating for invocation](https://cloud.google.com/functions/docs/securing/authenticating) (Gen2 / Cloud Run)
- [Pub/Sub push authentication](https://cloud.google.com/pubsub/docs/push#authentication)
