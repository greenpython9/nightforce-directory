# nightforce.cc Directory

`nightforce.cc` is an unofficial, community-built directory for discovering verified Nightforce ambassadors across countries, regions, roles, profile visibility, and public contact availability.

The project includes:

- a React and Vite directory frontend;
- a Cloudflare Worker API;
- a Cloudflare D1 database;
- optional Cloudflare R2 profile images;
- a Midnames `.night` identity integration;
- Midnight wallet and Contact Mode contract work.

This repository is not an official Midnight product or official ambassador registration portal.

## Current integration status

| Integration                               | Status                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| Midnames `.night` SDK                     | Working and reviewable on Midnight preprod                                |
| Public directory frontend                 | Working                                                                   |
| Cloudflare Worker API                     | Working locally and in production                                         |
| Local D1 migrations                       | Working                                                                   |
| Midnight wallet profile flow              | Temporarily disabled                                                      |
| Contact Mode preprod flow                 | Previously tested, but not currently exposed as a supported end-user flow |
| Contact Mode federated-mainnet deployment | In progress                                                               |

### Midnames status

The Midnames integration is independent from the Midnight wallet profile flow.

Users add their `.night` domain manually as part of their profile information after approval. Public profiles can then display a `.night` button that opens the Midnames SDK holographic card or full domain profile.

The integration is intentionally pinned to Midnight preprod:

```ts
createDefaultProvider({ networkId: "preprod" });
```

A development-only verification route is available at:

```text
http://localhost:5173/dev/midnames-test
```

The route uses the real:

- `@midnames/sdk`;
- Midnames provider;
- `MidnamesProfileButton`;
- holographic card;
- full domain profile widget;
- profile-card surface.

No Midnames response is mocked.

The test domain is:

```text
12345.night
```

The route is registered only when `import.meta.env.DEV` is true and is not available in the production build.

### Midnight wallet profile-flow status

Wallet-based profile creation, existing wallet-linked profile access, and Contact Mode writes are temporarily disabled.

The codebase retains the following integration modes for ongoing development:

```text
local-readonly
preprod-write
mainnet-write
```

However, neither `preprod-write` nor `mainnet-write` should currently be treated as a supported end-user profile flow.

A separate safety gate keeps the incomplete wallet flow disabled:

```env
VITE_ENABLE_MIDNIGHT_PROFILE_FLOW=false
```

Midnames `.night` review and resolution do not require this wallet flow.

### Federated-mainnet deployment status

The Contact Mode contract and wallet flow were previously implemented and tested on preprod with 1AM Wallet.

Work is now in progress to deploy the global Contact Mode contract on Midnight federated mainnet.

The current blocker is the Midnight federated-mainnet DUST generator. It is not currently generating the DUST required for the terminal-created deployment wallet to fund and submit the mainnet contract deployment transaction.

The project is investigating ways to resolve the DUST-generation issue before completing the global mainnet deployment and re-enabling wallet-linked profile access.

Until that is resolved:

- new wallet-linked profile creation is unavailable;
- existing wallet-linked profile access is unavailable;
- Contact Mode writes are unavailable;
- mainnet wallet functionality should not be treated as production-ready.

This deployment blocker does not affect the independently reviewable Midnames `.night` integration.

## Repository structure

```text
artifacts/nightforce-directory/
  React and Vite frontend
  Midnames integration
  Midnight wallet services
  Contact Mode and Profile Proof packages

artifacts/nightforce-worker/
  Cloudflare Worker API
  D1 and R2 bindings

lib/db/
  Shared D1 schema and migrations

scripts/
  Workspace validation scripts
  Midnight runtime singleton check
```

Important project paths:

```text
artifacts/nightforce-directory/src/components/MidnamesProfileButton.tsx
artifacts/nightforce-directory/src/components/MidnamesModal.tsx
artifacts/nightforce-directory/src/pages/MidnamesTest.tsx
artifacts/nightforce-directory/src/services/midnames.ts
artifacts/nightforce-directory/src/services/midnamesConfig.ts
artifacts/nightforce-worker/src/index.ts
lib/db/drizzle/
```

## Prerequisites

The current development environment has been tested with:

```text
Node.js 22.21.1
pnpm 9.15.0
Wrangler 4.x
```

The root `package.json` pins:

```text
pnpm@9.15.0
```

Use pnpm rather than npm or Yarn.

## Fresh-clone setup

Clone the repository and enter it:

```bash
git clone https://github.com/greenpython9/nightforce-directory.git
cd nightforce-directory
```

Install dependencies from the workspace root:

```bash
pnpm install
```

The project uses a pnpm workspace. Normal pnpm package symlinks are supported and should not be manually removed.

Create the frontend environment file:

```bash
cp artifacts/nightforce-directory/.env.example \
  artifacts/nightforce-directory/.env
```

The committed example uses safe defaults:

```env
PORT=5173
BASE_PATH=/

VITE_NIGHTFORCE_API_BASE_URL=http://127.0.0.1:8787

VITE_FEATURE_MIDNAMES=true
VITE_ENABLE_INTERACTIVE_MIDNAMES=true

VITE_ENABLE_MIDNIGHT_PROFILE_FLOW=false
VITE_NIGHTFORCE_APP_MODE=local-readonly
VITE_MIDNIGHT_NETWORK_ID=undeployed
```

Restart Vite whenever environment values are changed.

## Local Cloudflare Worker and D1

The frontend uses the local Worker API at:

```text
http://127.0.0.1:8787
```

Apply all D1 migrations to Wrangler's isolated local database:

```bash
pnpm db:migrate:local
```

This command uses:

```bash
wrangler d1 migrations apply nightforce-db --local
```

The `--local` flag is important. It does not modify the production Cloudflare D1 database.

Do not replace it with `--remote` unless you intentionally want to operate on the hosted Cloudflare database.

Migration files are stored in:

```text
lib/db/drizzle/
```

The current migrations include the `night_domain` profile field.

### Worker development variables

The public health and directory endpoints can be reviewed without committing secrets.

An example file is available at:

```text
artifacts/nightforce-worker/.dev.vars.example
```

For owner/admin development, copy it to:

```bash
cp artifacts/nightforce-worker/.dev.vars.example \
  artifacts/nightforce-worker/.dev.vars
```

Never commit real passwords, session secrets, wallet credentials, or deployment API keys.

## Start the project

The Worker and frontend run as two separate local processes.

### Terminal 1 — Worker

From the workspace root:

```bash
pnpm dev:worker
```

Wrangler should start at:

```text
http://localhost:8787
```

Verify the health endpoint:

```bash
curl http://127.0.0.1:8787/api/healthz
```

Expected response:

```json
{ "status": "ok", "service": "nightforce-worker" }
```

Verify the public directory endpoint:

```bash
curl http://127.0.0.1:8787/api/nightforce/directory
```

A fresh local D1 database may have no persisted profiles. Development mock profiles are included by the frontend so the directory and Midnames surfaces remain reviewable.

### Terminal 2 — Frontend

From the workspace root:

```bash
pnpm dev:directory
```

Vite should start at:

```text
http://localhost:5173
```

Main local routes:

```text
http://localhost:5173/
http://localhost:5173/directory
http://localhost:5173/wallet
http://localhost:5173/dev/midnames-test
```

## Verify the Midnames integration

Make sure the frontend `.env` contains:

```env
VITE_FEATURE_MIDNAMES=true
VITE_ENABLE_INTERACTIVE_MIDNAMES=true
```

Start the frontend and visit:

```text
http://localhost:5173/dev/midnames-test
```

The page should show:

- domain: `12345.night`;
- network: `preprod`;
- interactive mode: `enabled`;
- a directory-style profile card;
- an `Open holographic card` button;
- an `Open full domain profile` button.

Click both buttons.

Expected behavior:

1. The Midnames modal opens.
2. The modal identifies the network as preprod.
3. The holographic card loads through the real Midnames SDK.
4. The full domain profile loads through the real Midnames SDK.
5. A safe error state is shown instead of crashing the page if the external SDK request fails.

The normal development directory also includes a mock profile for `Aisha Rahman` with:

```text
12345.night
```

Visit:

```text
http://localhost:5173/directory
```

Find Aisha Rahman and click the `.night` label on the profile card.

## Worker-offline development behavior

During development, the directory and homepage fall back to local mock profiles if the Worker is not running.

To test:

1. Start the frontend.
2. Keep the Worker stopped.
3. Visit `/directory` and `/`.
4. Confirm that development profiles remain visible.
5. Confirm that Aisha Rahman's `.night` button remains interactive.

Production builds do not append these development mocks.

## Environment variables

### Frontend

| Variable                                            | Default                                | Purpose                                   |
| --------------------------------------------------- | -------------------------------------- | ----------------------------------------- |
| `PORT`                                              | `5173`                                 | Vite development and preview port         |
| `BASE_PATH`                                         | `/`                                    | Vite base path                            |
| `VITE_NIGHTFORCE_API_BASE_URL`                      | `http://127.0.0.1:8787` in development | Worker API base URL                       |
| `VITE_FEATURE_MIDNAMES`                             | enabled unless set to `false`          | Enables Midnames surfaces                 |
| `VITE_ENABLE_INTERACTIVE_MIDNAMES`                  | `false` when omitted                   | Enables clickable Midnames modals         |
| `VITE_ENABLE_MIDNIGHT_PROFILE_FLOW`                 | `false`                                | Temporary wallet-profile-flow safety gate |
| `VITE_NIGHTFORCE_APP_MODE`                          | `local-readonly`                       | Wallet integration mode                   |
| `VITE_MIDNIGHT_NETWORK_ID`                          | derived from app mode                  | Midnight network selection                |
| `VITE_ENABLE_VISITOR_ACTIVITY_LOGGING`              | `false`                                | Optional visitor activity logging         |
| `VITE_PROFILE_PROOF_STATE_URL`                      | mode-dependent local URL               | Optional Profile Proof state endpoint     |
| `VITE_CONTACT_MODE_GLOBAL_PREPROD_CONTRACT_ADDRESS` | unset                                  | Optional frontend preprod fallback        |
| `VITE_CONTACT_MODE_GLOBAL_MAINNET_CONTRACT_ADDRESS` | unset                                  | Optional frontend mainnet fallback        |

Midnames is deliberately hardcoded to preprod in application code. It is not controlled by the wallet network setting.

### Worker

Optional local Worker variables include:

```text
ADMIN_OWNER_EMAIL
ADMIN_OWNER_PASSWORD
ADMIN_SESSION_SECRET
CONTACT_MODE_GLOBAL_PREPROD_CONTRACT_ADDRESS
CONTACT_MODE_GLOBAL_MAINNET_CONTRACT_ADDRESS
```

Do not commit real values.

## Midnight runtime singleton check

The frontend uses Midnight runtime packages that must resolve to a single physical installation.

Run:

```bash
pnpm check:midnight-runtime
```

Normal pnpm workspace symlinks are allowed when they point to the same physical package.

The check fails only when different workspace packages resolve the same Midnight runtime dependency to genuinely separate physical installations.

The normal frontend commands run this check automatically through `predev` and `prebuild`.

## Validation commands

Run the frontend TypeScript check:

```bash
pnpm --filter @workspace/nightforce-directory typecheck
```

Run all workspace type checks:

```bash
pnpm typecheck
```

Build the frontend:

```bash
pnpm --filter @workspace/nightforce-directory build
```

Build the full workspace:

```bash
pnpm build
```

Preview the frontend production build:

```bash
pnpm --filter @workspace/nightforce-directory serve
```

## Production-route verification

The Midnames test route is development-only.

After creating a production build, `/dev/midnames-test` should not render the development test page.

Development mock profiles should also not be appended to production directory responses.

## Troubleshooting

### Vite previously required `PORT` and `BASE_PATH`

The Vite config now loads `.env` values and provides safe defaults:

```text
PORT=5173
BASE_PATH=/
```

### Directory is empty

Check that the Worker is running:

```bash
pnpm dev:worker
```

Then verify:

```bash
curl http://127.0.0.1:8787/api/healthz
curl http://127.0.0.1:8787/api/nightforce/directory
```

During development, local mock profiles should still render if the Worker is offline.

### `.night` text appears but is not clickable

Confirm:

```env
VITE_ENABLE_INTERACTIVE_MIDNAMES=true
```

Then restart Vite.

### Midnames modal shows a safe error

The `.night` value can still render even when an SDK or preprod service request fails. Check the browser console and confirm the Midnames preprod service is reachable.

### Wallet profile access is unavailable

This is currently expected.

The repository defaults to:

```env
VITE_ENABLE_MIDNIGHT_PROFILE_FLOW=false
```

Do not enable the wallet-profile flow for end users until the federated-mainnet global contract deployment and full integration testing are complete.

### Wrangler reports no migrations to apply

This means the isolated local D1 database already has all available migrations.

## Security

Never commit:

```text
.env
.dev.vars
wallet seed phrases
private keys
deployment API keys
Cloudflare secrets
admin passwords
session secrets
```

Only these example files are intended to be committed:

```text
artifacts/nightforce-directory/.env.example
artifacts/nightforce-worker/.dev.vars.example
```

## License

MIT
