# Deploy (split stack) — `europe-west1`

**Recommended order:** deploy everything to **dev** first (`arnacon-nl`), run smoke tests, then repeat the **same steps** for **production** (`arnacon-production-gcp`) with new URLs, secrets, and Stripe live mode.

Use **`PROJECT_ID`** below: start with `arnacon-nl`, later `arnacon-production-gcp`.

### One-command deploy (script)

From repo root, after **`cp scripts/deploy.env.example deploy.env`** and editing secrets:

```bash
chmod +x scripts/deploy-gcp-payment-stack.sh
./scripts/deploy-gcp-payment-stack.sh
```

The script runs the same order as the checklist (topic → IAM → processor → chain-server → chain-activate → order-result → worker → Stripe adapter → Pub/Sub → invoker bindings). See **`scripts/deploy.env.example`** for variables. **`deploy.env`** is gitignored.

**Re-runs:** If a function **already exists** under the same **`FN_*`** name, the script **skips** `gcloud functions deploy` and reuses the live URL from GCP (no local state file required for that). It writes **`deploy.state`** (gitignored) with the URLs for your notes. To **force** redeploy everything: **`DEPLOY_FORCE=1`**.

To **skip redeploying the processor** when it was never created by this script, set **`EXISTING_PROCESSOR_URL`** in `deploy.env` (and **`FN_PROCESSOR`** if the name is not the default).

### Node.js runtime on Cloud Functions (Gen2)

Examples below use **`--runtime=nodejs22`**. For the newest GCP Node image, use **`nodejs24`** instead (same flag). To see what your region offers:

```bash
gcloud functions runtimes list --filter="name:nodejs" --region=europe-west1
```

---

## Step-by-step checklist (dev → prod)

Work down the list. After each deploy, copy the **HTTPS URL** from the Cloud Console or `gcloud functions describe …` output into your notes (you will need them for env vars and IAM).

### A. One-time per project

**A1.** Point gcloud at the target project and region:

```bash
export PROJECT_ID=arnacon-nl   # later: arnacon-production-gcp
gcloud config set project "$PROJECT_ID"
gcloud config set run/region europe-west1
gcloud config set functions/region europe-west1
```

**A2.** Enable APIs (once per project): Cloud Functions, Cloud Run, Firestore, Pub/Sub, Secret Manager, Artifact Registry (and any you already use).

**A3.** Ensure **Firestore (Native)** exists in **`europe-west1`** for this project.

### B. Infrastructure

**B1. Pub/Sub topic**

```bash
gcloud pubsub topics create secnum-payment-events --project="$PROJECT_ID" 2>/dev/null || true
```

### C. Back-end services (deploy in this order)

**C1. Processor** (`processor/`, entry **`main`**)  
- **Private:** `--no-allow-unauthenticated` (or omit `--allow-unauthenticated`).  
- Env: `PROCESSOR_INGEST_SECRET`, `GOOGLE_CLOUD_PROJECT=$PROJECT_ID`, `PAYMENT_EVENTS_TOPIC=secnum-payment-events`.  
- Runtime SA: Firestore read/write, Pub/Sub **Publisher**.  
- Save URL as **`PROCESSOR_URL`**.  
- **Exact commands:** [Appendix — Processor (Gen2)](#appendix-processor-gen2-http-private)

**C2. Chain-server** (`api/`, entry **`chainServer`**)  
- **Private.** GCS on numbers bucket; Secret Manager **`COORDINATES`**.  
- Save URL → **`BLOCKCHAIN_SERVER_URL`**.  
- **Commands:** [Appendix — Chain-server](#appendix-chain-server-gen2-http-private)

**C3. Chain-activate** (`api/`, entry **`chainActivate`**)  
- **Public** (`/claim`). Same **`COORDINATES`** secret as chain-server.  
- Save URL → storefront **`VITE_PROD_CHAIN_ACTIVATE_URL`**.  
- **Commands:** [Appendix — Chain-activate](#appendix-chain-activate-gen2-http-public)

**C4. Order-result** (`handler/`, entry **`orderResult`**)  
- **Public**; Firestore read on **`orders`**.  
- Save URL → **`HANDLER_URL`** (adapter) + poll base.  
- **Commands:** [Appendix — Order-result](#appendix-order-result-gen2-http-public)

**C5. Payment-worker** (`handler/`, entry **`worker`**)  
- **Private**; **`BLOCKCHAIN_SERVER_URL`**; no `SKIP_GCP_ID_TOKEN` on GCP.  
- **Commands:** [Appendix — Payment-worker](#appendix-payment-worker-gen2-http-private)

**C6. Stripe adapter** (`webhook/`, Python entry **`webhook`**)  
- **Public**; Stripe signing secrets; ID token to **private** processor.  
- **Commands:** [Appendix — Stripe adapter](#appendix-stripe-adapter-gen2-python-public)

**Then:** [Appendix — Pub/Sub push + IAM bindings](#appendix-pubsub-push--iam-bindings)

### D. IAM (after the functions exist)

Use the **Cloud Run** service name for each Gen2 function (often matches the function name you passed to `gcloud functions deploy`).

**D1.** **Stripe adapter** runtime SA → **`roles/run.invoker`** on **processor** only.

**D2.** **Payment-worker** runtime SA → **`roles/run.invoker`** on **chain-server** only.

**D3.** Create or pick **`sa-pubsub-push@$PROJECT_ID.iam.gserviceaccount.com`** → grant **`roles/run.invoker`** on **payment-worker** only.

### E. Pub/Sub → worker (last, you need the worker URL)

Create a **push** subscription on `secnum-payment-events` pointing at:

`https://<payment-worker-url>/_pubsub`

Use **authenticated push** with `--push-auth-service-account=sa-pubsub-push@$PROJECT_ID.iam.gserviceaccount.com` (see `gcloud pubsub subscriptions create --help`).

### F. Stripe Dashboard

- **Dev:** test mode webhook URL = adapter URL; events `checkout.session.completed`, `customer.subscription.deleted`.  
- **Prod:** live mode webhook = adapter URL; live signing secret in `stripe_prod_secret`.

### G. Storefront

Point your app at this stack:

- Polling: **`ORDER_RESULT_URL`** = order-result base (same host you set as `HANDLER_URL` on the adapter if you use the adapter proxy; or order-result directly).  
- Claim: **`VITE_PROD_CHAIN_ACTIVATE_URL`** = chain-activate URL.  
- Checkout: `VITE_PROD_STRIPE_URL` or your dev **`send_stripe`** URL on **`arnacon-nl`**.

Use **`VITE_USE_PRODUCTION_URLS=true`** only when the build should use those production env vars; for local dev you can keep **`arnacon-nl`** URLs in **`DEV_URLS`** inside `src/config/constants.ts` or use env overrides.

### H. Smoke test (dev)

1. Complete a **test** checkout (test card).  
2. Stripe → adapter: 2xx; adapter → processor: 202.  
3. Pub/Sub delivers; worker logs show processing; chain-server **`purchase`** runs if order is paid and package matches.  
4. Success page polls **order-result**; `/claim` calls **chain-activate**.

### I. Production repeat

Set `PROJECT_ID=arnacon-production-gcp`, **new** secrets, **live** Stripe webhook, production `STORE_ORIGIN`, production Vercel env. Redeploy each service; redo IAM + push subscription for **prod** URLs (do not share dev push subscription with prod unless you intentionally use one pub/sub topic across projects — normally **separate topic per project**).

---

## Reference: production project name

The sections below use **`arnacon-production-gcp`** explicitly; substitute **`PROJECT_ID`** when following the checklist above.

## 0. One-time gcloud context (production)

```bash
gcloud config set project arnacon-production-gcp
gcloud config set run/region europe-west1
gcloud config set functions/region europe-west1
```

Enable APIs (once): Cloud Functions, Cloud Run, Firestore, Pub/Sub, Secret Manager, Artifact Registry.

Create Firestore (Native) in **`europe-west1`** if not already.

## 1. Pub/Sub topic

```bash
gcloud pubsub topics create secnum-payment-events --project=arnacon-production-gcp
```

(Skip if it exists.)

## 2. Service accounts (recommended)

Create dedicated SAs (names are suggestions):

| Service account | Used by |
|-----------------|--------|
| `sa-stripe-adapter@…` | Stripe webhook Cloud Function runtime |
| `sa-processor@…` | Processor runtime |
| `sa-order-result@…` | Public order-result function |
| `sa-payment-worker@…` | Private Pub/Sub worker |
| `sa-chain-server@…` | Private chain `purchase` / `expire` |
| `sa-chain-activate@…` | Public chain `activate` |
| `sa-pubsub-push@…` | Pub/Sub push identity (invokes worker only) |

Grant each runtime SA only what it needs (Firestore, Pub/Sub publish, Storage, etc.).

## 3. Deploy **processor** (private)

- Source: `processor/`
- Entry: `main`
- **Do not** use `--allow-unauthenticated`
- Env: `PROCESSOR_INGEST_SECRET`, `GOOGLE_CLOUD_PROJECT=arnacon-production-gcp`, `PAYMENT_EVENTS_TOPIC=secnum-payment-events`, optional Firestore overrides
- IAM role on function: **Firestore** read/write, **Pub/Sub Publisher**

Note the HTTPS URL → **`PROCESSOR_URL`**.

Grant **`roles/run.invoker`** on this service to **`sa-stripe-adapter@arnacon-production-gcp.iam.gserviceaccount.com`** after the adapter exists.

## 4. Deploy **chain-server** (private) — `api/chainServer.js`

- Entry: **`chainServer`**
- **No** `--allow-unauthenticated`
- Env: `COORDINATES`, `CHAIN_ID`, `ENS_NAME`, `BUCKET_NAME`, GCS access for `numbers.json`

Note URL → **`BLOCKCHAIN_SERVER_URL`** for the payment worker.

Grant **`roles/run.invoker`** to **`sa-payment-worker@arnacon-production-gcp.iam.gserviceaccount.com`** only.

## 5. Deploy **chain-activate** (public) — `api/chainActivate.js`

- Entry: **`chainActivate`**
- **`--allow-unauthenticated`** (browser calls `activate` from `/claim`)

Note URL → Vercel **`VITE_PROD_CHAIN_ACTIVATE_URL`** (or legacy `VITE_PROD_API_URL`).

## 6. Deploy **payment-worker** (private) — `handler/worker.js`

- Entry: **`worker`**
- **No** `--allow-unauthenticated`
- Env:
  - **`BLOCKCHAIN_SERVER_URL`** = chain-server URL from step 4 (not the activate URL)
  - `STORE_ORIGIN` = production storefront origin (e.g. `https://…vercel.app`)
  - `ORDERS_COLLECTION`, `DEDUP_COLLECTION`, `SECNUM_PACKAGE_ID` if non-default
  - Omit **`SKIP_GCP_ID_TOKEN`** in prod (worker mints ID tokens to call chain-server)

Worker runtime SA needs: **Firestore**, **Invoker on chain-server** (step 4).

Grant **`roles/run.invoker`** on this service to **`sa-pubsub-push@…`** (used in step 9).

## 7. Deploy **order-result** (public) — `handler/orderResult.js`

- Entry: **`orderResult`**
- **`--allow-unauthenticated`**
- Same Firestore env as today for reading orders (`ORDERS_COLLECTION`, `STORE_ORIGIN` only needed for claim URLs inside `getOrderResult` logic — keep `STORE_ORIGIN` aligned with worker)

Note URL → **`HANDLER_URL`** on the Stripe adapter and **`VITE_PROD_ORDER_RESULT_URL`** on Vercel.

## 8. Deploy **Stripe adapter** (public) — `webhook/main.py`

- **`--allow-unauthenticated`**
- Env: `PROCESSOR_URL`, `PROCESSOR_INGEST_SECRET`, `HANDLER_URL` = **order-result** URL (step 7), `stripe_prod_secret`, live Stripe settings
- Runtime SA (`sa-stripe-adapter`): grant **Invoker** on **processor** and, if **order-result** is private later, on order-result (today order-result is public, so no token needed from adapter to handler unless you lock order-result down)

Set Stripe Dashboard (live) webhook to this URL; events: `checkout.session.completed`, `customer.subscription.deleted`.

## 9. Pub/Sub push subscription (authenticated worker)

Create (or update) a push subscription on `secnum-payment-events`:

- Push endpoint: `https://<PAYMENT_WORKER_URL>/_pubsub`
- Use **`--push-auth-service-account=sa-pubsub-push@arnacon-production-gcp.iam.gserviceaccount.com`**
- Grant **`sa-pubsub-push`** **`roles/run.invoker`** on the **payment-worker** Cloud Run service only

See [Pub/Sub push authentication](https://cloud.google.com/pubsub/docs/push#authentication).

## 10. Checkout / Stripe (backend that creates sessions)

- Use **live** Stripe keys and correct price IDs.
- Ensure `success_url` / metadata match production.

## 11. Vercel (frontend)

Production env:

- `VITE_USE_PRODUCTION_URLS=true`
- `VITE_PROD_ORDER_RESULT_URL` = **order-result** URL (step 7)
- `VITE_PROD_CHAIN_ACTIVATE_URL` = **chain-activate** URL (step 5)
- `VITE_PROD_STRIPE_URL` = your production Checkout/session function

## 12. Smoke test

1. Webhook delivery **2xx** in Stripe (live or test stack).
2. Processor logs: **202** ingest.
3. Pub/Sub → worker → Firestore / chain-server.
4. Browser success page polls **order-result**; `/claim` hits **chain-activate**.

---

## Example: Cloud Functions Gen 2 (Node) deploy shape

Replace placeholders (`SERVICE_ACCOUNT`, bucket, etc.):

```bash
# Payment worker (private)
cd handler
npm install
gcloud functions deploy secnum-payment-worker \
  --gen2 \
  --region=europe-west1 \
  --project=arnacon-production-gcp \
  --runtime=nodejs22 \
  --source=. \
  --entry-point=worker \
  --trigger-http \
  --no-allow-unauthenticated \
  --service-account=sa-payment-worker@arnacon-production-gcp.iam.gserviceaccount.com \
  --set-env-vars=BLOCKCHAIN_SERVER_URL=https://...,STORE_ORIGIN=https://...,GOOGLE_CLOUD_PROJECT=arnacon-production-gcp

# Order result (public)
gcloud functions deploy secnum-order-result \
  --gen2 \
  --region=europe-west1 \
  --project=arnacon-production-gcp \
  --runtime=nodejs22 \
  --source=. \
  --entry-point=orderResult \
  --trigger-http \
  --allow-unauthenticated \
  --service-account=sa-order-result@arnacon-production-gcp.iam.gserviceaccount.com \
  --set-env-vars=STORE_ORIGIN=https://...,GOOGLE_CLOUD_PROJECT=arnacon-production-gcp
```

Use analogous commands for `processor`, `api` (chainServer / chainActivate), and `webhook` (Python runtime). **Source** must be the directory whose `package.json` / `requirements.txt` matches the service.

---

## Appendix: Processor (Gen2 HTTP, private)

The processor is **Node.js** in **`processor/`**, Cloud Functions Framework target **`main`** in `index.js`. Gen2 runs on **Cloud Run** behind the same deploy command.

### 1. From your laptop

```bash
cd /path/to/secnum-store/processor
npm install    # optional locally; deploy still works — Cloud Build uses package.json
```

### 2. Choose names and secrets

- **Function name** (Cloud Run service name): e.g. `secnum-payment-processor` (must be unique in the project/region).
- **Ingest secret:** a long random string; same value must go on the Stripe adapter as `PROCESSOR_INGEST_SECRET`.

```bash
export PROJECT_ID=arnacon-nl
export REGION=europe-west1
export FN=secnum-payment-processor
export PROCESSOR_INGEST_SECRET='your-ingest-secret'
```

### 3. Runtime service account

By default Gen2 uses the **default compute** service account (`PROJECT_NUMBER-compute@developer.gserviceaccount.com`). That account must have:

- **Cloud Datastore User** (Firestore) or broader **Firebase / Firestore** roles you already use
- **Pub/Sub Publisher** on topic `secnum-payment-events`

Example (replace `PROJECT_NUMBER` after `gcloud projects describe $PROJECT_ID --format='value(projectNumber)'`):

```bash
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
export RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/datastore.user" \
  --condition=None

gcloud pubsub topics add-iam-policy-binding secnum-payment-events \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/pubsub.publisher"
```

(If you use a **custom** SA, pass `--service-account=sa-processor@$PROJECT_ID.iam.gserviceaccount.com` to `gcloud functions deploy` and grant the same roles to that SA.)

### 4. Deploy (private / authenticated invoke only)

```bash
gcloud functions deploy "$FN" \
  --gen2 \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --runtime=nodejs22 \
  --source=. \
  --entry-point=main \
  --trigger-http \
  --no-allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},PAYMENT_EVENTS_TOPIC=secnum-payment-events,PROCESSOR_INGEST_SECRET=${PROCESSOR_INGEST_SECRET}"
```

Secrets in plain `--set-env-vars` are OK for a quick dev pass; for production prefer **Secret Manager** and `--set-secrets=PROCESSOR_INGEST_SECRET=processor_ingest_secret:latest` after creating the secret.

### 5. Read **`PROCESSOR_URL`**

```bash
gcloud functions describe "$FN" \
  --gen2 \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format='value(serviceConfig.uri)'
```

Use that value as **`PROCESSOR_URL`** (no trailing slash). The Stripe adapter will call **`${PROCESSOR_URL}/v1/events`**.

### 6. Smoke test (private processor needs a valid ID token)

The processor checks **`X-Processor-Secret`** in your code **and** Cloud Run checks **`Authorization: Bearer …`** if the service is not public.

**Why `print-identity-token --audiences=…` can error:** On some accounts, `gcloud auth print-identity-token --audiences="$URL"` only works when you are using a **service account** (or **impersonating** one), not a normal Google user login. Then you see *Requires valid service account* on stderr.

**Option A — Impersonate a service account that has Invoker on this function**

Pick an SA you already granted **`roles/run.invoker`** on the processor (e.g. a small `sa-local-curl@…` or the Stripe adapter SA). Your user needs **`roles/iam.serviceAccountTokenCreator`** on that SA.

```bash
export URL=$(gcloud functions describe "$FN" --gen2 --project="$PROJECT_ID" --region="$REGION" --format='value(serviceConfig.uri)')
export INVOKER_SA="sa-local-curl@${PROJECT_ID}.iam.gserviceaccount.com"
TOKEN=$(gcloud auth print-identity-token --audiences="$URL" --impersonate-service-account="$INVOKER_SA")
curl -sS -X POST "${URL}/v1/events" \
  -H "Content-Type: application/json" \
  -H "X-Processor-Secret: ${PROCESSOR_INGEST_SECRET}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"spec_version":"1","type":"checkout.completed","provider":"stripe","provider_event_id":"test_smoke_1","data":{"order_id":"fake","payment_status":"paid","livemode":false}}'
```

**Option B — Grant your Google user `roles/run.invoker`, then omit `--audiences`**

Some setups can mint a user token without `--audiences` (behavior depends on gcloud / org policy):

```bash
TOKEN=$(gcloud auth print-identity-token)
curl -sS -X POST "${URL}/v1/events" \
  -H "Content-Type: application/json" \
  -H "X-Processor-Secret: ${PROCESSOR_INGEST_SECRET}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"spec_version":"1",...}'
```

If you still get **403**, use Option A.

**If you see `202` but also an error from `gcloud`:** The subshell for the token may have failed while an old shell still had a token, or the service was temporarily **public**. A **private** service with an empty `Bearer` header should return **403**.

Expect **401** for wrong `X-Processor-Secret`; **403** for missing/wrong ID token. The **Stripe adapter** on GCP uses its **runtime service account** to mint ID tokens — that path does not use your laptop `gcloud` user.

---

## Appendix: Chain-server (Gen2 HTTP, private)

**Chain-server** = `api/` deployed with **`--entry-point=chainServer`**. It only implements **`purchase`** and **`expire`** (`action` in JSON body). The payment **worker** calls it with a **Google ID token** (`BLOCKCHAIN_SERVER_URL`).

`api/index.js` **`require`s** `chainServer.js` / `chainActivate.js` so Gen2 (which loads `package.json` → **`main`**) still registers those targets — do not remove those `require` lines.

### 1. From your laptop

```bash
cd /path/to/secnum-store/api
npm install
```

### 2. Variables

```bash
export PROJECT_ID=arnacon-nl          # or arnacon-production-gcp
export REGION=europe-west1
export FN=secnum-chain-server         # any unique Cloud Run / function name
```

### 3. Runtime service account and Storage

Gen2 defaults to **`${PROJECT_NUMBER}-compute@developer.gserviceaccount.com`**. That identity must read/write the GCS object **`${BUCKET_NAME}/${NUMBERS_FILE}`** (defaults: bucket `secnum-numbers`, file `numbers.json` — override with env).

Grant **Storage** access on that bucket (narrow role is better than project-wide), e.g. **Storage Object Admin** on the bucket only:

```bash
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
export RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
export BUCKET_NAME=secnum-numbers   # must match deploy env

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/storage.objectAdmin"
```

Adjust if you use a **custom** runtime SA (`--service-account=…` on deploy).

### 4. Secret Manager for **`COORDINATES`** (private key)

Do **not** put the wallet key in `--set-env-vars`. Mount Secret Manager into the function as env var **`COORDINATES`** via **`--set-secrets`** (`ENV_NAME=secret_id:version`).

**If the secret already exists** (example: id **`key-281-new`**, version **`latest`**):

```bash
export SECRET_ID=key-281-new
```

Ensure the **runtime SA** (§3, `RUNTIME_SA`) can read it — grant once if you have not already:

```bash
gcloud secrets add-iam-policy-binding "$SECRET_ID" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None
```

(Omit `--condition=None` if your org does not use conditional IAM on secrets.)

**If you are creating a new secret instead:** pick another `SECRET_ID`, run `gcloud secrets create … --replication-policy=automatic`, then `gcloud secrets versions add … --data-file=-` with `printf '%s' '0x…'`, then the same **`secretAccessor`** binding as above.

### 5. Deploy (**private** — no public invoker)

```bash
gcloud functions deploy "$FN" \
  --gen2 \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --runtime=nodejs22 \
  --source=. \
  --entry-point=chainServer \
  --trigger-http \
  --no-allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},CHAIN_ID=137,ENS_NAME=secnum,BUCKET_NAME=${BUCKET_NAME}" \
  --set-secrets="COORDINATES=key-281-new-new:latest"
```

If your secret id differs, use **`COORDINATES=${SECRET_ID}:latest`** (or a fixed version).

**Updates:** new key version → `gcloud secrets versions add key-281-new …`; with **`latest`**, redeploy chain-server (and chain-activate) when you need a fresh revision.

**chain-activate** also needs **`COORDINATES`**: deploy it with **`--set-secrets=COORDINATES=key-281-new:latest`** (or `${SECRET_ID}:latest`) and **`secretAccessor`** on that function’s **`RUNTIME_SA`**.

### 6. Read **`CHAIN_SERVER_URL`** (this is **`BLOCKCHAIN_SERVER_URL`** on the worker)

```bash
gcloud functions describe "$FN" \
  --gen2 \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format='value(serviceConfig.uri)'
```

No trailing slash. Set on the **payment-worker** as:

`BLOCKCHAIN_SERVER_URL=<that URL>`

### 7. IAM after deploy

Grant **`roles/run.invoker`** on this service only to the **payment-worker** runtime SA (`sa-payment-worker@…`), not to `allUsers`.

### 8. Quick curl (expect **409** or **500** if bucket empty / bad body — **403** means IAM)

You must send **`Authorization: Bearer`** (same pattern as processor). Wrong `action` returns **404** from the app.

```bash
export URL=$(gcloud functions describe "$FN" --gen2 --project="$PROJECT_ID" --region="$REGION" --format='value(serviceConfig.uri)')
TOKEN=$(gcloud auth print-identity-token)   # if your user has Invoker on this service

curl -sS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"action":"purchase"}'
```

---

## Appendix: Chain-activate (Gen2 HTTP, public)

Same repo folder **`api/`** as chain-server; different **function name** and **`--entry-point=chainActivate`**.

**1.** Re-use **`RUNTIME_SA`** (default compute SA is fine). Grant **`secretAccessor`** on **`key-281-new`** (or your `SECRET_ID`) if you did not already when deploying chain-server — **each** deploy runtime SA must be able to read the secret (same SA ⇒ one binding enough).

**2.** Deploy (**public** — browser calls **`activate`** from `/claim`):

```bash
export REGION=europe-west1
export FN_ACTIVATE=secnum-chain-activate

cd /path/to/secnum-store/api
gcloud functions deploy "$FN_ACTIVATE" \
  --gen2 \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --runtime=nodejs22 \
  --source=. \
  --entry-point=chainActivate \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},CHAIN_ID=137,ENS_NAME=secnum,BUCKET_NAME=${BUCKET_NAME:-secnum-numbers}" \
  --set-secrets="COORDINATES=key-281-new:latest"
```

**3.** Save URL → **`CHAIN_ACTIVATE_URL`**. Vercel / build: **`VITE_PROD_CHAIN_ACTIVATE_URL`**.

---

## Appendix: Order-result (Gen2 HTTP, public)

**Browser** polls **`GET /order-result?session_id=…`**. Needs Firestore read on **`orders`**.

**1.** Default **`RUNTIME_SA`** needs **`roles/datastore.user`** at project level (if not already):

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/datastore.user" \
  --condition=None
```

**2.** Deploy:

```bash
export FN_ORDER=secnum-order-result
export STORE_ORIGIN=https://your-store.vercel.app

cd /path/to/secnum-store/handler
npm install
gcloud functions deploy "$FN_ORDER" \
  --gen2 \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --runtime=nodejs22 \
  --source=. \
  --entry-point=orderResult \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},STORE_ORIGIN=${STORE_ORIGIN}"
```

Add **`ORDERS_COLLECTION`**, **`SECNUM_PACKAGE_ID`** to `--set-env-vars` if you override defaults.

**3.** Save URI → **`ORDER_RESULT_BASE_URL`**. Set Stripe adapter **`HANDLER_URL=$ORDER_RESULT_BASE_URL`** (no path — adapter appends `/order-result`). Storefront poll base is the same host.

---

## Appendix: Payment-worker (Gen2 HTTP, private)

Processes Pub/Sub push at **`POST /_pubsub`**. Calls **private chain-server** with a **Google ID token** (`google-auth-library`).

**1.** Same **`RUNTIME_SA`** (or a dedicated SA): **Firestore** read/write + **Invoker** on **chain-server** (add IAM in [§ Pub/Sub + bindings](#appendix-pubsub-push--iam-bindings)).

**2.** Deploy (**no public invoker**):

```bash
export FN_WORKER=secnum-payment-worker
export BLOCKCHAIN_SERVER_URL=https://YOUR-CHAIN-SERVER-URL
export STORE_ORIGIN=https://your-store.vercel.app

cd /path/to/secnum-store/handler
gcloud functions deploy "$FN_WORKER" \
  --gen2 \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --runtime=nodejs22 \
  --source=. \
  --entry-point=worker \
  --trigger-http \
  --no-allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},BLOCKCHAIN_SERVER_URL=${BLOCKCHAIN_SERVER_URL},STORE_ORIGIN=${STORE_ORIGIN},DEDUP_COLLECTION=payment_events_processed"
```

**3.** Save URI → use as **`WORKER_URL`** for Pub/Sub push: **`${WORKER_URL}/_pubsub`**.

---

## Appendix: Stripe adapter (Gen2 Python, public)

**1.** From **`webhook/`** (needs `requirements.txt` + `main.py` with entry **`webhook`**).

```bash
export FN_ADAPTER=secnum-stripe-adapter
export PROCESSOR_URL=https://YOUR-PROCESSOR-URL
export HANDLER_URL=https://YOUR-ORDER-RESULT-URL
export PROCESSOR_INGEST_SECRET='your-shared-secret'

cd /path/to/secnum-store/webhook
gcloud functions deploy "$FN_ADAPTER" \
  --gen2 \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --runtime=python312 \
  --source=. \
  --entry-point=webhook \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="PROCESSOR_URL=${PROCESSOR_URL},HANDLER_URL=${HANDLER_URL},PROCESSOR_INGEST_SECRET=${PROCESSOR_INGEST_SECRET},stripe_secret=${STRIPE_TEST_WHSEC}"
```

**Dev:** set **`stripe_secret`** to the **test** Dashboard signing secret (`whsec_…`). **Prod:** add **`stripe_prod_secret`** and use live webhook; you can set both env vars on one function.

**2.** **On GCP** do **not** set **`SKIP_GCP_ID_TOKEN`**. The adapter adds **`Authorization: Bearer`** when calling **private** `PROCESSOR_URL` / `HANDLER_URL`.

**3.** Grant this function’s **runtime service account** **`roles/run.invoker`** on **processor** (and on **order-result** only if that service is private — normally order-result is public).

**4.** Stripe Dashboard → **Webhooks** → URL **`https://<adapter-url>/webhook`** (or `/` if you mounted there) → events **`checkout.session.completed`**, **`customer.subscription.deleted`**.

---

## Appendix: Pub/Sub push + IAM bindings

**1. Push identity** (create once per project if needed):

```bash
gcloud iam service-accounts create sa-pubsub-push \
  --project="$PROJECT_ID" \
  --display-name="Pub/Sub push to payment worker"
```

**2. Worker URL** (no trailing slash):

```bash
export WORKER_URL=$(gcloud functions describe "$FN_WORKER" --gen2 --project="$PROJECT_ID" --region="$REGION" --format='value(serviceConfig.uri)')
```

**3. Let Pub/Sub sign OIDC tokens as the push SA** (required — without this, create often fails with *invalid argument … oidc_token::service_account_email*):

```bash
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud iam service-accounts add-iam-policy-binding "sa-pubsub-push@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --condition=None
```

(Omit `--condition=None` if unused in your org.)

**4. Push subscription** (authenticated):

```bash
gcloud pubsub subscriptions create secnum-payment-events-push \
  --project="$PROJECT_ID" \
  --topic=secnum-payment-events \
  --push-endpoint="${WORKER_URL}/_pubsub" \
  --push-auth-service-account="sa-pubsub-push@${PROJECT_ID}.iam.gserviceaccount.com" \
  --push-auth-token-audience="${WORKER_URL}"
```

(If the subscription id already exists, delete or pick another name.)

**5. IAM summary** — run after all services exist (`--condition=None` if your org requires it):

| Caller (member) | Target Cloud Run service | Role |
|-----------------|--------------------------|------|
| Stripe adapter runtime SA | **`secnum-payment-processor`** (your processor name) | `roles/run.invoker` |
| Payment-worker runtime SA | **`secnum-chain-server`** | `roles/run.invoker` |
| `sa-pubsub-push@…` | **`secnum-payment-worker`** | `roles/run.invoker` |

Example:

```bash
gcloud run services add-iam-policy-binding secnum-payment-processor \
  --project="$PROJECT_ID" --region="$REGION" \
  --member="serviceAccount:ADAPTER_RUNTIME_SA@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --condition=None
```

Replace service names with the **`gcloud functions deploy`** names you chose. **Runtime SA** for a Gen2 function:

```bash
gcloud functions describe "$FN_ADAPTER" --gen2 --project="$PROJECT_ID" --region="$REGION" \
  --format='value(serviceConfig.serviceAccountEmail)'
```

**6. Checkout backend** — ensure **Stripe session** creation (e.g. `send_stripe`) uses **`success_url`** / metadata consistent with **`STORE_ORIGIN`**.

**7. Vercel (or host)** — production env:

- `VITE_USE_PRODUCTION_URLS=true`
- `VITE_PROD_ORDER_RESULT_URL` = order-result base URL  
- `VITE_PROD_CHAIN_ACTIVATE_URL` = chain-activate URL  
- `VITE_PROD_STRIPE_URL` = your Checkout/session function URL  

**8. Smoke test** — test card → Stripe **2xx** on webhook → processor **202** → Pub/Sub → worker logs → poll **order-result** → **claim** hits **chain-activate**.

---

## Legacy monolith (optional / migration)

- **`handler/index.js`** target **`main`**: order-result + `/_pubsub` together.
- **`api/index.js`** target **`main`**: purchase + expire + activate together.

Prefer split deploys — see **`docs/SECURITY.md`**.
