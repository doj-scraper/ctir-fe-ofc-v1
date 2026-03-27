# Project Context

- **Owner:** Copilot
- **Project:** Modern refactor of an ecommerce platform for a wholesale distributor of cellphone repair parts, using Smart SKU and a relational database. The codebase is currently a monorepo and will eventually split into separate frontend and backend repositories.
- **Stack:** Strict TypeScript, Next.js, Tailwind CSS, TanStack Query, Zustand, Prisma, Zod, Clerk or NextAuth 5, Stripe, Neon/PostgreSQL, tRPC, Resend, S3, GitHub Actions, Vercel, Vitest, React Testing Library, Playwright or Jest, PostgreSQL full-text search, Turbopack.
- **Created:** 2026-03-24T13:05:26Z

## Learnings

- Storefront work centers on ecommerce pages, checkout surfaces, and client state.
- All `.squad/` paths resolve from the team root provided by the Coordinator.
- The shared decision log stays append-only and is merged through Scribe.

---

### 2026-03-25: Frontend-to-Backend API Contract Audit

**Scope:** Complete mapping of what the frontend requires from the backend for MVP.

**Key Findings:**

1. **Frontend is fully functional with mock data** — all pages work, but no real backend wiring except:
   - Product detail pages call `getPartDetails()` for real data
   - Inventory page calls brands/models endpoints
   - Everything else (auth, cart, checkout, quote) is mocked

2. **10 endpoints already exist in backend:**
   - `/api/health`, `/api/brands`, `/api/models`, `/api/inventory`, `/api/inventory/:skuId`, `/api/inventory/model/:id`, `/api/parts?device=...`, `/api/compatibility/:skuId`
   - All return expected shapes for existing UI

3. **8 critical endpoints still TODO for MVP:**
   - Cart: `POST/GET/DELETE /api/cart` + `POST /api/checkout`
   - Orders: `GET /api/orders`, `GET /api/orders/:id`
   - Auth: `POST /api/auth/{register,login,logout,refresh}`
   - Quote: `POST /api/quote`

4. **Data contracts are rigid — prices in cents, specs comma-separated, MOQ=5:**
   - Frontend price display: `$${price / 100}.toFixed(2)`
   - Specs parser: `split(',').split(':')`
   - Stock display: `> 10` = "In Stock", `> 0` = "Low", `0` = "Out"

5. **Auth is completely mocked — switching from NextAuth to Clerk:**
   - `useAuthStore` has TODO comments for API calls
   - Navigation shows hardcoded "Login" (not wired)
   - Cart/checkout/dashboard all assume JWT in header

6. **Cart is client-side only (Zustand) — no server persistence yet:**
   - `AddToCartButton` → `useCartStore.addItem()` (local)
   - No sync to `/api/cart` until backend is ready
   - Needs to sync on add/remove/update

7. **Gaps discovered:**
   - No pagination on `/api/inventory`
   - No search/filter params (only device search)
   - No device hierarchy endpoint for sidebar
   - No image URLs in responses (using placeholders)
   - Quote form has no backend

**Artifacts:**
- Full spec written to `.squad/decisions/inbox/rusty-backend-contracts.md`
- All endpoints, shapes, and assumptions documented
- 10 questions for Linus flagged

**Next:** Backend implementation can proceed with confidence that these contracts will work for the UI.

**Time spent:** ~2 hours audit (non-invasive, no code edits)

---

### 2026-03-26: System Health Dashboard UI

**Scope:** Built admin-only health dashboard at `/admin/health`.

**Files created/modified:**
- `celltech-frontend/lib/api.ts` — Added `ServiceHealth`, `SystemHealth` interfaces and `fetchSystemHealth()` hitting `/api/health/detailed`
- `celltech-frontend/app/admin/layout.tsx` — Minimal admin layout with back-link to storefront, dark theme, no nav/footer
- `celltech-frontend/app/admin/health/page.tsx` — Client component with auto-refresh (30s), manual refresh, loading skeletons, error handling

**Design decisions:**
- Used `gray-950`/`gray-800` dark admin theme (intentionally distinct from storefront `ct-bg` tokens — this is internal tooling)
- Status dots use CSS `animate-pulse` for yellow/red states
- Latency color thresholds: green < 200ms, yellow 200–500ms, red > 500ms
- Graceful degradation: shows "last known state" toast when latest fetch fails but prior data exists
- 2×2 grid on desktop, single column on mobile
- `font-mono` for latency values (uses project's IBM Plex Mono)

**Patterns established:**
- Admin pages live under `app/admin/` with their own layout (no storefront nav/footer)
- Admin layout uses `sticky top-0` header with breadcrumb-style navigation
- Health types exported from `lib/api.ts` alongside existing API functions
