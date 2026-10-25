# 11 - Demo Checklist

## Before the demo
- [ ] MongoDB running (local service, Atlas URI, or `docker compose up --build`)
- [ ] `server/.env` configured (or root `.env` for Docker)
- [ ] `npm run seed --prefix server` run (optional demo data)
- [ ] Admin created via `create-admin` with env vars
- [ ] Client and server both started; http://localhost:5173 (or :8080) loads
- [ ] `npm test` run and results noted truthfully
- [ ] Two browser profiles (student 1, student 2) plus admin ready
- [ ] A small jpeg/png under 2 MB prepared

## Demo flow
1. Show landing page, filters, search, pagination.
2. Register student 1; report a found item with image.
3. Log in as student 2; open item; submit claim with proof.
4. Try claiming own item as student 1 (blocked).
5. As student 1: dashboard, view claims with proof, accept; show item resolved.
6. Show student 2 dashboard claim status.
7. Log in as admin: statistics, hide an item, confirm it vanishes publicly.
8. Show validation error (future date, bad upload).
9. Show Docker run and CI workflow page.
10. Show Git history, PRs, backlog and sprint plan.

## Q&A prep
- Security measures and known limitations (README).
- Contract and architecture docs.
- Each member explains their coding contribution.
