# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

---

## Nightforce Directory (artifacts/nightforce-directory)

Proof-of-life prototype for an unofficial Midnight Nightforce ambassador directory.

### Routes

- `/` — Landing page with wallet connect, status badge, and nav links
- `/directory` — Public searchable/filterable ambassador directory
- `/request-verification` — Submit verification request (wallet required)
- `/admin/review` — Admin-only review panel (wallet `admin-wallet-001` only)
- `/my-profile` — Profile editor with visibility controls (approved wallets only)
- `/profile/:publicId` — Public profile page (shows only disclosed data)

### Mock Wallets (for testing)

- `admin-wallet-001` → Admin access
- `member-wallet-001` → Test member A
- `member-wallet-002` → Test member B
- `member-wallet-003` → Seeded approved (public profile, ShadowLynx)
- `member-wallet-004` → Seeded approved (anonymous profile, NeonRaven)
- `member-wallet-005` → Seeded rejected (Cipher_X — hidden profile)
- `member-wallet-006` → Seeded pending request (Vesper)

### Key files to edit later

- **Real Midnight wallet integration**: `artifacts/nightforce-directory/src/services/walletService.ts`
  - Implement `MidnightWalletAdapter` class
  - Swap `createWalletService()` to return it
  - Install `@midnight-ntwrk/dapp-connector-api`

- **Real verification backend**: `artifacts/nightforce-directory/src/lib/storage.ts`
  - Replace `loadStore/saveStore/updateStore` with real API calls
  - Add corresponding backend routes to `artifacts/api-server/src/routes/`

- **Homepage map**: `artifacts/nightforce-directory/src/pages/Landing.tsx`
  - Install a map library (e.g. `maplibre-gl` or `react-map-gl`)
  - Add country geolocation to `ProfileData` type
  - Pull public profiles with location from `getAllPublicProfiles()`

### Data model

All state is in `localStorage` under key `nightforce_store` (type `AppStore`):
- `verificationRequests[]` — Requests from wallets wanting verification
- `profiles[]` — Private profile data (raw, un-filtered)
- `visibilitySettings[]` — Visibility and field-level disclosure per wallet
- `approvedWallets[]` — List of wallet IDs that have been approved

Public pages derive from `derivePublicProfile()` in `src/lib/publicProfile.ts` — this is the single source of truth for what gets shown publicly.
