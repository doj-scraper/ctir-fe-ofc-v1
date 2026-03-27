# Optional Cache Auth Guard

## Pattern

When authentication uses a cache-backed revocation list, keep the **identity check** and the **revocation check** separate.

- Always verify the signed token first.
- Only enforce revocation/blacklist checks when the cache dependency is configured and healthy enough to be authoritative.
- Do not block the entire authenticated surface in local or MVP environments just because an optional cache is absent.

## When to use it

- JWT auth with Redis/Upstash blacklists
- Temporary MVP auth before a future provider migration (for example Clerk)
- Local development setups where DB and app wiring matter more than revocation semantics

## CellTech Example

In `celltech-backend/src/middleware/auth.ts`, `requireAuth` now:

1. extracts the Bearer token,
2. verifies the JWT,
3. checks the blacklist only if `REDIS_URL` is configured,
4. attaches `req.user` / `req.auth`.

That keeps cart, checkout, and order routes usable before Redis is fully wired, while preserving blacklist enforcement in configured environments.
