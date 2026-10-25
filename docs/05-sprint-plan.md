# 05 - Sprint Plan

**Status: PLANNED. Nothing in this document has been completed or measured. Update the "Actual" column and retrospectives as work happens.**

Four proposed one-week sprints. Story IDs refer to `04-product-backlog.md`. Assignments use the team roles in `09-team-contribution-plan.md`.

## Sprint 1 - Foundations and authentication (PLANNED)
- Goal: running skeleton with registration and login.
- Stories: US-01, US-02, US-19, US-20 (part), US-18 (repo and CI skeleton).
- Planned points: 3 + 3 + 2 + 1 + 2 = 11.
- Tasks: A - app shell, Navbar, Login/Register pages, AuthContext. B - models, auth routes, session, validation, error handler. C - repo setup, CI skeleton, auth tests.
- Exit: user can register, log in, log out locally.

## Sprint 2 - Items and discovery (PLANNED)
- Goal: report, browse and search items.
- Stories: US-03, US-04, US-05, US-06, US-07.
- Planned points: 5 + 5 + 5 + 3 + 2 = 20.
- Tasks: A - Home, Filters, Pagination, ItemCard, ItemForm, ItemDetail. B - item model, CRUD create/list/get, upload handling, filter query. C - item API tests, upload tests, client component tests.
- Exit: items can be created with image, searched, paginated.

## Sprint 3 - Ownership management and claims (PLANNED)
- Goal: complete claim workflow.
- Stories: US-08, US-09, US-10, US-11, US-12, US-13, US-14.
- Planned points: 3 + 3 + 3 + 5 + 3 + 5 + 2 = 24 (largest sprint; descope US-14 if needed).
- Tasks: A - EditItem, Dashboard, ClaimForm, ClaimList. B - update/close/delete, claims endpoints, accept logic. C - claim authorization tests, integration checks.
- Exit: claim lifecycle works end to end.

## Sprint 4 - Admin, hardening, delivery (PLANNED)
- Goal: moderation, security hardening, Docker, documentation, demo.
- Stories: US-15, US-16, US-17, US-18 (Docker and CI completion), remaining US-20.
- Planned points: 3 + 3 + 2 + 3 + 1 = 12, plus stabilization buffer.
- Tasks: A - AdminDashboard, NotFound, polish. B - admin endpoints, rate limit, sanitization, helmet. C - Docker Compose, CI completion, test plan execution, demo rehearsal.
- Exit: demo checklist (`11-demo-checklist.md`) executed.

## Notes
Velocity is unknown until sprints run. Rebalance scope between sprints after Sprint 1 review.
