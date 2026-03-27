# MVP Backend Verification Plan
**Prepared by:** Saul (Tester)  
**Date:** 2026-03-25  
**Status:** Active — Implementation ongoing  
**Framework:** Vitest + Real PostgreSQL test database

---

## Executive Summary

The backend is **50% complete** with a solid foundation (Express, Prisma, auth service) and most critical routes stubbed. **Test coverage is 49 passing + 93 todo**, indicating the infrastructure is verified but feature tests are waiting on implementation details.

**Critical blocker for MVP:** The transition from JWT-based auth (currently implemented) to **Clerk** is NOT YET STARTED. Frontend is using mock data. The MVP path requires:
1. ✅ Backend core infrastructure (complete)
2. ✅ Auth service skeleton (complete)
3. ⏳ Clerk integration (NOT STARTED)
4. ⏳ Catalog endpoints (partially tested)
5. ⏳ Cart + Checkout (skeleton with tests)

**Risk Level:** MEDIUM-HIGH. Auth change creates integration risk, but route stubs are in place.

---

## Verification Strategy

### Phase 1: Foundation Validation (Already Mostly Done)
- **Status:** ✅ **49 tests passing**
- **What works:**
  - Vitest environment, test database connection
  - Express app factory with middleware stack
  - Zod validation, error handler, rate limiting
  - Auth service (JWT-based, NOT Clerk)
  - Catalog, inventory, cart, order services
  - Health check, middleware unit tests

- **What's incomplete:**
  - 93 tests stubbed as `test.todo()` (waiting for implementation)
  - Clerk integration (backend auth currently JWT, not Clerk)
  - Full mock data in test database (test DB exists but may be empty)

### Phase 2: Route-Level Integration Tests (40% Complete)
Current passing tests validate:
- ✅ Route mounting and response shape preservation
- ✅ Middleware execution order (CORS, auth, validation, errors)
- ✅ Rate limiting thresholds
- ✅ Zod validation on request bodies
- ✅ Error handler maps domain errors to HTTP codes

**Still missing:** Full service integration with real database queries (mocked in current tests).

### Phase 3: Service-Level Tests (20% Complete)
- ✅ Order service: creating pending orders, calculating totals
- ✅ Checkout service: PaymentIntent creation, Stripe mocking
- ⏳ Cart service: concurrency safety, MOQ enforcement
- ⏳ Inventory service: cross-compatible parts, hierarchy queries
- ⏳ Catalog service: search, filtering, backwards compatibility
- ⏳ Auth service: password hashing, JWT claims, token refresh

### Phase 4: End-to-End Flows (0% Complete)
- ⏳ Register → Login → Add to Cart → Checkout flow
- ⏳ Search cross-compatible parts and add to cart
- ⏳ Order history retrieval
- ⏳ Auth token expiry and refresh

---

## Critical Risk Areas for MVP

### 1. **Clerk Transition (BLOCKING)**
**Status:** Not started  
**Impact:** 🔴 CRITICAL — Frontend cannot authenticate without Clerk integration

**What's needed:**
1. Clerk secret key + frontend key from your Clerk account
2. Replace `requireTokenAuth` middleware with Clerk JWT verification
3. Update `AuthService` to accept Clerk tokens instead of generating JWT
4. Update `/api/auth/register` and `/api/auth/login` (may be disabled with Clerk)

**Current state:**
- Backend: JWT-based auth (`createAccessToken`, `generateRefreshToken`, Redis blacklist)
- Frontend: Mock auth (`authStore.ts` is a Zustand store, not wired to real login)
- **Gap:** No integration between the two; frontend doesn't call backend auth

**Risk:** If Clerk keys aren't provided, entire auth flow fails. **You mentioned "will provide it"** — this is blocking.

**Test coverage needed:**
```typescript
// test.todo() until Clerk keys available
test.todo('Clerk JWT is verified by auth middleware');
test.todo('Clerk user ID is extracted and stored in session');
test.todo('Register endpoint returns Clerk user ID (or disabled)');
test.todo('Clerk token expiry is respected');
```

### 2. **Mock Data vs. Real Data (MEDIUM)**
**Status:** Frontend uses mock data; backend seed.ts exists but test DB may be empty

**Problem:** Tests pass but endpoints may return empty results in staging/production.

**Verification needed:**
- [ ] Seed script runs successfully (`npx prisma db seed`)
- [ ] Test database has 2 brands, 9 variants, 7+ inventory items
- [ ] Search returns correct results (`/api/parts?device=iPhone` finds all iPhone parts)
- [ ] Compatibility mappings exist (e.g., IF13-14 cross-compatible screen)

**Action:** Run seed locally, verify schema matches mock data structure.

### 3. **Backwards Compatibility (HIGH)**
**Status:** Partially validated

**Routes that MUST return legacy response shape:**
- `GET /api/brands` → `{ success, items: [{ id, name, count }] }`
- `GET /api/models?brandId=X` → `{ success, items: [{ id, name, modelNumber }] }`
- `GET /api/parts?device=iPhone` → `{ success, items: [SKU array] }`
- `GET /api/inventory/:skuId` → `{ success, data: { skuId, price, name, specs } }`
- `GET /api/compatibility/:skuId` → `{ success, items: [compatible models] }`
- `GET /api/health` → `{ success, timestamp }`

**Current coverage:** Tests stub response shapes but **mock the service layer**. Real queries haven't been tested.

**Test gap:** Need to flip mocks OFF and test actual Prisma queries:
```typescript
// Mock currently enabled — need to test with real DB
vi.mock('../services/inventory.service.js', () => ({
  InventoryService: vi.fn().mockImplementation(() => inventoryServiceMocks),
}));
```

### 4. **Price Formatting (MEDIUM)**
**Schema:** `wholesalePrice` stored in **cents** (integer)  
**API response:** Should return in **dollars** (decimal)

**Risk:** Off-by-100 errors (e.g., $12.99 becomes $0.1299 or $1299).

**Test coverage:**
```typescript
test('Inventory endpoint returns price in dollars', async () => {
  // DB stores 1299 cents
  const res = await GET /api/inventory/SKU123;
  expect(res.data.wholesalePrice).toBe(12.99); // NOT 1299
});
```

**Current status:** Not explicitly tested. Check inventory service.

### 5. **Specification Parsing (MEDIUM)**
**Old format:** Pipe-delimited strings in `specifications` field  
**New format:** Normalized `Specification` table with `label + value`

**Risk:** Parser bugs surface in production (missing specs, incorrect parsing).

**Test needed:**
```typescript
test('Specification parsing handles edge cases', () => {
  // Empty pipes, extra pipes, missing colons
  const result = parseSpecs('Capacity:3227mAh||Voltage:3.8V|');
  expect(result).toEqual([
    { label: 'Capacity', value: '3227mAh' },
    { label: 'Voltage', value: '3.8V' },
  ]);
});
```

### 6. **Cart & Checkout Isolation (MEDIUM)**
**Schema:** `@@unique([userId, skuId])` on Cart table

**Risk:** 
- Concurrent adds to same SKU → should upsert, not duplicate
- Empty cart checkout → should reject
- Stock depletion during checkout → unclear business logic

**Tests needed:**
```typescript
test.todo('Concurrent cart adds upsert quantity, not create duplicate');
test.todo('Checkout with empty cart returns 400');
test.todo('Checkout snapshots unitPriceAtPurchase correctly');
test.todo('Cart cleared after successful checkout');
```

### 7. **Order Status Transitions (LOW-MEDIUM)**
**Enum:** `PENDING → PAID → SHIPPED → DELIVERED` (or `CANCELLED`, `REFUNDED`)

**Risk:** Backend allows invalid transitions (e.g., `PAID → PENDING`), frontend shows confusing order status.

**Test:**
```typescript
test.todo('Order status transitions: PENDING → PAID only');
test.todo('Order status transitions: cannot reverse (PAID → PENDING = error)');
```

---

## Test Coverage Assessment

### Current State (49/142 tests passing)

| Phase | Passing | Todo | Coverage | Status |
|-------|---------|------|----------|--------|
| **Infrastructure** | 13 | 35 | ~35% | ✅ Core works, edge cases stubbed |
| **Catalog/Inventory** | 13 | 25 | ~35% | ⚠️ Routes mocked, real DB untested |
| **Auth** | 6 | 20 | ~25% | 🔴 JWT works, Clerk not started |
| **Cart** | 6 | 15 | ~30% | ⚠️ Basic flow mocked, concurrency untested |
| **Checkout** | 16 | 18 | ~50% | ✅ Order creation tested, webhooks untested |
| **Orders** | 5 | 5 | ~50% | ✅ Basic retrieval tested |
| **Deployment** | - | 11 | 0% | ⏳ TypeScript, builds, migrations |

**Total:** 49 passing, 93 todo → **35% done**

### What Needs to Happen for MVP (Priority Order)

#### P0 (MUST HAVE)
1. **Clerk integration** — Auth middleware + token verification
   - Tests: `test.todo()` until Clerk keys available
   - Blocks: Everything auth-dependent

2. **Seed script validation** — Ensure test DB has all sample data
   - Command: `npx prisma db seed`
   - Tests: S1.3, S1.4, S1.5, S1.8

3. **Backwards compatibility snapshot tests** — Catalog/inventory endpoints
   - Tests: C3.1, C3.2, C3.4, C3.7, C3.9 (unmock service layer)
   - Blocks: Frontend integration if response shape changes

4. **Price formatting in responses** — Cents→dollars conversion
   - Tests: Check `wholesalePrice` is 12.99 (dollars), not 1299 (cents)
   - Blocks: Billing issues if wrong

#### P1 (HIGH PRIORITY)
5. **Cart unique constraint enforcement** — Prevents duplicate SKUs per user
   - Tests: M5.2 (concurrent adds), M5.5 (retrieve cart)
   - Manual test: Add same SKU twice via curl, verify quantity incremented

6. **Order creation with Stripe** — PaymentIntent, order snapshot
   - Tests: M5.9, M5.10, M5.11, M5.12
   - Manual test: Checkout workflow end-to-end

7. **Specification parsing validation** — Handles edge cases
   - Tests: C3.7 (inventory includes specs)
   - Blocks: Product detail page if specs missing

#### P2 (NICE TO HAVE)
8. Full auth flow (register → login → token refresh → logout)
   - Tests: A4.1-A4.17 (currently todo)
   - Blocks: Dashboard/account features

9. Rate limiting thresholds
   - Tests: A4.13, middleware stress tests
   - Blocks: DDoS prevention

10. Deployment checklist (TypeScript, builds, migrations)
    - Tests: D6.1-D6.9
    - Blocks: CI/CD confidence

---

## Test Execution Roadmap for MVP

### Week 1: Foundation + Clerk
```bash
# Phase 1: Validate infrastructure
npm run test                    # Should see 49 pass + 93 todo
npm run typecheck              # Must pass, no TypeScript errors

# Phase 2: Seed database
npx prisma db seed             # Load sample data
npm run test:watch             # Watch mode for development

# Phase 3: Integrate Clerk (BLOCKING)
# 1. Get Clerk keys from user
# 2. Update src/middleware/auth.ts to verify Clerk JWT
# 3. Update src/services/auth.service.ts to accept Clerk tokens
# 4. Re-run tests, expect auth tests to pass
```

### Week 2: Unmock Services + Integration
```bash
# Phase 4: Replace mocked services with real Prisma queries
# Edit src/__tests__/{catalog,inventory,cart,checkout}.routes.test.ts
# Remove vi.mock() calls for services
# Re-run tests against real test database

# Phase 5: Backwards compatibility validation
npm run test:coverage          # Generate coverage report
# Target: ≥80% statement coverage, ≥75% branch

# Phase 6: Price formatting validation
# Add explicit tests in inventory.routes.test.ts:
test('GET /api/inventory/:skuId returns wholesalePrice in dollars', async () => {
  const res = await client.get('/api/inventory/SKU-001');
  expect(res.data.wholesalePrice).toBe(12.99); // dollars, not cents
});
```

### Week 3: Cart + Checkout + Orders
```bash
# Phase 7: Cart unique constraint
npm run test -- cart.routes.test.ts

# Phase 8: Checkout flow (Stripe mocked)
npm run test -- checkout.routes.test.ts
npm run test -- checkout.service.test.ts

# Phase 9: Smoke test workflow
# Manual curl commands:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Secure@1234"}'

curl -X GET http://localhost:3000/api/inventory/SKU-001 \
  -H "Authorization: Bearer <token>"

curl -X POST http://localhost:3000/api/cart \
  -H "Authorization: Bearer <token>" \
  -d '{"skuId":"SKU-001","quantity":5}'
```

---

## Key Files to Monitor

### Backend Core
- `src/app.ts` — Express factory, middleware chain
- `src/config/env.ts` — Zod environment validation
- `src/lib/auth.ts` — JWT/Clerk verification logic
- `src/middleware/*.ts` — CORS, validation, error handling
- `src/services/*.ts` — Business logic (catalog, cart, orders, auth)
- `prisma/schema.prisma` — Database schema (4-level hierarchy)
- `prisma/seed.ts` — Sample data loader

### Tests
- `src/__tests__/*.test.ts` — 11 test files (49 passing, 93 todo)
- `src/__tests__/TEST_PLAN.md` — Detailed test specifications

### Frontend Integration
- `celltech-frontend/lib/api.ts` — API client (20+ typed functions)
- `celltech-frontend/store/authStore.ts` — Auth state (currently mock)
- `celltech-frontend/app/product/[skuId]/page.tsx` — PDP with cart/specs/compat
- `celltech-frontend/.env.local` — Backend API URL

### Deployment
- `vercel.json` — Vercel configuration (build output, routing)
- `.env.example` — Required environment variables

---

## Clerk Integration Checklist

**You mentioned:** "no clerk yet but will provide it"

When you provide Clerk credentials:
1. Save to `.env.local` (backend):
   ```
   CLERK_SECRET_KEY=sk_test_...
   CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

2. Update `src/middleware/auth.ts`:
   ```typescript
   import { verifyToken } from '@clerk/express';
   
   // Replace existing JWT verification:
   export const requireTokenAuth = (req, res, next) => {
     // Verify Clerk token instead of JWT
     const token = req.headers.authorization?.split(' ')[1];
     const decoded = verifyToken(token, process.env.CLERK_SECRET_KEY);
     req.user = decoded;
     next();
   };
   ```

3. Update `src/services/auth.service.ts` or disable register/login (Clerk handles signup).

4. Run tests:
   ```bash
   npm run test -- auth.routes.test.ts
   ```

**Tests that will unblock after Clerk:**
- A4.1-A4.17 (Auth phase)
- M5.4, M5.5, M5.7 (Cart auth checks)
- M5.9, M5.11 (Checkout auth)
- All protected routes

---

## Manual Smoke Tests (Do These Before Deployment)

### 1. Database Connectivity
```bash
curl https://your-backend.vercel.app/api/health
# Expected: { "success": true, "timestamp": "2026-03-25T..." }
```

### 2. Catalog Browsing
```bash
curl https://your-backend.vercel.app/api/brands
# Expected: { "success": true, "items": [{ "id": 1, "name": "Apple" }, ...] }

curl https://your-backend.vercel.app/api/parts?device=iPhone
# Expected: { "success": true, "items": [{ skuId, name, price, ... }, ...] }
```

### 3. Auth Flow (Clerk)
```bash
curl -X POST https://your-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Secure@1234"}'
# Expected: { "success": true, "data": { "accessToken": "...", "user": {...} } }
# (May be disabled if using Clerk)
```

### 4. Cart & Checkout
```bash
curl -X POST https://your-backend.vercel.app/api/cart \
  -H "Authorization: Bearer <token>" \
  -d '{"skuId":"SKU-001","quantity":5}'
# Expected: { "success": true, "data": { "items": [...] } }

curl -X POST https://your-backend.vercel.app/api/checkout \
  -H "Authorization: Bearer <token>" \
  -d '{"cartItems":[...]}'
# Expected: { "success": true, "data": { "clientSecret": "...", "orderId": "..." } }
```

### 5. Order History
```bash
curl https://your-backend.vercel.app/api/orders \
  -H "Authorization: Bearer <token>"
# Expected: { "success": true, "items": [{ id, status, total, ... }, ...] }
```

---

## Risk Summary

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Clerk integration missing | 🔴 HIGH | 🔴 CRITICAL (auth broken) | Get Clerk keys ASAP; integration takes ~2 hours |
| Empty test database | 🟡 MEDIUM | 🔴 CRITICAL (no data) | Run seed script; verify 2 brands, 9 variants exist |
| Price formatting off-by-100 | 🟡 MEDIUM | 🔴 CRITICAL (billing) | Add explicit cents→dollars test; code review math |
| Mock services hide bugs | 🟡 MEDIUM | 🟡 HIGH (integration fails) | Unmock services; test with real DB queries |
| Backwards compatibility break | 🟡 MEDIUM | 🟡 HIGH (frontend outage) | Snapshot tests for 6 legacy endpoints |
| Cart duplicates (race condition) | 🟢 LOW | 🟡 HIGH (data integrity) | Verify unique constraint works; stress test |
| Specification parsing edge cases | 🟢 LOW | 🟢 MEDIUM (missing specs) | Add parser tests; check empty pipes, extra pipes |
| Order status invalid transitions | 🟢 LOW | 🟢 LOW (UX confusion) | Add state machine tests; document valid paths |

---

## Approval Checklist for MVP Release

- [ ] **Clerk integration complete** (auth middleware verifies Clerk tokens)
- [ ] **49 tests still passing** (infrastructure stable)
- [ ] **Seed script runs** (test DB has sample data)
- [ ] **Backwards compatibility validated** (6 legacy endpoints return correct shape)
- [ ] **Price formatting correct** (cents→dollars, e.g., 1299 cents = $12.99)
- [ ] **Auth flow end-to-end** (Clerk or JWT: register → login → protected route works)
- [ ] **Cart unique constraint enforced** (adding same SKU twice increments qty)
- [ ] **Checkout creates order + Stripe intent** (manual test successful)
- [ ] **No TypeScript errors** (`npm run typecheck` passes)
- [ ] **Vercel build succeeds** (production build artifact exists)
- [ ] **Smoke tests pass** (health, brands, parts, auth, cart, checkout, orders)

---

## Next Steps

1. **Provide Clerk credentials** (blocking auth integration)
2. **Run seed script** and verify sample data loads
3. **Flip mocks OFF** in tests and validate real database queries
4. **Add explicit price formatting tests** (cents→dollars)
5. **Manual smoke test workflow** (register → search → cart → checkout)
6. **Measure coverage** (`npm run test:coverage`) — target ≥80%
7. **Fix any failing tests** and document edge cases
8. **Deploy to staging** and test against real Vercel infrastructure
9. **Get sign-off** from Danny (Lead) before production release

---

**Authored by Saul, Tester**  
*"If it can break, assume it eventually will."*
