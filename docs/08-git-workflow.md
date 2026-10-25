# 08 - Git Workflow

## Branches
- `main`: stable, demo-ready. Protected; changes only via PR from `develop` at sprint end.
- `develop`: integration branch.
- Feature branches from `develop`: `feature/<area>-<short-name>`, e.g. `feature/auth-login`, `feature/items-upload`.
- Fixes: `fix/<short-name>`. Docs: `docs/<short-name>`. Chores: `chore/<short-name>`.

## Pull requests
1. Branch from `develop`, keep PRs small (one story or task).
2. Push and open a PR into `develop`; reference the story ID (e.g. `US-05`).
3. CI must pass; at least one teammate reviews (not the author).
4. Check the Definition of Done (`06-definition-of-done.md`).
5. Squash-merge or merge, then delete the branch.

PR title example: `US-05: Add report item form and create endpoint`.

## Commit messages
Format: `type(scope): imperative summary` (types: feat, fix, docs, test, chore, refactor, ci).

Examples:
- `feat(auth): add register and login endpoints`
- `feat(client): add ItemCard and Pagination components`
- `fix(items): escape regex characters in search`
- `test(claims): cover duplicate claim conflict`
- `ci: cache npm by lockfile`
- `docs: add sprint plan`

## Daily commands
```
git checkout develop
git pull
git checkout -b feature/items-upload
git add .
git commit -m "feat(items): validate image type and size"
git push -u origin feature/items-upload
```

## Rules
- Never commit `.env`, `node_modules`, uploads or credentials.
- Rebase or merge `develop` into your branch before opening the PR.
- Do not force-push shared branches.
