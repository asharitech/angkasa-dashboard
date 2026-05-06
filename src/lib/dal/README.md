# DAL Guidelines

Use `@/lib/dal` for read/query access from pages, route handlers, and APIs.

## Rules

- Always get Mongo collections through `getCollections()` from `dal/context.ts`.
- Do not call `getDb()` + `dbCollections()` directly from UI pages.
- **Collection inventory:** `DB_COLLECTION_NAMES` in `src/lib/db/collections.ts` must list every key returned by `dbCollections()`. Adding a collection requires updating `dbCollections`, `DB_COLLECTION_NAMES`, `schema.ts`, and new DAL/actions — see `docs/mongodb-collections.md`.
- Keep one concern per module (`accounts.ts`, `obligations.ts`, `users.ts`, etc.).
- Keep Mongo/BSON serialization concerns in `dal/serialize.ts`.
- Export public DAL APIs through `dal/index.ts`.

## Migration note

Legacy `@/lib/data` now re-exports `@/lib/dal` for compatibility. New code should import from `@/lib/dal` directly.
