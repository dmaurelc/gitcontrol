# Phase 05 — Edición: crear branch + editar archivo + crear PR

## Overview
- Priority: P1 (opcional, ship 04 antes si tiempo limitado)
- Status: pending
- Estimated effort: L (12-16h)

Agregar capacidades escritura: crear branch desde UI, editar archivo individual (single-commit), crear PR. Sin merge desde explorer (usar tab `/pulls/[n]` existente con `MergePrButton`).

## Context links
- Phases 01-04 completas (lectura estable)
- Patrón existente edición server actions: `src/app/actions/create-repo.ts`, `src/app/actions/in-app-pr-merge` (`plans/260510-1230-in-app-pr-merge`)
- Patrón rate limit: `src/lib/rate-limit/check-rate-limit.ts` con `enforceRateLimit`
- Patrón `runAction`/`ActionResult` para typed errors

## Key insights
- GitHub `PUT /repos/{owner}/{repo}/contents/{path}` permite crear/editar archivo single-commit con base64 content + SHA actual
- Branch creation: `POST /repos/{owner}/{repo}/git/refs` con `ref=refs/heads/<name>` + `sha=<base>`
- PR creation: `POST /repos/{owner}/{repo}/pulls` con `title`, `head`, `base`, `body`
- OAuth scope `repo` requerido (no solo `public_repo`). Validar en login flow.
- Service.ts ya 2105 LOC → **MANDATORY split**: writes en `service-write.ts` separado

## Requirements

### Functional

**Crear branch:**
- Dropdown branches con CTA "+ Create branch"
- Modal: input nombre + select base branch (default: current)
- Validación nombre: `[a-zA-Z0-9._/-]+`, no empieza `/`, no contiene `..`
- Success: branch creada → auto-select en panel izq
- Rate limit `gh:write` 10/60s

**Editar archivo:**
- Panel derecho file diff item: botón "Edit" (visible solo en HEAD branch, no commits históricos)
- Confirmación: navegar a vista edit-mode panel derecho
- Editor: CodeMirror 6 (`@codemirror/state` + `@codemirror/view`) — lighter que Monaco (~80KB vs 2MB)
- Syntax highlighting por extension (`@codemirror/lang-*`)
- Botones: Cancel / "Commit changes"
- Modal commit:
  - Title input (required, max 72 chars)
  - Description textarea (optional)
  - Commit to: current branch | new branch (con name input)
  - Submit → API call con base64 encoded content + current file SHA

**Crear PR:**
- Cuando branch no es default y tiene commits diferentes: CTA "Create PR" en header explorer
- Modal:
  - Base branch select (default: repo default branch)
  - Head branch (preselect current)
  - Title input (pre-fill con último commit message)
  - Description textarea (markdown supported)
  - Draft toggle
- Submit → crear PR + redirect a `/pulls/[number]` existente

### Non-functional
- Optimistic UI: muestra branch creada en lista antes confirm API
- Rollback si falla API
- Confirmaciones doble-step para acciones destructivas (no aplica MVP, no delete)
- Logs server-side de mutaciones (audit trail mínimo)

## Architecture

```
ExplorerLayout
├── Branches Panel
│   └── BranchesList
│       └── CreateBranchTrigger → CreateBranchDialog
├── Commits Panel
│   └── CreatePrButton (condicional) → CreatePrDialog
└── Right Panel
    └── FileDiffItem
        └── EditFileButton → EditFileMode
            ├── CodeEditor (CodeMirror)
            └── CommitChangesDialog
```

## Related code files

**Crear:**
- `src/lib/github/service-write.ts` — write methods (Octokit)
- `src/app/actions/repo-edit.ts` — server actions wrap
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/create-branch-dialog.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/edit-file-mode.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/code-editor.tsx` (CodeMirror wrapper)
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/commit-changes-dialog.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/create-pr-dialog.tsx`

**Modificar:**
- `src/lib/auth/auth.ts` — verificar OAuth scope incluye `repo` (no solo `read:user`/`user:email`)
- `src/lib/rate-limit/buckets.ts` (si existe) o config — agregar bucket `gh:write` 10/60s

## Implementation steps

1. **OAuth scope check:**
   - Leer config better-auth GitHub provider
   - Asegurar scopes: `repo`, `read:user`, `user:email`
   - Si users existentes tienen scope reducido, mostrar prompt re-auth on first write action

2. **Service writes (`service-write.ts`):**
   ```ts
   export const githubServiceWrite = {
     async createBranchRef(userId, owner, repo, branchName, baseSha) {
       const octokit = await getOctokit(userId);
       return octokit.rest.git.createRef({
         owner, repo,
         ref: `refs/heads/${branchName}`,
         sha: baseSha,
       });
     },
     async createOrUpdateFile(userId, owner, repo, path, content, message, branch, sha?) {
       const octokit = await getOctokit(userId);
       return octokit.rest.repos.createOrUpdateFileContents({
         owner, repo, path, message,
         content: Buffer.from(content).toString("base64"),
         branch, sha, // sha required for update
       });
     },
     async createPullRequest(userId, owner, repo, params) {
       const octokit = await getOctokit(userId);
       return octokit.rest.pulls.create({ owner, repo, ...params });
     },
   };
   ```

3. **Server actions (`repo-edit.ts`):**
   ```ts
   "use server";
   import { runAction } from "@/lib/actions/run-action";
   import { enforceRateLimit } from "@/lib/rate-limit/check-rate-limit";

   const createBranchSchema = z.object({
     owner: z.string(),
     repo: z.string(),
     branchName: z.string().regex(/^[a-zA-Z0-9._/-]+$/).max(244),
     baseSha: z.string().regex(/^[a-f0-9]{40}$/),
   });

   export const createBranchAction = runAction(createBranchSchema, async (input, ctx) => {
     await enforceRateLimit(ctx.userId, "gh:write", { max: 10, windowSec: 60 });
     return githubServiceWrite.createBranchRef(ctx.userId, ...);
   });
   ```
   Mismo patrón para `editFileAction` y `createPrAction`.

4. **CreateBranchDialog:**
   - shadcn `Dialog` con form
   - Submit → server action → on success: invalidate cache `gh:branches:*`, `revalidatePath`
   - Toast feedback

5. **CodeEditor wrapper:**
   - `@uiw/react-codemirror` package (wrapper React simple para CodeMirror 6)
   - Language detection por extension del path
   - Dark/light theme match `next-themes`

6. **EditFileMode:**
   - Fetch current file content via `getContent(path)` con `ref=current_branch`
   - Decode base64 → texto
   - Render CodeEditor con initial value
   - Track dirty state
   - "Commit changes" → abre `CommitChangesDialog`

7. **CommitChangesDialog:**
   - Form: title, description, target (current branch | new branch)
   - Si "new branch": input name
   - Submit:
     - Si new branch: createBranchAction first → editFileAction con branch nuevo
     - Si current: editFileAction directo
   - Auto-redirect a commit recién creado en explorer

8. **CreatePrDialog:**
   - Show solo si branch ≠ default y tiene commits ahead
   - Pre-fill title con último commit
   - Submit → createPrAction → redirect `/pulls/[number]`

## Todo list

- [ ] Verificar OAuth scope `repo` en better-auth config, ajustar si falta
- [ ] Crear `service-write.ts` con 3 métodos
- [ ] Server actions con Zod + rate limit
- [ ] Bucket rate limit `gh:write` 10/60s
- [ ] `pnpm add @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-typescript @codemirror/lang-markdown @codemirror/lang-json @codemirror/lang-html @codemirror/lang-css`
- [ ] `CodeEditor` wrapper con theme + language detection
- [ ] `CreateBranchDialog`
- [ ] `EditFileMode` con fetch content + editor
- [ ] `CommitChangesDialog` con create branch flow integrado
- [ ] `CreatePrDialog`
- [ ] Cache invalidation post-mutación
- [ ] Toast notifications éxito/error
- [ ] Manual test: crear branch → editar archivo → commit → crear PR end-to-end
- [ ] Test edge cases: file no existe (create new), SHA stale (conflict), rate limit hit
- [ ] Mensaje claro si OAuth scope insuficiente

## Success criteria

- Crear branch desde UI funciona y aparece en panel izq inmediatamente
- Editar archivo: cargar → modificar → commit → ver commit nuevo en panel centro
- Crear PR: branch divergente → form → PR creado → redirect tab pulls
- Rate limit funciona (no más 10 writes/min)
- Conflictos manejados con mensaje claro (SHA mismatch)
- No regresión en lectura (phases 01-04 intactas)

## Risks

- **OAuth scope upgrade**: usuarios existentes pueden tener scope reducido. Re-auth flow puede fricción. Documentar.
- **SHA conflicts**: si user edita archivo y otro commit aparece, PUT falla. Mostrar mensaje + opción refresh + retry.
- **CodeMirror bundle**: aún ~80KB. Lazy load solo al activar edit mode.
- **Path traversal**: aunque GitHub valida, doble-check en server action regex.
- **Audit log**: no incluido MVP. Considerar agregar tabla `repo_edit_audit` post-ship si necesidad.
- **Force push / branch protection**: si branch protegida, API falla. Mensaje claro al usuario.

## Security

- Validar path regex estricto: `^[a-zA-Z0-9._/-]+$`, max 256 chars
- Validar branch name regex: `^[a-zA-Z0-9._/-]+$`, max 244 chars (límite git)
- Rate limit `gh:write` 10/60s — previene abuse
- Confirmar UI antes de commit (review diff)
- Server actions verifican ownership (token usuario tiene scope `repo` y acceso al repo)
- No log content de archivos editados (puede contener secretos)
- Escape commit messages (XSS si renderizamos sin escape)

## Next steps
→ Tras ship: monitorear rate limit metrics, errors. Considerar:
- Edición multi-archivo en un commit (futuro)
- Audit log tabla
- Merge UI desde explorer (reusar `MergePrButton` existente)
- Renombrar/eliminar archivos
