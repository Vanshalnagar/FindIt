# 01 - Requirements

## 1. Purpose
FindIt is a campus lost-and-found portal. Students report lost or found items, browse and search listings, and submit ownership claims for found items. Administrators moderate content.

## 2. Stakeholders and roles
| Role | Description |
|------|-------------|
| Visitor | Unauthenticated user; can browse and view listings |
| Student | Registered user; reports items, manages own items, submits and reviews claims |
| Admin | Moderates listings, views statistics and users |

## 3. Functional requirements
| ID | Requirement |
|----|-------------|
| FR-1 | Users can register with name, email, password (min 8 chars, letter + digit) and are logged in on success |
| FR-2 | Users can log in, log out, and retrieve the current session user |
| FR-3 | Anyone can browse items with pagination (default 9 per page) |
| FR-4 | Items can be filtered by search text (title, description, location), type, category, status, and location |
| FR-5 | Authenticated users can create lost/found items with title, description, category, location, date (not in future) and an optional image (jpeg/png/webp, max 2 MB) |
| FR-6 | Owners (and admins) can edit, close, and delete their items; deleting an item deletes its claims |
| FR-7 | Authenticated users can list their own items |
| FR-8 | Authenticated users can submit a claim (message + private proof) on an open, visible, found item they do not own; one claim per user per item |
| FR-9 | Item owners (and admins) can view claims including proof and accept or reject pending claims |
| FR-10 | Accepting a claim sets the item to resolved and auto-rejects other pending claims |
| FR-11 | Claimants can view their own claims and statuses |
| FR-12 | Admins can view statistics, list all items including hidden, hide/unhide items, and list users |
| FR-13 | Hidden items are not shown publicly; direct access returns 404 unless requester is owner or admin |
| FR-14 | A health endpoint reports service status |

## 4. Non-functional requirements
| ID | Requirement |
|----|-------------|
| NFR-1 Security | Passwords hashed; httpOnly session cookie; helmet; auth rate limit (20 per 15 min); NoSQL-operator key sanitization; Origin check on non-GET; input validation; upload type and size limits |
| NFR-2 Privacy | Claim proof visible only to claimant, item owner, admin |
| NFR-3 Usability | Responsive SPA, clear validation messages, consistent error format |
| NFR-4 Maintainability | Documented API contract, automated tests, CI |
| NFR-5 Portability | Runs locally on Windows/VS Code and via Docker Compose |
| NFR-6 Configurability | All secrets and endpoints via environment variables; none hardcoded |

## 5. Constraints and assumptions
- Stack: MongoDB, Express, React (Vite), Node.js 20.
- Single campus; no email notifications or real-time messaging in the initial scope.
- Images stored on local disk (`uploads/`), not cloud storage.

## 6. Out of scope (initial version)
Email/SMS notifications, in-app chat, password reset, OAuth/SSO, cloud image storage, mobile apps.
