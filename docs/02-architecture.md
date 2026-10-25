# 02 - Architecture

## 1. Overview
Three-tier MERN application.

```
Browser (React SPA)
   |  fetch /api/*, /uploads/*  (cookie findit.sid)
   v
Vite dev proxy (5173)  or  nginx (8080 in Docker)
   |  proxy to server:5000
   v
Express API (Node 20, ESM)  --->  MongoDB (items, users, claims, sessions)
   |
   +--> uploads/ (image files on disk or Docker volume)
```

## 2. Ports and environments
| Environment | Client | Server | MongoDB |
|-------------|--------|--------|---------|
| Local dev | 5173 (Vite, proxies `/api` and `/uploads` to localhost:5000) | 5000 | `mongodb://127.0.0.1:27017/findit` or Atlas |
| Docker | 8080 (nginx) | 5000 (internal) | `mongodb://mongo:27017/findit` |
| Tests | n/a | in-process via supertest | mongodb-memory-server |

## 3. Backend
- `src/app.js` exports `createApp()` so tests can mount the app without listening.
- Middleware: helmet, JSON body parser, `$`/`.` key sanitization, express-session (connect-mongo store; MemoryStore in tests), Origin check on non-GET, rate limiter on `/api/auth` (disabled in test), central error handler producing the contract error format.
- Resources: auth, items (multipart upload via multer), claims, admin, health.
- Authorization: session user; role checks for admin; ownership checks for items and claims.

## 4. Data model
- **User**: name, email (unique, lowercase), passwordHash, role, createdAt.
- **Item**: type, title, description, category, location, date, imageUrl, status, hidden, owner, createdAt, updatedAt.
- **Claim**: item, claimant, message, proof (private), status, createdAt; unique (item, claimant).

```
User 1 --- * Item 1 --- * Claim * --- 1 User(claimant)
```

## 5. Frontend
- React + React Router. Routes: `/`, `/login`, `/register`, `/items/new`, `/items/:id`, `/items/:id/edit`, `/dashboard`, `/admin`, `*`.
- `src/api/client.js` wraps fetch with credentials and throws `ApiError`.
- `AuthContext` holds session user and exposes login, register, logout.
- `ProtectedRoute` guards authenticated and admin routes.

## 6. Security design
Session cookie httpOnly, sameSite lax, secure when `COOKIE_SECURE=true` in production; password hashing; validation on all inputs; MIME and size checks for uploads; hidden-item and private-proof access control; helmet headers; rate limiting; sanitized Mongo operators. See README for limitations.

## 7. Deployment
Docker Compose runs mongo (volume + healthcheck), server (non-root, uploads volume), and client (nginx serving static build and proxying API). See `10-ci-and-docker.md`.
