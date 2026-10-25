# 10 - CI and Docker

## Continuous integration
Workflow: `.github/workflows/ci.yml`. Triggers: push to `main`/`develop` and all pull requests.

| Job | Steps |
|-----|-------|
| server-tests | checkout, Node 20 with npm cache keyed on `server/package-lock.json`, `npm ci`, `npm test` |
| client-tests-build | checkout, Node 20 with cache keyed on `client/package-lock.json`, `npm ci`, `npm test`, `npm run build` |
| docker-build | after both jobs, `docker compose build` (no push) |

Notes:
- Server tests use mongodb-memory-server, which downloads a MongoDB binary on first run (needs network access; cached afterwards). No Mongo service container is needed.
- `package-lock.json` must be committed in `server/` and `client/` for `npm ci` and cache keys to work.

## Docker
Services in `docker-compose.yml`:
- **mongo** (`mongo:7`): volume `mongo_data`, healthcheck via `mongosh` ping.
- **server**: built from `server/Dockerfile` (node:20-alpine, `npm ci --omit=dev`, runs as non-root `node`, uploads volume `uploads_data`). Waits for mongo health.
- **client**: multi-stage build from `client/Dockerfile`; nginx serves the SPA, proxies `/api` and `/uploads` to `server:5000`, `client_max_body_size 3m`. Published on host port 8080.

Configuration: copy `.env.example` to `.env` in the project root and set `SESSION_SECRET`. Defaults exist so compose runs without a `.env`, but the default secret is not safe for any real deployment.

Commands:
```
docker compose up --build        # start
docker compose up --build -d     # start in background
docker compose logs -f server
docker compose down              # stop, keep data
docker compose down -v           # stop and delete data volumes
```
Create an admin in Docker:
```
docker compose exec -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=<choose-a-password> server npm run create-admin
```
App URL: http://localhost:8080
