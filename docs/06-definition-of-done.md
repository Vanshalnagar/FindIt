# 06 - Definition of Done

A user story is done only when all applicable items are true.

## Code
- [ ] Implements all acceptance criteria in `04-product-backlog.md`
- [ ] Follows `docs/CONTRACT.md`; contract changes are agreed and the contract updated in the same PR
- [ ] No secrets, credentials or real personal data committed
- [ ] No debug code or commented-out blocks

## Quality
- [ ] Automated tests added or updated for new behavior (success and failure paths)
- [ ] `npm test` passes locally for affected packages
- [ ] Client `npm run build` succeeds
- [ ] CI is green on the pull request

## Review
- [ ] Pull request reviewed and approved by at least one other member
- [ ] Review comments resolved
- [ ] Commit messages follow `08-git-workflow.md`

## Security and validation
- [ ] Inputs validated server-side; authorization checked for protected actions
- [ ] Private data (claim proof) not exposed to unauthorized users

## Documentation and acceptance
- [ ] README and docs updated if behavior, commands or env vars changed
- [ ] Acceptance criteria demonstrated manually or via test, as listed in `07-testing-plan.md`
- [ ] Merged to `develop` via PR
