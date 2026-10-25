# FindIt - Campus Lost and Found Portal

FindIt is a MERN (MongoDB, Express, React, Node.js) web application where students report lost and found items, search listings, and submit ownership claims. Admins moderate content.

## Features
- Register, log in, log out (session cookie auth)
- Browse items with pagination; search and filter by type, category, status, location
- Report lost or found items with optional image (jpeg/png/webp, max 2 MB)
- Edit, close, delete own items; personal dashboard
- Claim found items with a message and private proof; owners accept or reject claims
- Admin dashboard: statistics, hide/unhide items, list users
- Security: helmet, rate limiting on auth, input validation, NoSQL key sanitization, Origin check, httpOnly cookies
- Docker Compose deployment and GitHub Actions CI

## Architecture and folder tree
React SPA (Vite) -> Express API -> MongoDB. Details in `docs/02-architecture.md`; API in `docs/03-api.md`; shared contract in `docs/CONTRACT.md`.

```
findit-project/
  package.json            root scripts (delegate with --prefix)
  docker-compose.yml
  .env.example            for docker compose
  .github/workflows/ci.yml
  docs/                   requirements, architecture, API, backlog, sprints, testing, etc.
  server/
    Dockerfile
    .env.example
    uploads/              uploaded images (git-ignored contents)
    src/                  app.js, server.js, models, routes, middleware, scripts
  client/
    Dockerfile
    nginx.conf
    .env.example
    src/                  api, context, components, pages
```

## Prerequisites
- Node.js 20 and npm
- MongoDB, one of: local MongoDB Community Server, MongoDB Atlas (free cluster), or Docker
- VS Code (recommended) and Git

## Windows PowerShell + VS Code setup
Replace paths with where your zip file is.

```powershell
cd $HOME\Downloads
Expand-Archive -Path .\findit-project.zip -DestinationPath .\
cd .\findit-project
code .
npm run install:all
Copy-Item server\.env.example server\.env
# optional, only if you need to override defaults:
Copy-Item client\.env.example client\.env
```
Then edit `server\.env` in VS Code (see below).

## MongoDB configuration
Edit `server\.env` and set `MONGODB_URI`:
- Local: `mongodb://127.0.0.1:27017/findit` (start the MongoDB service first)
- Atlas: `mongodb+srv://<user>:<password>@<cluster>/findit?retryWrites=true&w=majority` (create a database user, and add your IP under Network Access)
- Docker only for Mongo: `docker run -d --name findit-mongo -p 27017:27017 mongo:7`

Set `SESSION_SECRET` to a long random string (never commit `.env`).

## Environment variables
| Variable | Where | Default | Purpose |
|----------|-------|---------|---------|
| PORT | server | 5000 | API port |
| MONGODB_URI | server | mongodb://127.0.0.1:27017/findit | Database connection |
| SESSION_SECRET | server | none (set it) | Signs session cookie |
| CLIENT_ORIGIN | server | http://localhost:5173 | Allowed origin for Origin check/CORS |
| NODE_ENV | server | development | Environment |
| COOKIE_SECURE | server | false | Set true only behind HTTPS in production |
| UPLOAD_DIR | server | uploads | Image storage directory |
| ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME | shell, create-admin only | none | Admin creation script input |
| VITE_API_BASE | client (optional) | /api | API base path |
| CLIENT_PORT | root .env (Docker) | 8080 | Published web port |

## Running
In two terminals from the project root:
```powershell
npm run dev:server    # API on http://localhost:5000
npm run dev:client    # UI on http://localhost:5173
```
Open http://localhost:5173. Health check: http://localhost:5000/api/health.

## Demo admin and seed data
```powershell
$env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="ChangeMe123"; $env:ADMIN_NAME="Admin"; npm run create-admin --prefix server
npm run seed --prefix server
```
Choose your own password; credentials are read from environment variables only. Clear them afterwards with `Remove-Item Env:ADMIN_PASSWORD`.

## Tests and build
```powershell
npm test          # server then client tests
npm run build     # production client build into client\dist
```
Server tests use mongodb-memory-server, which downloads a MongoDB binary on first run (needs internet).

## Docker
```powershell
Copy-Item .env.example .env   # set SESSION_SECRET
docker compose up --build
```
Open http://localhost:8080. Data persists in named volumes. Stop with `docker compose down` (add `-v` to delete data). See `docs/10-ci-and-docker.md`.

## API summary
Full detail in `docs/03-api.md`.
- Auth: `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- Items: `GET /api/items`, `GET /api/items/mine`, `GET /api/items/:id`, `POST /api/items`, `PATCH /api/items/:id`, `POST /api/items/:id/close`, `DELETE /api/items/:id`
- Claims: `POST|GET /api/items/:id/claims`, `GET /api/claims/mine`, `PATCH /api/claims/:id`
- Admin: `GET /api/admin/stats`, `GET /api/admin/items`, `PATCH /api/admin/items/:id/hide`, `GET /api/admin/users`
- Health: `GET /api/health`

## Git and GitHub setup
```powershell
git init
git add .
git commit -m "chore: initial project import"
git branch -M main
git remote add origin https://github.com/<your-username>/findit.git
git push -u origin main
git checkout -b develop
git push -u origin develop
```
Confirm `.env` is not staged (`git status`). Workflow conventions: `docs/08-git-workflow.md`.

## Security considerations
- Passwords stored hashed; session cookie httpOnly, sameSite lax, `secure` when `COOKIE_SECURE=true` in production
- Helmet headers; rate limit on `/api/auth` (20 per 15 min)
- Server-side validation; Mongo operator keys (`$`, `.`) stripped from input; search regex escaped
- Upload restricted to jpeg/png/webp up to 2 MB
- Claim proof only visible to claimant, item owner, admin
- Origin check on non-GET requests as CSRF mitigation
- Secrets only in environment variables; change `SESSION_SECRET` for any real use

## Limitations
- Images stored on local disk, not a CDN or cloud storage
- No email verification, password reset, or notifications
- Rate limiting is per-process memory
- No real-time updates
- Origin-check CSRF mitigation is not a full token-based scheme

## Future enhancements
Email notifications, password reset, in-app messaging between owner and claimant, cloud image storage with image scanning, CSRF tokens, audit logs, i18n, map-based locations.

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `MongooseServerSelectionError` | MongoDB not running or wrong `MONGODB_URI`; for Atlas check IP allow list and credentials |
| Port 5000 or 5173 in use | Change `PORT` in `server\.env` (and update the Vite proxy target) or stop the other process |
| Login works but session lost | Ensure `CLIENT_ORIGIN` matches the URL you open; keep `COOKIE_SECURE=false` on http |
| 403 on POST/PATCH | Origin check failed; match `CLIENT_ORIGIN` to browser URL |
| `Expand-Archive` or script blocked | Run PowerShell as normal user; if scripts are blocked: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Server tests hang on first run | mongodb-memory-server is downloading a binary; check network/proxy |
| Image upload rejected | Use jpeg/png/webp under 2 MB; nginx limit is 3 MB |
| Docker: server cannot reach mongo | Wait for mongo healthcheck; `docker compose logs mongo` |
| `npm ci` fails in Docker/CI | Commit `package-lock.json` in `server` and `client` |

## Verification status
Not yet verified. Test, build and Docker results must be confirmed by running the commands above (`npm test`, `npm run build`, `docker compose up --build`). No pass/fail results are claimed in this repository until they are run and recorded here.

| Check | Command | Result |
|-------|---------|--------|
| Server tests | `npm test --prefix server` | Not run by the generator (MongoDB binary download was blocked). Run on your machine and record here. |
| Client tests | `npm test --prefix client` | 29 passed in 7 files when run in the generator's environment (Node, jsdom). |
| Client build | `npm run build` | Succeeded in the generator's environment. |
| Docker | `docker compose up --build` | Not run (no Docker daemon in the generator's environment). |

## Documentation index
`docs/01-requirements.md` through `docs/11-demo-checklist.md`, plus `docs/CONTRACT.md`.
