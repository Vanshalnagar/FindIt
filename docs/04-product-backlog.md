# 04 - Product Backlog

Priority: Must / Should / Could. Story points use a Fibonacci scale (relative estimates, planned).

| ID | User story | Priority | Points |
|----|-----------|----------|--------|
| US-01 | As a visitor, I want to register an account so that I can report and claim items | Must | 3 |
| US-02 | As a user, I want to log in and out so that my session is secure | Must | 3 |
| US-03 | As a visitor, I want to browse items with pagination so that I can see what was reported | Must | 5 |
| US-04 | As a visitor, I want to search and filter by type, category, status and location so that I find relevant items fast | Must | 5 |
| US-05 | As a student, I want to report a lost or found item so that others can help | Must | 5 |
| US-06 | As a student, I want to attach an image to my report so that the item is recognizable | Should | 3 |
| US-07 | As a visitor, I want to view item details so that I can judge if it is mine | Must | 2 |
| US-08 | As an owner, I want to edit my item so that details stay correct | Should | 3 |
| US-09 | As an owner, I want to close or delete my item so that stale listings disappear | Should | 3 |
| US-10 | As a student, I want to see my own items on a dashboard so that I can manage them | Should | 3 |
| US-11 | As a student, I want to claim a found item with a message and private proof so that I can recover it | Must | 5 |
| US-12 | As an owner, I want to review claims including proof so that I can verify the claimant | Must | 3 |
| US-13 | As an owner, I want to accept or reject a claim so that the item is resolved | Must | 5 |
| US-14 | As a claimant, I want to see the status of my claims so that I know the outcome | Should | 2 |
| US-15 | As an admin, I want to view platform statistics so that I can monitor activity | Should | 3 |
| US-16 | As an admin, I want to hide or unhide items so that I can moderate inappropriate content | Must | 3 |
| US-17 | As an admin, I want to list users so that I can oversee the community | Could | 2 |
| US-18 | As a developer, I want CI and Docker setup so that builds are reproducible | Should | 5 |
| US-19 | As a student, I want clear validation errors so that I can fix my input | Should | 2 |
| US-20 | As a maintainer, I want seed data and an admin creation script so that demos and setup are easy | Could | 2 |

## Acceptance criteria

**US-01** Given valid name, unique email, password with 8+ chars including letter and digit, registration returns 201, logs the user in; duplicate email gives 409; weak password gives 400 with field details.

**US-02** Valid credentials start a session; invalid gives 401; logout ends the session; `/auth/me` returns 401 afterwards.

**US-03** Home lists 9 items per page by default with working pagination controls; hidden items never appear.

**US-04** Search matches title, description, location case-insensitively; type, category, status filters combine; special regex characters in search do not break the query.

**US-05** Authenticated user submits valid form and sees the new item; future dates, short titles, bad category are rejected with field messages; unauthenticated gets 401.

**US-06** Only jpeg/png/webp up to 2 MB accepted; others rejected with a clear error; image displays on card and detail page.

**US-07** Detail page shows all public fields and owner name; unknown or malformed id shows not-found.

**US-08** Only owner or admin can edit; others get 403; changes persist and display.

**US-09** Owner can close (status closed) or delete; delete removes claims; non-owner gets 403.

**US-10** Dashboard shows only the user's items and claims, with statuses.

**US-11** Claim only on found, open, visible items not owned by the user; own item gives 403; duplicate gives 409; message 10-500, proof 10-1000.

**US-12** Owner and admin see claims with proof; other users cannot access them.

**US-13** Accepting sets claim accepted, item resolved, other pending claims rejected; non-pending claim cannot be changed.

**US-14** Claimant sees own claims with item title and status.

**US-15** Admin page shows all stat counters; non-admins get 403.

**US-16** Hidden item disappears from public list and detail (404) but remains visible to owner and admin.

**US-17** Admin sees users without password hashes.

**US-18** CI runs server tests, client tests and build on push and pull request; `docker compose build` succeeds.

**US-19** API errors use the standard format; forms display per-field messages.

**US-20** `npm run seed --prefix server` inserts demo data; `create-admin` reads credentials from environment variables only.
