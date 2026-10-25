# FindIt shared contract (source of truth for all parts)

Ports: server 5000, client dev 5173 (Vite proxies `/api` and `/uploads` to http://localhost:5000). In Docker: client served by nginx on 8080 and proxies `/api`, `/uploads` to `server:5000`; mongo at `mongodb://mongo:27017/findit`.

All API paths are prefixed `/api`. JSON bodies except item create/update which use multipart/form-data (field `image` optional, jpeg/png/webp, max 2MB). Auth: express-session cookie `findit.sid` (httpOnly, sameSite lax, secure only in production when `COOKIE_SECURE=true`), store connect-mongo (in tests: MemoryStore). CSRF mitigation: sameSite=lax + JSON/multipart + Origin check middleware for non-GET.

Env (server): PORT=5000, MONGODB_URI=mongodb://127.0.0.1:27017/findit, SESSION_SECRET, CLIENT_ORIGIN=http://localhost:5173, NODE_ENV, COOKIE_SECURE=false, UPLOAD_DIR=uploads.
Env (client): none required (uses relative `/api`); optional VITE_API_BASE (default `/api`).

## Error format
`{ "error": { "message": "...", "details": [{ "field": "title", "message": "..." }] } }` with proper status (400 validation, 401 unauth, 403 forbidden, 404, 409 conflict, 500).

## Models
User: name, email (unique, lowercase), passwordHash, role ('student'|'admin'), createdAt. Public shape: `{ id, name, email, role }`.
Item: type ('lost'|'found'), title(3-100), description(10-1000), category ('electronics','books','clothing','accessories','id-cards','keys','bags','other'), location(2-120), date (not in future), imageUrl (string|null, `/uploads/<file>`), status ('open'|'resolved'|'closed'), hidden (bool, admin moderation), owner (User ref), createdAt, updatedAt.
Item public shape: `{ id, type, title, description, category, location, date, imageUrl, status, hidden, owner: {id,name}, createdAt, claimCount? }`.
Claim: item (ref), claimant (ref), message (10-500), proof (10-1000, PRIVATE: only visible to claimant, item owner, admin), status ('pending'|'accepted'|'rejected'), createdAt. Unique (item, claimant). Shape: `{ id, item (id or populated {id,title,type,status}), claimant:{id,name}, message, proof, status, createdAt }`.

## Endpoints
Auth
- POST /api/auth/register {name,email,password(min 8, letter+digit)} -> 201 {user}; logs in.
- POST /api/auth/login {email,password} -> 200 {user}
- POST /api/auth/logout -> 200 {ok:true}
- GET /api/auth/me -> 200 {user} or 401

Items
- GET /api/items?search=&type=&category=&status=&location=&page=1&limit=9 -> {items, page, limit, total, totalPages}. Public; hidden items excluded; default status filter none (all non-hidden). Search matches title/description/location case-insensitive (escaped regex).
- GET /api/items/:id -> {item} (hidden items 404 unless owner/admin). Invalid id -> 404.
- POST /api/items (auth) multipart -> 201 {item}
- PATCH /api/items/:id (owner or admin) multipart/JSON; fields optional; owner may also set status 'closed'/'open' -> {item}
- POST /api/items/:id/close (owner or admin) -> {item} status 'closed'
- DELETE /api/items/:id (owner or admin) -> {ok:true} (also deletes claims)
- GET /api/items/mine (auth) -> {items} (declared before /:id)

Claims
- POST /api/items/:id/claims (auth) {message, proof} -> 201 {claim}. Only for item.type==='found', status 'open', not hidden, not own item (403), no duplicate (409).
- GET /api/items/:id/claims (item owner or admin) -> {claims} (includes proof)
- GET /api/claims/mine (auth) -> {claims} claimant's own claims, item populated
- PATCH /api/claims/:id {status:'accepted'|'rejected'} (item owner or admin; claim must be pending) -> {claim}. Accepting sets item.status='resolved' and auto-rejects other pending claims on that item.

Admin (role admin)
- GET /api/admin/stats -> {stats:{users,items,lostItems,foundItems,openItems,resolvedItems,closedItems,hiddenItems,pendingClaims,totalClaims}}
- GET /api/admin/items?page=&limit=&status= -> same pagination shape, includes hidden
- PATCH /api/admin/items/:id/hide {hidden:boolean} -> {item}
- GET /api/admin/users -> {users}
- GET /api/health -> {status:'ok'} (public)

Rate limit: express-rate-limit on /api/auth (20/15min; disabled when NODE_ENV==='test'). helmet, hpp-like sanitization of `$` keys (custom middleware stripping keys starting with `$` or containing `.`).

## Scripts
Server (`server/package.json`, ESM, "type":"module"): start=node src/server.js, dev=node --watch src/server.js, test=vitest run, seed=node src/scripts/seed.js, create-admin=node src/scripts/createAdmin.js (reads ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME env; never hardcoded). Tests use mongodb-memory-server + supertest; app exported from src/app.js (createApp()).
Client (`client/package.json`): dev=vite, build=vite build, preview=vite preview, test=vitest run.
Root `package.json`: scripts install:all, dev:server, dev:client, test, build (delegating with --prefix).

## Client routes
/ (Home listings + filters + pagination), /login, /register, /items/new (protected), /items/:id, /items/:id/edit (protected), /dashboard (protected), /admin (admin only), * NotFound.
Client modules: src/api/client.js (fetch wrapper, credentials 'include', throws ApiError with message/details/status), src/context/AuthContext.jsx (user, loading, login, register, logout), src/components/{Navbar,ItemCard,ItemForm,Pagination,ProtectedRoute,Filters,StatusBadge,ClaimForm,ClaimList}.jsx, src/pages/{Home,Login,Register,ReportItem,EditItem,ItemDetail,Dashboard,AdminDashboard,NotFound}.jsx.
