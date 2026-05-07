# Phase 05 Implementation Report — Issue/PR Detail Pages, Comments, Close/Reopen, New Issue

## Phase
- Phase: `phase-05-issue-comments`
- Plan: `/Users/danielmc/Desktop/ProyectosDev/maureldev/plans/260506-1818-post-mvp-improvements/`
- Status: completed
- Branch: `feat/phase-05-issue-comments`
- Commit: `2a3cfda`

## Files Modified

| File | Change |
|------|--------|
| `src/lib/github/service.ts` | +8 methods + 5 exported types (Issue, IssueComment, IssueLabel, CreateIssueInput, PullRequest) |
| `src/app/actions/issues.ts` | NEW — commentIssueAction, closeIssueAction, reopenIssueAction, createIssueAction |
| `src/app/actions/pulls.ts` | NEW — commentPullRequestAction, closePullRequestAction, reopenPullRequestAction |
| `src/components/markdown-body.tsx` | NEW — "use client" wrapper for react-markdown + rehype-sanitize |
| `src/components/comment-form.tsx` | NEW — Write/Preview tabs, hidden inputs, useTransition submit |
| `src/app/(dashboard)/repositories/_components/issue-list.tsx` | Added `owner`/`repo` props for internal `Link`; external GitHub icon |
| `src/app/(dashboard)/repositories/[owner]/[repo]/issues/page.tsx` | Added "New issue" button; passes owner/repo to IssueList |
| `src/app/(dashboard)/repositories/[owner]/[repo]/issues/[number]/page.tsx` | NEW — full detail page (RSC) |
| `src/app/(dashboard)/repositories/[owner]/[repo]/issues/new/page.tsx` | NEW — new issue page (RSC shell) |
| `src/app/(dashboard)/repositories/[owner]/[repo]/issues/new/_components/new-issue-form.tsx` | NEW — client form with Write/Preview, title, body, labels |
| `src/app/(dashboard)/repositories/[owner]/[repo]/pulls/page.tsx` | Passes owner/repo to IssueList |
| `src/app/(dashboard)/repositories/[owner]/[repo]/pulls/[number]/page.tsx` | NEW — full PR detail page (RSC) |

## Tasks Completed

- [x] Service methods: getIssue, listIssueComments, createIssueComment, updateIssueState, createIssue, getPullRequest, listPullRequestComments, updatePullRequestState
- [x] Exported types: Issue, IssueComment, IssueLabel, CreateIssueInput, PullRequest
- [x] Server actions: issues.ts (4 actions), pulls.ts (3 actions) — zod validation, requireUserId, revalidatePath
- [x] Detail pages: issues/[number] and pulls/[number] — RSC, Promise.allSettled, error fallback via EmptyState
- [x] MarkdownBody component (client, rehype-sanitize)
- [x] CommentForm component (Write/Preview tabs, useTransition)
- [x] New issue form page + NewIssueForm client component (title, body+preview, labels)
- [x] IssueList: internal Link + external GitHub icon (owner/repo optional props — backward compatible)
- [x] "New issue" button on issues list page
- [x] Pulls list passes owner/repo for internal links

## Tests Status

- TypeScript: pass (tsc --noEmit, no output)
- Lint: pass (eslint, no output)
- Build: pass — all 6 new routes in route manifest, compiled in 5.6s

## Deferred Items

- Optimistic UI (marked optional in spec)
- Review comments on PRs (review-style, not issue-style; explicitly out of scope)
- Pagination for comments (currently fetches up to 50 per page; pagination UI deferred)
- Rate-limit guard on server actions (noted in phase doc as "futuro")

## Design Decisions

- `MarkdownBody` is a client component because react-markdown v10 uses client hooks internally; the RSC pages import it fine since Next.js boundary handles it.
- `listPullRequestComments` uses `rest.issues.listComments` against the PR number — matches GitHub API behavior where PR issue-thread comments live on the issues endpoint.
- `IssueList` `owner`/`repo` props are optional → both existing call sites (repo page) that don't pass them keep working unchanged.
- `createIssueAction` uses `redirect()` after create (Next.js standard); no try/catch wrapping it per spec.
- Close/Reopen is a plain `<form action={...}>` (no Dialog confirm) — simplest correct approach per spec.

## Unresolved Questions

None blocking. Build and type-check pass clean.
