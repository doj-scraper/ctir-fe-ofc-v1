## MVP Backend Test Execution Checklist

**Last Updated:** 2026-03-25 (Saul)  
**Status:** Foundation stable (49/142 tests passing)

### Pre-MVP Verification Checklist

- [ ] **BLOCKING: Clerk credentials provided**
  - Get: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`
  - Owner: Copilot (user)
  - Impact: Cannot proceed without this
  - Time: Async (waiting on user)

- [ ] **Seed script validates**
  - Command: `cd celltech-backend && npx prisma db seed`
  - Verify: 2 brands, 9 variants, 4 categories, 7+ inventory items exist
  - Owner: Linus (Backend Dev)
  - Time: ~5 minutes
  - Risk: If empty, all integration tests fail

- [ ] **Clerk integration implemented**
  - Update: `src/middleware/auth.ts` (JWT → Clerk verification)
  - Update: `src/services/auth.service.ts` (accept Clerk tokens)
  - Run: `npm run test -- auth.routes.test.ts`
  - Owner: Linus (Backend Dev)
  - Time: ~2 hours
  - Unblocks: 6 auth tests + all protected routes

- [ ] **Services unmocked in tests**
  - Files: `src/__tests__/{catalog,inventory,cart,checkout}.routes.test.ts`
  - Action: Remove `vi.mock()` calls, test with real Prisma
  - Owner: Saul (Tester) + Linus (Backend Dev)
  - Time: ~2 hours
  - Risk: Reveals real database query bugs
  - Unblocks: ~25 integration tests

- [ ] **Price formatting test added**
  - File: `src/__tests__/inventory.routes.test.ts`
  - Test: `GET /api/inventory/:skuId` returns price in dollars, not cents
  - Example: `1299 cents → $12.99`, not `1299`
  - Owner: Saul (Tester)
  - Time: ~30 minutes
  - Risk: Missing = billing errors in production

- [ ] **Backwards compatibility snapshot tests added**
  - File: `src/__tests__/backwards-compatibility.test.ts` (new)
  - Routes: `/api/brands`, `/api/models`, `/api/parts`, `/api/inventory/:id`, `/api/compatibility/:id`, `/api/health`
  - Test: Snapshot response shape, reject any changes
  - Owner: Saul (Tester)
  - Time: ~1 hour
  - Risk: Breaking change = frontend outage

- [ ] **Cart unique constraint stress-tested**
  - File: `src/__tests__/cart.routes.test.ts`
  - Test: Concurrent POSTs with same userId + skuId → quantity incremented, not duplicated
  - Owner: Saul (Tester)
  - Time: ~30 minutes
  - Risk: Race condition = duplicate cart items

- [ ] **All 49 infrastructure tests still passing**
  - Command: `npm run test`
  - Expected: 49 passed (no regressions)
  - Owner: Saul (Tester)
  - Time: ~10 seconds
  - Red flag: Any test flip = needs investigation

- [ ] **TypeScript compiles without errors**
  - Command: `npm run typecheck`
  - Expected: Clean exit
  - Owner: Linus (Backend Dev)
  - Time: ~30 seconds

- [ ] **Coverage measured and acceptable**
  - Command: `npm run test:coverage`
  - Target: ≥80% statements, ≥75% branch
  - Focus: Auth (100%), payments (100%), error handler (100%)
  - Owner: Saul (Tester)
  - Time: ~1 minute

### Smoke Tests (Manual, Before Staging)

- [ ] **Health endpoint responds**
  ```bash
  curl http://localhost:3000/api/health
  # Expected: { "success": true, "timestamp": "..." }
  ```

- [ ] **Brands endpoint returns data**
  ```bash
  curl http://localhost:3000/api/brands
  # Expected: { "success": true, "items": [{ "id": 1, "name": "Apple" }, ...] }
  ```

- [ ] **Parts search works**
  ```bash
  curl "http://localhost:3000/api/parts?device=iPhone"
  # Expected: { "success": true, "items": [...] }
  ```

- [ ] **Auth flow (Clerk)**
  ```bash
  # Replace with actual Clerk login endpoint
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"..."}'
  # Expected: { "success": true, "data": { "accessToken": "...", "user": {...} } }
  ```

- [ ] **Cart add-to-cart**
  ```bash
  curl -X POST http://localhost:3000/api/cart \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"skuId":"SKU-001","quantity":5}'
  # Expected: { "success": true, "data": { "items": [...] } }
  ```

- [ ] **Checkout creates order**
  ```bash
  curl -X POST http://localhost:3000/api/checkout \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{}'
  # Expected: { "success": true, "data": { "clientSecret": "...", "orderId": "..." } }
  ```

- [ ] **Order history retrieves orders**
  ```bash
  curl http://localhost:3000/api/orders \
    -H "Authorization: Bearer <token>"
  # Expected: { "success": true, "items": [{ id, status, total, ... }, ...] }
  ```

### Go/No-Go Gate for MVP Release

**ALL items below must be ✅ before merge to main:**

- [ ] Clerk integration complete and tested
- [ ] Seed script runs and populates test DB
- [ ] Services unmocked; real database queries tested
- [ ] 49 infrastructure tests passing (no regressions)
- [ ] Price formatting validated (cents→dollars correct)
- [ ] Backwards compatibility snapshot tests passing
- [ ] Cart unique constraint stress-tested
- [ ] No TypeScript errors
- [ ] Coverage ≥80% statements, ≥75% branch
- [ ] All 7 smoke tests passing
- [ ] No console errors or warnings in test output

**Sign-Off:**
- [ ] Saul (Tester) approves
- [ ] Linus (Backend Dev) approves
- [ ] Danny (Lead) approves
- [ ] Ready for staging deployment

---

### Test Command Reference

```bash
# Run all tests
npm run test

# Watch mode (development)
npm run test:watch

# Coverage report
npm run test:coverage

# TypeScript check
npm run typecheck

# Single test file
npm run test -- src/__tests__/auth.routes.test.ts

# Seed database
npx prisma db seed

# View seed output
npx prisma db seed --verbose

# Reset test database (if needed)
npx prisma migrate reset --skip-generate
```

---

**Maintained by:** Saul, Tester  
**Last Review:** 2026-03-25
