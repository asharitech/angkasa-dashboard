# MongoDB collections (angkasa-dashboard)

This file is versioned with the app so collection inventory stays aligned with the DAL.

## Source of truth (code)

| What | Where |
|------|--------|
| Typed `db.collection(...)` accessors | `src/lib/db/collections.ts` — `dbCollections()`, **`DB_COLLECTION_NAMES`**, **`DbCollectionName`** |
| Document / insert shapes | `src/lib/db/schema.ts` |
| Per-request Mongo handle | `getCollections()` from `src/lib/dal/context.ts` |

**Rule:** Pages, route handlers, and server actions should use `getCollections()` (or DAL modules that call it). Avoid `getDb()` + string collection names except the admin raw API/actions, which validate against `ADMIN_RAW_COLLECTION_SET` (derived from `DB_COLLECTION_NAMES`).

## Physical collections (order = `DB_COLLECTION_NAMES`)

1. `accounts` — bank balances / metadata  
2. `entries` — all money movements  
3. `obligations` — pengajuan, loan, recurring  
4. `ledgers` — `laporan_op`, `sewa`, archived balance, etc.  
5. `numpang` — third-party funds parked in BRI  
6. `users` — dashboard auth  
7. `agenda` — tasks  
8. `documents` — R2-backed yayasan files  
9. `ompreng` — dapur ompreng stats  
10. `pemantauan` — site visits + temuan  
11. `budget_configs` — single doc `_id: "angkasa"` for `/anggaran`  
12. `email_notifs` — bank/email queue → entries  

## Adding or renaming a collection

1. Add types in `src/lib/db/schema.ts`.  
2. Register `db.collection<...>("name")` inside `dbCollections()` in `collections.ts`.  
3. Append the same string to **`DB_COLLECTION_NAMES`**.  
   - `satisfies ReadonlyArray<keyof DbCollections>` must still pass — if it errors, keys and the array are out of sync.  
4. **`ADMIN_RAW_COLLECTIONS`** and **`GET /api/health`** `db.*` counts update automatically (they iterate `DB_COLLECTION_NAMES`).  
5. Add DAL (`src/lib/dal/...`) and server actions as needed; export from `src/lib/dal/index.ts` when the API is public.

## Related docs

- Extended narrative + category rules: workspace `docs/angkasa-mongodb-schema.md` (sibling tree when using full `asharitech-angkasa` workspace).  
- DAL module conventions: `src/lib/dal/README.md`.
