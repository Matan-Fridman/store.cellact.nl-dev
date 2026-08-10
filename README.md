# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

---

## Purchase language (en / he)

Checkout language must survive the whole funnel — not just the browser.

**Rule:** whatever language the customer used at purchase (`en` | `he`) is persisted on the order and reused for Stripe Checkout locale, success/cancel URLs, activation email, `/activate`, and the Arnacon `/claim` deep link.

| Step | What carries `lang` |
|------|---------------------|
| Store checkout | `createCheckoutSession({ lang })` + `success_url` / `failure_url` include `?lang=` |
| `payment-link-generator` | Writes `incomingOrders.lang`; sets Stripe `locale` |
| `secnum-payment-worker` | Copies `lang` into `productOrders.metadata.lang` |
| `secnum-*-executor` | Bilingual activation email; `claimTokens.lang`; activate URL `?lang=` |
| `secnum-order-result` | Claim / Arnacon URL includes `?lang=` from the claim token |

Do **not** rely on `localStorage` for email / phone / QR — that only works on the same browser.

**Deploy order (required):** update GCP (`payment-link-generator`, payment worker, number/port executors, `secnum-order-result`) **before** or **with** the store release that sends `lang`. If the store sends `lang` and the generator schema is not updated yet, checkout returns 400.

---

## Secnum services (backend)

| Directory | Role |
|-----------|------|
| `api/` | Blockchain: **`chainServer.js`** (private `purchase`/`expire`), **`chainActivate.js`** (public `activate`), legacy **`index.js`** |
| `processor/` | Ingest only — canonical `POST /v1/events`, Firestore **buckets**, **Pub/Sub** |
| `handler/` | **`orderResult.js`** (public poll), **`worker.js`** (private Pub/Sub), legacy **`index.js`** |
| `webhook/` | Stripe adapter → processor; proxies **`HANDLER_URL`** (order-result) |

Docs: **`docs/DEPLOYMENT.md`**, **`docs/FLOW.md`**, **`docs/PAYMENT_ARCHITECTURE.md`**, **`docs/SECURITY.md`**.
