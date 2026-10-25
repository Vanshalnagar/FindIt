# 07 - Testing and Acceptance Plan

This is a plan. No results are recorded here. Record actual outcomes in the "Result" column only after running.

## 1. Strategy
| Level | Tool | Scope |
|-------|------|-------|
| Server API/integration | Vitest + supertest + mongodb-memory-server | Auth, items, claims, admin, validation, authorization, uploads |
| Client unit/component | Vitest (with React testing tools as configured in client) | Components, auth context, routing guards |
| Build check | `npm run build` | Client compiles |
| Manual acceptance | Browser | End-to-end flows per demo checklist |

Run all: `npm test` (root). Server only: `npm test --prefix server`. Client only: `npm test --prefix client`.

## 2. Automated test areas (planned)
- Auth: register success, duplicate email 409, weak password 400, login success/failure, logout, `/me` 401 and 200.
- Items: create valid, validation failures, future date, bad category, image type/size rejection, list pagination, filters, regex-escaped search, hidden exclusion, get by id (invalid id 404), update by owner/non-owner/admin, close, delete cascades claims, `/mine`.
- Claims: create on found open item, reject on lost item, own item 403, duplicate 409, proof visibility, accept auto-rejects others, non-pending cannot be changed, `/claims/mine`.
- Admin: stats, hide/unhide, users list, non-admin 403.
- Security: `$`-key sanitization, error format, unauthenticated 401.
- Client: API client error handling, ProtectedRoute redirect, form validation messages, Pagination behavior.

## 3. Manual acceptance tests
| ID | Scenario | Expected | Result |
|----|----------|----------|--------|
| AT-01 | Register new student | Logged in, redirected | not run |
| AT-02 | Report found item with image | Appears on Home with image | not run |
| AT-03 | Search by keyword and filter by category | Matching items only | not run |
| AT-04 | Second user claims item with proof | Claim created, shown in dashboard | not run |
| AT-05 | Owner views claim and accepts | Item resolved, other claims rejected | not run |
| AT-06 | Claim own item | Blocked with message | not run |
| AT-07 | Admin hides item | Not visible publicly | not run |
| AT-08 | Non-admin opens /admin | Denied or redirected | not run |
| AT-09 | Upload 3 MB or .gif file | Rejected with message | not run |
| AT-10 | `docker compose up --build`, open :8080 | App works, data persists after restart | not run |

## 4. Exit criteria
All automated tests pass in CI; all acceptance tests executed and recorded; no open critical defects.
