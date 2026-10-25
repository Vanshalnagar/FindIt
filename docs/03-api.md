# 03 - API Reference

Derived from `docs/CONTRACT.md` (source of truth). Base path: `/api`.

## Conventions
- JSON bodies, except item create/update which use `multipart/form-data` (optional file field `image`: jpeg/png/webp, max 2 MB).
- Auth: session cookie `findit.sid`. Send with `credentials: 'include'`.
- Non-GET requests are subject to an Origin check against `CLIENT_ORIGIN`.
- Error format:
```json
{ "error": { "message": "Validation failed", "details": [{ "field": "title", "message": "..." }] } }
```
Status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 500 server error.

## Auth
| Method | Path | Body | Success |
|--------|------|------|---------|
| POST | /api/auth/register | name, email, password (min 8, letter + digit) | 201 `{user}`; logs in |
| POST | /api/auth/login | email, password | 200 `{user}` |
| POST | /api/auth/logout | - | 200 `{ok:true}` |
| GET | /api/auth/me | - | 200 `{user}` or 401 |

Public user shape: `{ id, name, email, role }`. Rate limit: 20 requests per 15 min on `/api/auth` (disabled when `NODE_ENV=test`).

## Items
| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | /api/items | public | Query: `search, type, category, status, location, page=1, limit=9`. Returns `{items, page, limit, total, totalPages}`. Hidden excluded. Search is case-insensitive over title/description/location (regex escaped) |
| GET | /api/items/mine | auth | `{items}` (declared before `/:id`) |
| GET | /api/items/:id | public | `{item}`; hidden gives 404 unless owner/admin; invalid id gives 404 |
| POST | /api/items | auth | multipart; 201 `{item}` |
| PATCH | /api/items/:id | owner/admin | multipart or JSON, fields optional; owner may set status `closed` or `open` |
| POST | /api/items/:id/close | owner/admin | `{item}` with status closed |
| DELETE | /api/items/:id | owner/admin | `{ok:true}`; also deletes claims |

Item fields: type (`lost|found`), title 3-100, description 10-1000, category (`electronics, books, clothing, accessories, id-cards, keys, bags, other`), location 2-120, date (not in future), imageUrl (`/uploads/<file>` or null), status (`open|resolved|closed`), hidden.

Item shape: `{ id, type, title, description, category, location, date, imageUrl, status, hidden, owner:{id,name}, createdAt, claimCount? }`.

## Claims
| Method | Path | Access | Notes |
|--------|------|--------|-------|
| POST | /api/items/:id/claims | auth | Body `{message (10-500), proof (10-1000)}`; 201 `{claim}`. Only found, open, visible items; own item gives 403; duplicate gives 409 |
| GET | /api/items/:id/claims | owner/admin | `{claims}` including proof |
| GET | /api/claims/mine | auth | `{claims}` with item populated |
| PATCH | /api/claims/:id | item owner/admin | Body `{status:'accepted'|'rejected'}`; claim must be pending. Accept sets item resolved and auto-rejects other pending claims |

Claim shape: `{ id, item, claimant:{id,name}, message, proof, status, createdAt }`. Proof is private to claimant, item owner, admin.

## Admin (role admin)
| Method | Path | Notes |
|--------|------|-------|
| GET | /api/admin/stats | `{stats:{users,items,lostItems,foundItems,openItems,resolvedItems,closedItems,hiddenItems,pendingClaims,totalClaims}}` |
| GET | /api/admin/items?page=&limit=&status= | Paginated, includes hidden |
| PATCH | /api/admin/items/:id/hide | Body `{hidden:boolean}`; `{item}` |
| GET | /api/admin/users | `{users}` |

## Health
`GET /api/health` returns `{status:'ok'}` (public).
