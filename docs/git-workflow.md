# Git Workflow

Branching model based on Git Flow. Default branch is `main`.

## Branches

| Branch | Purpose | Direct commits? |
|--------|---------|-----------------|
| `main` | Production-ready code. Mirrors what is (or will be) deployed. | No — only via PR from `develop` |
| `develop` | Integration branch. Accumulates features until next release. | No — only via PR from `feature/*` or `fix/*` |
| `feature/<slug>` | New feature work. Branched from `develop`. | Yes (the author's local branch) |
| `fix/<slug>` | Bug fixes targeting the next release. Branched from `develop`. | Yes |
| `hotfix/<slug>` | Urgent production fix. Branched from `main`, merged to both `main` and `develop`. | Yes |
| `docs/<slug>` | Documentation-only changes. Branched from `develop`. | Yes |
| `chore/<slug>` | Tooling, deps, build config. Branched from `develop`. | Yes |

## Flow

```
main      ────●────────────────●────────────●─────►
              │                ▲            ▲
              │                │ PR         │ PR
develop   ────●────●────●──────●────●───────●─────►
                   ▲    ▲           ▲
                   │ PR │ PR        │ PR
feature/x      ────●    │           │
feature/y           ────●           │
fix/z                       ────────●
```

1. Branch `feature/<slug>` from `develop`.
2. Commit + push to `feature/<slug>`.
3. Open PR `feature/<slug>` → `develop`. Merge when reviewed.
4. When release is ready, open PR `develop` → `main`. Merge.
5. Dokploy redeploys on push to `develop` (staging) or `main` (production), per environment config.

## Naming conventions

- `feature/repo-detail-expansion`
- `fix/auth-token-expiry`
- `hotfix/missing-env-var`
- `docs/roadmap-update`
- `chore/bump-deps`
- Use kebab-case slugs. No issue numbers in branch name (link them in the PR).

## Commit messages

Conventional Commits. See `docs/code-standards.md`.

- `feat:` new feature
- `fix:` bug fix
- `docs:` docs only
- `refactor:` no behavior change
- `test:` tests only
- `chore:` tooling, deps, build

## PR rules

- PRs to `develop`: squash or merge commit, author's choice.
- PRs to `main`: merge commit (preserves release boundary in history).
- Never force-push to `develop` or `main`.
- Never commit directly to `develop` or `main` — open a PR.

## Repo configuration

GitHub default branch must be `main`. Verify:

```bash
gh repo view --json defaultBranchRef -q .defaultBranchRef.name
# expected: main
```

To fix:

```bash
gh repo edit --default-branch main
git remote set-head origin main
```

## Sync local main after a release merge

```bash
git checkout main
git pull origin main
git checkout develop
```
