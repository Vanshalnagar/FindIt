# 09 - Team Contribution Plan

Names are placeholders; replace with real names. This is a plan of intended responsibilities, not a record of work done. Every member writes code and tests.

| Member | Role | Name |
|--------|------|------|
| A | Frontend | `<Member A name>` |
| B | Backend | `<Member B name>` |
| C | Integration, testing, DevOps | `<Member C name>` |

## Member A - Frontend (coding duties)
- Implement React pages: Home, Login, Register, ReportItem, EditItem, ItemDetail, Dashboard, AdminDashboard, NotFound.
- Implement components: Navbar, ItemCard, ItemForm, Pagination, ProtectedRoute, Filters, StatusBadge, ClaimForm, ClaimList.
- Implement `src/api/client.js` and `AuthContext`.
- Write client component and unit tests; responsive styling and form validation UX.
- Backlog: US-01/02 (UI), US-03, US-04, US-05..US-10 (UI), US-11..US-14 (UI), US-15..US-17 (UI), US-19.

## Member B - Backend (coding duties)
- Implement models (User, Item, Claim), validation, auth and session setup, item/claim/admin routes, upload handling, error handler.
- Implement security middleware: helmet, rate limit, key sanitization, Origin check.
- Implement scripts: seed, create-admin.
- Write server unit tests for models and validators.
- Backlog: US-01/02 (API), US-03..US-17 (API), US-20.

## Member C - Integration, testing, DevOps (coding duties)
- Write supertest integration tests against the full API using mongodb-memory-server, and end-to-end verification of client against API.
- Maintain Dockerfiles, nginx config, docker-compose, GitHub Actions CI, npm scripts.
- Implement shared test helpers/fixtures; fix integration defects in either tier via PRs.
- Own docs/testing plan execution, demo checklist, README accuracy.
- Backlog: US-18, test coverage for all stories.

## Collaboration
- Contract changes require agreement of all three and an update to `docs/CONTRACT.md`.
- Cross-review: A reviews C, B reviews A, C reviews B.
- Contribution evidence: `git log --author` per member and PR history.
