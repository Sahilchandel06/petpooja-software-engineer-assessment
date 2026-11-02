# TaskFlow Project Context

## Project summary and stack

Build the TaskFlow resilient Kanban assessment from `docs/ASSESSMENT.pdf`, the single source of truth. Step 1 establishes runnable client and server skeletons. Keep `client/` and `server/` as separate application roots in this repository.

- Client: React, Vite, Tailwind CSS, Zustand, `@dnd-kit`, `react-hot-toast`, axios; plain JavaScript.
- Server: Node.js, Express, Mongoose with MongoDB, zod validation; plain JavaScript.
- Selected wildcard: Option 3, nested checklists with animated progress bars.

## RULES FOR THE AI

- Plain JavaScript only. Clean client/ and server/ separation.
- Small, readable code with comments explaining WHY, because I must defend every line in a live interview.
- Never add a library I have not approved.
- Never build beyond the current step.
- Never invent AI mistakes. Only log a mistake in the AI MISTAKES LOG if it truly happened.
- Never run git commands yourself. Only PRINT them for me to run.
- Ask me before deviating from the spec.
- Use the existing `feature/project-setup` branch for all remaining steps; do not create a new branch per step. Push each step's commits to this same feature branch and merge the completed work into `main` through a Pull Request.

Branch continuity: keep `feature/project-setup` active through the remaining steps. Step prompts may name a temporary branch, but this persistent user preference takes precedence. Defer PR creation and branch cleanup until the final implementation is ready, then merge one PR to `main`.

## STEP-END PROTOCOL

STEP-END PROTOCOL (do this at the end of EVERY step, in this order):
A. Update CONTEXT.md: mark the step DONE, update requirement statuses, record decisions, known issues,
   the next step, and the branch name.
B. "Defend it" section: the call stack or flow of what we built, the trade-offs, and 3 likely
   interview questions with answers.
C. "How to verify" section: exact commands and manual checks I should run before committing.
D. GIT COMMANDS section, printed as copy-paste shell blocks, containing:
   1. Verification: git status
   2. Atomic commits: group the changed files logically and give, for each group,
      "git add <specific paths>" followed by "git commit -m '<conventional message>'".
      Use feat / fix / chore / docs / refactor / test / style. Always include CONTEXT.md in the LAST commit
      of the step as "docs: update context after <step>".
   3. Push: git push -u origin <branch>
   4. Pull Request: the PR title and a short description. Tell me to merge it on GitHub (not locally).
   5. Cleanup: git checkout main && git pull origin main && git branch -d <branch>
E. Tell me the exact next step name and wait for my "go".

## Requirements status

| ID | Status |
|---|---|
| R1 | In progress |
| R2 | Done |
| R3 | Done |
| R4 | Done |
| R5 | Done |
| R6 | Done |
| R7 | Done |
| R8 | Done |
| R9 | Done |
| R10 | Done |
| R11 | Done |
| R12 | Done |
| R13 | Done |
| R14 | Done |
| R15 | Done |
| R16 | Done |
| R17 | Done |
| R18 | In progress |
| R19 | In progress |
| R20 | In progress |
| R21 | In progress |

Status meanings: Not started / In progress / Done / Verified. Use “Done” for implemented and documented; “Verified” only after the stated verification has actually been performed.

## Step log

| # | Step | Status |
|---:|---|---|
| 1 | project-setup | DONE |
| 2 | server-task-api | DONE |
| 3 | kanban-crud-ui | DONE |
| 4 | drag-and-drop | DONE |
| 5 | optimistic-ui | DONE |
| 6 | concurrency | DONE |
| 7 | theme-support | DONE |
| 8 | wildcard-checklist | DONE |
| 9 | tests-and-polish | DONE |
| 10 | readme-docs | DONE |
| 11 | decisions-md | DONE |
| 12 | final-audit | DONE |

## Key architecture decisions

- Use the fixed MERN stack and plain JavaScript as requested, even though the PDF permits alternatives and TypeScript.
- Use Zustand for client state and zod for request validation, per the requested stack.
- Use `@dnd-kit` sensors and sortable contexts for card interaction; pointer drag requires 8px movement so clicks remain clicks, and keyboard dragging uses sortable coordinates.
- Keep Express configuration in `src/app.js`; `src/server.js` loads environment values, connects MongoDB, then starts listening.
- Put the Axios API base URL in `VITE_API_URL` and expose it through one shared client instance.
- Use Tailwind CSS v3 with `darkMode: 'class'`. PostCSS and Autoprefixer are included as Tailwind build plumbing.
- Use root `concurrently` to run both development servers together.
- For production, the user has selected MongoDB Atlas and wants the site deployed to cloud hosting. Local `.env` examples remain for development; deploy the API with Atlas `MONGO_URI` and the exact frontend `CLIENT_ORIGIN`, then build the static client with `VITE_API_URL` pointed at the deployed API. Hosting provider selection is pending.
- Implement only wildcard Option 3: nested checklist and animated completion progress.
- Step 1 adds the Node/Express and Vite/React skeletons, lockfiles, a health route, and a client health check. Task features remain for their later steps.
- Step 2 adds a Mongoose Task model with timestamps, explicit `version`, subtasks, tags, and the `{ columnId, orderIndex }` index.
- Use numeric fractional positions. Append by adding 1000; insert between neighbors with a midpoint; rebalance to spaced 1000 increments when a neighboring gap reaches epsilon.
- Keep ordinary task PATCH updates separate from column/order moves; a dedicated `/move` route is reserved for step 4.
- Use `asyncHandler` to forward Promise failures to Express 4's central JSON error handler. Zod body validation and ObjectId path validation reject invalid requests with HTTP 400.
- Apply `x-simulate-fail: true` only to POST/PATCH/DELETE routes.
- `npm run seed` resets only the Task collection and creates 15 sample tasks (5 per column) with varied priorities, tags, and completed/partial subtasks.
- Normalize client tasks as `tasksById` plus ordered ID arrays for each column, so cards subscribe only to their own task record and columns subscribe only to their order list.
- Keep one Axios API function per task endpoint and put all board state transitions in the Zustand store.
- Step 3 adds responsive three-column rendering, task create/edit/delete dialogs, loading/empty/error states, and memoized cards.
- The step 3 arrow controls update local Zustand state; step 4 converts them to the same persisted `moveTask` action used by drag-and-drop.
- Step 4 adds a droppable target for every column (including empty ones), an overlay preview, same-column/cross-column placement, and a client fractional-index helper.
- `moveTask(taskId, toColumnId, targetIndex)` updates normalized state first, then PATCHes the move endpoint with the current version and generated operation ID.
- Step 4 initially used one `findOneAndUpdate` with `$set` for column/order and `$inc` for version; Step 6 now filters that update by the observed version and wraps it with transactional idempotency/rebalance handling.
- Snapshot every mutation before changing Zustand. Moves retain the old task and affected column ID arrays; edits retain the old task; deletes retain the task and its prior column position; creates retain the prior column IDs and use a temporary `temp-*` ID.
- All four mutations update the board before the request. Success reconciles from the API response (including the server task ID, `orderIndex`, and `version`); failure restores the snapshot and shows one `react-hot-toast` error.
- Configure the shared Axios client with a 10-second timeout and a development-only request switch that adds `x-simulate-fail: true` to write requests. Read requests are not modified.
- Mutations do not set the board loading state or refetch tasks; request failures work both for server 500 responses and no-response/timeout network errors.
- Step 6 serializes move HTTP writes through a shared FIFO queue while keeping each optimistic move synchronous. Move IDs are RFC 4122 UUIDs and a no-response/timeout retry reuses its original request body and operation ID.
- Queue failure policy: restore the failed task from its last confirmed server record and drop later queued operations for that same task; retain other tasks' operations and resolve their before/after neighbor anchors when they reach the front. This avoids applying a dependent drag over an unknown state without penalizing independent cards.
- Keep `confirmedTasksById` separate from optimistic `tasksById`. Each queued move reads the latest confirmed version when sent; successful responses update the version while preserving a later optimistic location for that card.
- `/api/tasks/:id/move` validates UUID and version, checks idempotency, and performs order changes in a MongoDB transaction. Its conditional `findOneAndUpdate({ _id, version }, { $set, $inc: { version: 1 } })` is the final task write; a stale version returns 409 with `error.currentTask` for client reconciliation.
- `MoveOperation` keeps the UUID, request identity, result, and expiry. A unique operation-ID index prevents duplicate application; a 24-hour TTL index cleans records. The server builds these indexes before listening.
- When target neighbors have a gap at or below epsilon, the move transaction spaces the destination column's existing tasks, increments their versions, and returns those rebalance records with the moved task so the client reconciles without refetching.
- MongoDB transactions require a replica set. MongoDB Atlas works; local standalone deployments receive a 503 with the `mongod --replSet rs0` / `rs.initiate()` setup path. There is no unsafe non-transaction fallback.
- Task creation is protected from same-tick duplicate submits by both the disabled pending button and a synchronous form ref guard.
- `server/scripts/concurrencyTest.js` uses five concurrent distinct moves, replays an operation UUID, checks a stale-version 409, and asserts no lost/duplicate test cards and distinct ordered positions. It was not run because it writes to the configured database.
- Step 7 sets the `dark` class from localStorage/system preference in a blocking head script before React starts; `useTheme` toggles and persists the choice, and listens for changes from another tab. The `ThemeToggle` announces the current mode and the mode it will switch to.
- Keep the initial palette change instantaneous: no color transition is applied to the page on mount. React only hydrates after the root class already matches the saved/system theme.
- Contrast was calculated using WCAG relative luminance for implemented text/background pairs. Light/dark ratios include body 17.06:1 / 18.41:1; muted text 4.76:1 minimum / 6.96:1 minimum; tags 9.45:1 / 8.40:1; priority badges Low 8.57:1 / 11.81:1, Medium 8.15:1 / 12.03:1, High 7.97:1 / 11.08:1. Other pairs and exact surfaces are recorded under Step 7 verification below.
- Dark styles cover board, columns, cards, tags, priorities, forms, errors, drag preview, skeletons, and toast surfaces. Scrollbars and focus rings adapt to the root theme class.
- Step 8 checklist writes use dedicated endpoints: add uses `$push`, toggle/rename uses `subtasks.$` with `$set`, and delete uses `$pull`. Each also uses `$inc: { version: 1 }`; general task PATCH no longer accepts a whole `subtasks` array, preventing accidental replacement writes.
- Checklist edits bump the shared task version. This treats version as the revision for any task mutation, so a move based on an older task receives the existing 409 and reconciles current state. The trade-off is that a checklist-only change can conflict with an otherwise independent move; this favors explicit reconciliation over silent stale writes.
- Client checklist changes update Zustand optimistically and snapshot the prior subtask array. Success reconciles the returned task/version; failure restores the checklist snapshot and shows the existing toast. New-task checklists remain local until optimistic task creation sends them in the create body.
- Cards calculate completed/total and percentage from their subtask array. Progress bars expose min/max/now/text semantics, animate width changes, respect reduced-motion preferences, and report 0/0 as 0% without division by zero.
- Seed data includes partial and complete checklists across the board for evaluating progress states.
- Step 9 adds `node:test` + Supertest + MongoDB Memory Server replica-set integration coverage on the server, plus Vitest store tests on the client. A replica set is needed to exercise transactional move behavior.
- Step 9 adds ESLint flat configs and scripts for both app roots, root `npm test`, `npm run lint`, and the assessment-required root `npm run seed` forwarding script.
- Step 9 adds a reusable focus-management hook to trap Tab navigation inside dialogs, close with Escape, and return focus to the opener.
- Server test binaries use `server/test/.mongodb-binaries` so the test runner does not need to write outside the repository workspace.
- Step 9 verifies 7 server tests and 3 client store tests; root `npm test` passes. Both ESLint scripts and the client production build pass. Tests cover fractional indexes, CRUD/status validation, stale move conflicts, idempotent replay, five simultaneous moves, atomic checklist edits, optimistic move, rollback, and FIFO ordering.
- Step 9 audit fixed the missing root `npm run seed` forwarding script, added root `test`/`lint` scripts, removed the accidental client file dependency, added dialog keyboard focus management, and removed production `console.log` calls. No console.log calls remain under client/server source or scripts.
- Step 10 adds the root README with project overview, Mermaid architecture, representative folder tree, prerequisites, local/Atlas replica-set notes, environment setup, run/seed/test commands, optimistic-failure demo, concurrency script usage, API reference, theme behavior, and a screenshot placeholder.
- The server env template covers `MONGO_URI`, `PORT`, and `CLIENT_ORIGIN`; the client env template covers `VITE_API_URL` with the `/api` prefix. Both use local development values and contain no credentials. No env template changes were needed.
- Step 10 verified the documented root test/lint/build commands: `npm test`, `npm run lint`, and `npm run build --prefix client` all pass. The API table was checked against `server/src/routes/taskRoutes.js`; the documented concurrency command matches the server script name.
- Step 11 adds root `DECISIONS.md` with first-person answers to the four required assessment questions. Its AI retrospective uses only incidents already listed in this file's AI MISTAKES LOG; no new examples were invented.
- `DECISIONS.md` describes the current implementation separately from proposals. The scale analysis identifies the unpaginated `GET /api/tasks` and full client render as the first performance bottleneck, then proposes per-column cursor pagination, indexed neighbor lookups, windowed rendering, and granular live events.
- Step 11 verification passed: all four decision headings are present, the retrospective examples match the existing mistake log, `npm test` passes (7 server and 4 client tests), `npm run lint` passes, and the client production build passes.
- Step 12 audits R1–R21 against the assessment and source lines. It corrected the PDF transcript character encoding in `docs/REQUIREMENTS.md`, aligned R15/R17 statuses with completed deliverables, corrected the README tree rendering, and left R1 in progress because deployment is not configured.
- Final compliance audit re-read the 3-page source PDF and compared it with the transcript in `docs/REQUIREMENTS.md`. The complete-mastery/live-walkthrough requirement is now explicit in R21, including the arbitrary hook, middleware, or controller path from client render to database write. No other substantive source requirement was missing from the transcript.
- Final compliance audit re-inspected the implementation files and found no feature-level FAIL that warranted refactoring. It confirmed that only wildcard Option 3 (nested checklist/progress) exists. R1 remains in progress because no deployment is configured; R18-R20 and the candidate's live-defense ability remain unverified external requirements.
- Final audit verification reran `npm test` (7 server + 4 client tests passed), `npm run lint` (server and client passed), and `npm run build --prefix client` (passed). The standalone concurrency script, browser/manual checks, deployment, Git history, remote branch/PR state, and secret history were not verified. The AI must not run Git commands.

## AI MISTAKES LOG

- The first client `package.json` draft accidentally gave the PostCSS dependency a leading space (`" postcss"`). Review caught the invalid package key; it was corrected to `"postcss"` before the successful dependency install and client build.
- Starting root, client, and server npm installs concurrently during setup caused npm to record the parent project as a temporary server dependency. I removed that dependency, pruned its generated link, and removed the extraneous parent entry from `server/package-lock.json`.
- The first DnD draft imported `useDroppable` from `@dnd-kit/sortable` instead of `@dnd-kit/core`; I corrected the import before the successful client build.
- The first optimistic mutation draft left error toasts in both the store and its components; I moved failure toasts into the store so each rollback produces one toast.
- While wiring Step 8's rename-save callback, my first edit omitted the closing brace for its changes object. A source inspection caught the syntax error before verification; I corrected the object literal before the Step 8 verification run.
- The first Step 9 API test setup used a suite hook whose startup overlapped requests while MongoDB Memory Server was still downloading. I changed setup to top-level await so API tests cannot start until the replica set and indexes are ready.
- Client lint caught an unused caught-error binding in the delete dialog; I removed the binding while retaining the rollback's pending-state reset.
- During the UI redesign, the first lint run caught an unused column-index variable left after replacing adjacent-column menu actions with direct destination actions; I removed the variable.
- The optimistic create success path initially kept the temporary ID in the column order while deleting its task record. Sorting then read `orderIndex` from an undefined task after the server had already returned 201, so the UI showed a false failure although the task was saved. I remove the temporary ID before inserting the server task and added a client store regression test for create reconciliation.

## Known issues

- Server dependency installation reported 7 npm audit vulnerabilities (6 moderate, 1 high); client install reported 9 (7 moderate, 2 critical). Do not auto-upgrade dependencies; review during final audit.
- The seed command intentionally deletes every document from the Task collection before inserting its sample board. Do not run it against a database containing tasks that need to be kept.
- Appending reads the last order index and then inserts; simultaneous POST requests can choose the same index. The assessment's rapid-move requirement is covered, but concurrent create ordering remains a known limitation.
- Move rollback/conflict handling now covers queued moves; overlapping edit/delete requests against the same task are not serialized by the move queue.
- Versioned `/move` writes require a MongoDB replica set; local standalone MongoDB returns a documented 503 until configured as a replica set.
- The standalone `server/scripts/concurrencyTest.js` was not separately run; the Step 9 integration suite exercised five concurrent moves against a replica-set MongoDB Memory Server.
- Step 7's visual reload checks in both themes and browser verification have not been run yet; contrast ratios are computed from the palette hex values and implemented classes.
- Step 8 atomic checklist API behavior is covered by the passing integration suite. Client checklist rollback/progress UI and seed contents still need manual verification.
- The high-scale pagination, virtualization, live event, and version checks for all edit/delete operations in `DECISIONS.md` are proposals only, not implemented features.
- Production database preference is MongoDB Atlas. Deployment is not configured yet because the hosting provider is not selected; R1 remains in progress until the app is hosted and reachable.
- The documented single-branch workflow has not yet been merged into `main`. Git branch and commit history, PR count, public repository state, and whether secrets ever entered history must be checked by the user before submission.
- The required 48-hour submission timing and the candidate's ability to explain/live-modify code cannot be proven from repository files; the candidate must verify timing and demonstrate mastery during the review.
- No `.env` files are committed. Copy the examples and configure MongoDB locally before running the apps.
- Git branch checkout, remote configuration, and commit state were not verified because the AI must not run Git commands. At Step 6 start, `.git/HEAD` recorded `feature/project-setup`; the user confirmed this is the branch to use for all remaining steps. Earlier Step 1–5 commits may not be on `main` yet.

## Last updated, current branch, last commit

- Last updated: 2026-11-02
- Branch workflow: continue on `feature/project-setup` for all remaining steps; push each step's commits there and open one PR to `main` when ready. The user confirmed this branch in their IDE/GitHub view.
- Last commit: not inspected (Git commands are reserved for the user)

## Previous step defense: theme-support

Step 7 theme flow: the browser parses `index.html` and synchronously reads `taskflow-theme`; when no valid value exists, it reads `prefers-color-scheme`. The inline script applies `dark` to `<html>` before CSS is painted and before Vite's React module runs. React mounts `Header` and `ThemeToggle`; `useTheme` initializes from that already-set root attribute. A button activation toggles the root class/data attribute, updates React state, and persists localStorage. The `storage` listener mirrors explicit theme changes from other tabs. No initial color transition is used, so reload starts directly in the selected palette.

An effect-only initializer flickers because effects run after React renders and the browser may paint first. The first frame can therefore use the default light styles before the effect reads localStorage and applies dark mode. The blocking head script runs before that first themed paint.

Contrast pairs were calculated with WCAG relative luminance for each distinct text/background token pair in the current components. Primary/body text: slate-900/slate-50 (17.06:1), slate-100/slate-950 (18.41:1), slate-100/slate-900 (16.30:1), slate-900/white (17.85:1), white/slate-950 (17.85:1), white/slate-900 modal (17.85:1), white/slate-800 card (14.63:1). Secondary/labels: slate-600/white (7.58:1), slate-600/slate-50 (7.24:1), slate-500/white (4.76:1), slate-600/slate-100 empty-state (6.92:1), slate-400/slate-900 (6.96:1), slate-400/slate-950 (7.87:1), slate-400/slate-800 (5.71:1), slate-300/slate-800 (9.85:1), slate-300/slate-900 (12.02:1), slate-300/slate-950 (13.59:1), slate-300/slate-700 hover (6.97:1), slate-700/slate-50 (9.90:1). Column/tag/control text: slate-800/white (14.63:1), slate-800/slate-100 (13.35:1), slate-700/white (10.35:1), slate-700/slate-100 (9.45:1), slate-200/slate-700 (8.40:1), slate-200/slate-900 (14.48:1), slate-100/slate-800 (13.35:1), slate-100/slate-700 (9.45:1), slate-200/slate-950 (16.36:1). Indigo labels/buttons: indigo-700/slate-50 (7.55:1), indigo-300/slate-950 (10.12:1), indigo-700/white (7.90:1), indigo-700/indigo-50 hover (7.07:1), indigo-300/slate-800 hover (7.34:1), indigo-300/slate-700 hover (5.19:1), white/indigo-600 button (6.29:1), white/indigo-700 hover (7.90:1). Rose/error controls: rose-700/white (6.29:1), rose-700/rose-50 hover (5.72:1), rose-300/slate-800 (7.74:1), rose-300/slate-700 hover (5.48:1), white/rose-700 button (6.29:1), white/rose-600 hover (4.70:1). Priority badges: Low emerald-900/emerald-100 (8.57:1), dark emerald-200/emerald-950 (11.81:1); Medium amber-900/amber-100 (8.15:1), dark amber-200/amber-950 (12.03:1); High rose-900/rose-100 (7.97:1), dark rose-200/rose-950 (11.08:1). Error blocks/buttons: red-900/red-50 (9.16:1), red-100/red-950 (13.22:1), white/red-800 (8.31:1), white/red-700 hover (6.47:1). The minimum active text pair is 4.70:1, above WCAG AA's 4.5:1 threshold. Disabled controls keep full text opacity; decorative scrollbar and focus indicators are non-text visuals.

Likely interview questions:

1. **Why initialize the theme in HTML instead of only in a React effect?** HTML's blocking script runs before first paint and before React; an effect runs after render and may run after a light frame is already visible.
2. **How does theme persistence work?** The hook applies the selected class to `<html>` and stores `light` or `dark` under `taskflow-theme`; initial page load reads that value, otherwise it follows the OS preference.
3. **How did you check accessible contrast?** I calculated relative luminance ratios for the actual Tailwind palette pairs used for body, muted text, tags, errors, controls, and all priority badges in both themes; the smallest recorded text ratio is 4.70:1, above 4.5:1.

Step 6 concurrency defense: five rapid drags update the board immediately while a FIFO queue sends writes serially. Each request reads the latest confirmed version; a same-UUID retry is idempotent, a stale version returns `currentTask`, and dependent queued operations for a failed task are dropped while independent cards continue. Transactions keep versioned moves, neighbor rebalancing, and operation records consistent. The script is present but has not been run against MongoDB.

## Defend it

Toggling a checklist item starts in `TaskModal.toggleSubtask`. The modal locks checklist controls for that request, then calls the Zustand `updateSubtask` action. The store snapshots the task, updates that subtask in the visible task immediately, and sends `PATCH /api/tasks/:id/subtasks/:subtaskId`. Zod validates the path IDs and allowed title/completed fields. The controller uses a positional `$set` and `$inc` on the task version, returning the updated task. The store reconciles the confirmed task/version. If the request fails, it restores the snapshot and reports the failure through the existing toast; the modal also displays an inline checklist error. The progress bar subscribes through the task card and recalculates from the updated checklist.

Checklist changes increment `version` because it represents the task revision. A move carrying the earlier version then matches no task and returns 409 with `currentTask`; the client reconciles that task. Since checklist operations target only one subdocument and moves target only column/order fields, the database writes remain atomic and do not replace one another's fields. The deliberate trade-off is an occasional 409 for two logically independent edits.

Likely interview questions:

1. **Why use `$push`, positional `$set`, and `$pull`?** Each operator changes only the requested array item or appends/removes one item, so concurrent requests cannot overwrite a stale copy of the whole checklist.
2. **Why does a checklist toggle increment the task version?** The version tracks all mutations to a task. A move from a stale snapshot receives a conflict and current server task rather than proceeding without noticing the checklist edit.
3. **How does progress work for an empty checklist?** It shows `0/0 · 0%`; the bar value is zero with an accessible nonzero maximum, and the percentage calculation avoids dividing by zero.
## How to verify

- Run `npm run build --prefix client`.
- Start the app with `npm run dev` from the repository root and connect to the configured MongoDB database.
- Run `npm run seed --prefix server` only against a disposable database because it deletes all tasks before inserting sample data. Confirm seeded cards include partial and complete checklists.
- Open an existing task's modal. Add a checklist item, toggle it, rename it using Enter or Save, then remove it. Confirm each edit appears immediately, persists after reopening/refreshing, and the progress label/bar updates.
- Turn on the simulated-failure switch and repeat add, toggle, rename, and delete. Confirm each optimistic change rolls back, the task's other checklist items remain, and an error toast appears.
- Create a new task with checklist items, toggle/rename/remove items before submission, save it, and confirm the checklist persists.
- Confirm a card with no checklist shows `0/0 · 0%` and exposes valid progressbar `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`; toggle an item and confirm the bar animates. Emulate reduced motion and confirm the width transition is disabled.
- Endpoint checks (replace IDs with real values):

```sh
curl.exe -X POST http://localhost:5000/api/tasks/TASK_ID/subtasks -H "Content-Type: application/json" -d "{\"title\":\"Review checklist\"}"
curl.exe -X PATCH http://localhost:5000/api/tasks/TASK_ID/subtasks/SUBTASK_ID -H "Content-Type: application/json" -d "{\"completed\":true}"
curl.exe -X PATCH http://localhost:5000/api/tasks/TASK_ID/subtasks/SUBTASK_ID -H "Content-Type: application/json" -d "{\"title\":\"Review final checklist\"}"
curl.exe -X DELETE http://localhost:5000/api/tasks/TASK_ID/subtasks/SUBTASK_ID
```

- Confirm POST returns 201, PATCH/DELETE return 200, malformed IDs/bodies return 400, missing task/subtask IDs return 404, and each successful checklist edit increments task `version`.
- Previous Step 5/6 and Step 7 manual checks still apply; their integration and browser checks remain unverified.

## Step 9 defense

Store test flow: a test calls `moveTask`, which synchronously changes normalized Zustand state, then enqueues the network write. A success resolves the mocked API and leaves the moved task in its new column; a failure restores the task and both affected column ID lists and calls the toast error handler. The queue test enqueues three asynchronous requests and checks that each starts only after the previous request settles. Server integration tests start a single-node replica set, connect Mongoose, build indexes, and exercise HTTP handlers through Supertest.

Trade-offs: `node:test` avoids a separate server test runner, while Supertest exercises actual Express middleware/controller behavior. MongoDB Memory Server gives realistic transaction and index behavior but requires a large test-only MongoDB binary download. Vitest runs store tests without a browser DOM because these are state transition tests; it does not replace manual accessibility or responsive-layout review. The focus hook centralizes dialog keyboard behavior but uses a focused selector list rather than a full accessibility library.

Likely interview questions:

1. **Why run server integration tests on a replica set?** The move path uses transactions for idempotency, version checks, and rebalancing. A standalone MongoDB cannot test those transaction semantics.
2. **What does the client rollback restore?** It restores the moved task record plus the previous ordered ID lists for its source and destination columns, so the card returns to its original position without refetching the whole board.
3. **How does the modal support keyboard users?** On open, focus enters the dialog; Tab and Shift+Tab loop within it, Escape calls the close handler, and unmount restores focus to the element that opened it.

## Step 9 verification

- `npm test` passed: 7 server tests and 4 client tests.
- `npm run lint` passed for server and client.
- `npm run build --prefix client` passed.
- Manual browser checks for keyboard focus restoration, mobile layout, empty/error/loading states, theme reload, and live optimistic rollback remain recommended before the final submission.
- `npm run seed` is destructive to the configured Task collection; only run it against a disposable database.

## Step 10 defense

The README presents the system from the user-facing app down to its persistence path: React components call Zustand actions, the shared Axios layer calls Express routes, validation middleware checks input, controllers apply MongoDB operations through Mongoose, and the client reconciles the returned result. Its setup section separates root/client/server installs and documents that transactions require a replica set. The API table and command snippets were checked against the route definitions and package scripts.

Trade-off: a single root README is easy for an evaluator to follow, while environment files remain beside the app that consumes them. The README includes a screenshot placeholder instead of a fabricated capture. It also warns that seeding is destructive and that the dedicated concurrency script needs both the API and MongoDB running.

Likely interview questions:

1. **Why does local setup mention a MongoDB replica set?** The move handler uses transactions for idempotency and rebalancing; standalone MongoDB cannot execute those writes.
2. **Why are environment templates split by app?** Server-only database and CORS settings stay in `server/.env`; Vite exposes only the API URL to browser code.
3. **Why include a screenshot placeholder?** It marks the intended documentation location without implying a screenshot was captured or checked in.

## Step 10 verification

- Confirm the README command names match the root and server `package.json` scripts.
- Confirm both example files contain the required variables and no database credentials or tokens.
- Follow the setup instructions with a disposable local replica-set database; verify `/api/health` from the browser.
- Run `npm test`, `npm run lint`, and `npm run build --prefix client` using the instructions documented in the README.
- Verify the concurrency script only after starting the API and configuring a disposable replica-set database.

## Step 11 defense

The document answers the assessment's four questions in first person. It compares the selected Zustand store with Redux Toolkit and Context plus `useReducer`, traces five optimistic drags through the client queue and conditional transactional move endpoint, limits the AI retrospective to incidents in the existing mistake log, and analyzes the current unpaginated list/read and render path before proposing scale changes.

Trade-off: this is a design explanation rather than new application behavior. It explicitly distinguishes existing code from proposed pagination, windowing, event delivery, and edit/delete concurrency work; those proposals should not be mistaken for implemented features.

Likely interview questions:

1. **Why does the browser serialize moves if the server uses versions?** The FIFO preserves this browser's intended order and supplies each request the latest confirmed task version; server version checks still defend against other clients.
2. **What is the first scale bottleneck?** The current `GET /api/tasks` returns the full collection and the browser builds the full board. Cursor pagination and windowed rendering would bound the initial work.
3. **What is not protected for collaboration?** Ordinary edits do not send an expected version, and clients receive no live events from other browsers. I call those gaps out instead of claiming full collaborative behavior.

## Step 11 verification

- Compare each `DECISIONS.md` heading with the four mandatory questions in `docs/ASSESSMENT.pdf` / `docs/REQUIREMENTS.md`.
- Verify each AI retrospective example appears in the existing `CONTEXT.md` AI MISTAKES LOG.
- Confirm high-scale recommendations are labeled as proposals, not current features.
- Run `npm test`, `npm run lint`, and `npm run build --prefix client` before committing the documentation change.

## Step 12 defense

The final audit compares every checklist requirement with implementation files and the PDF rubric. The local verification path is reproducible: the server suite runs against an in-memory replica set, the client suite exercises Zustand transitions, ESLint checks both apps, and Vite builds the client. This does not verify public hosting, GitHub PR history, secret history, the 48-hour deadline, or a candidate's live defense.

Trade-off: I did not run Git commands because the project rules reserve them for the user. I therefore report branch, commit, PR, and historical secret checks as pending instead of presenting the working tree as proof. The single documented feature branch still needs a PR merged to `main`; a deployment target also remains unspecified.

Likely interview questions:

1. **Which checks can be reproduced locally?** `npm test`, `npm run lint`, and `npm run build --prefix client` all pass. Browser-specific accessibility/theme checks and a real deploy still need human verification.
2. **Why is R1 still in progress?** The PDF's project mission says to deploy the application, but this repository has no configured hosting target or live deployment.
3. **What must happen before evaluation?** Verify the public repository, branch and commit history, PR merge into `main`, absence of secrets in history, and clean-clone setup; then demonstrate code ownership in the live defense.

## Step 12 verification

- `npm test` passes with 7 server tests and 4 client tests.
- `npm run lint` passes for both server and client.
- `npm run build --prefix client` passes.
- `docs/REQUIREMENTS.md` transcript was checked against `pdftotext -layout docs/ASSESSMENT.pdf -`; the mojibake characters were corrected.
- Verify the env examples locally without displaying `server/.env`: `Get-Content server/.env.example`, `Get-Content client/.env.example`. Both must contain only non-secret development defaults.
- Run the GitHub/history verification commands listed in the final response from the clone after fetching `main`.

## GIT COMMANDS

The assessment requires feature-branch work merged through a Pull Request. These commands are for the user; no Git command has been run by the AI. Continue on the existing `feature/project-setup` branch for every remaining step, push that branch, and open a PR to `main` when the assessment is ready.

Verification:

```sh
git status
```

Atomic commits:

```sh
git add docs/REQUIREMENTS.md README.md
git commit -m "docs: fix transcript encoding and audit statuses"

git add CONTEXT.md
git commit -m "docs: update context after final-audit"
```

Push:

```sh
git push -u origin feature/project-setup
```

Pull Request:

- Final PR title (after the remaining steps): `feat: complete TaskFlow assessment implementation`
- Final PR description: Complete the assessment in ordered steps on `feature/project-setup`, with resilient task CRUD, concurrent moves, accessible themes, the selected checklist wildcard, tests, and required documentation. Merge the completed PR into `main` on GitHub, not locally.
- Open and merge the final PR only after the user has reviewed the audit's pending deployment and GitHub verification items.

Cleanup after the PR is merged:

```sh
git checkout main && git pull origin main && git branch -d feature/project-setup
```

Run this cleanup only after the final PR is merged on GitHub.

## HOW TO RESUME

Start by reading `CONTEXT.md` and `docs/REQUIREMENTS.md`, then read `docs/ASSESSMENT.pdf` if source detail is needed. Continue only the named current step; do not implement later steps early. Follow the fixed stack and AI rules above. Do not run Git commands; print the exact commands for the user. At each step end, update this file and provide the defend-it, verification, and Git command sections, name the next step, and wait for the user's “go”.

Next step: submission checklist (deployment and GitHub verification remain user actions; no more implementation step is planned).

## UI redesign follow-up

- Status: DONE for implementation; browser review and screenshot capture are still pending.
- Active branch: `feature/project-setup` (the user's persistent single-branch preference overrides the temporary branch in the UI prompt).
- Last updated: 2026-11-02.
- Scope: presentation-only redesign of the board, columns, cards, task/delete dialogs, empty/loading/error states, toasts, and shared controls. Store, API, move queue, optimistic rollback, and the blocking theme initializer were preserved.
- Approved additions: `lucide-react` for interface icons and `@fontsource-variable/inter` for a self-hosted font. No other package was added for this redesign.
- Responsive behavior: one column per row below the large breakpoint; three equal-width columns from large screens, filling a centered `max-w-7xl` page container with balanced side margins. No horizontal board scroll wrapper or independently scrollable column body; the document itself scrolls vertically when the task list exceeds the viewport.
- Component choices: shared Button, Badge, Avatar, Tooltip, IconButton, Input, and Select primitives live under `client/src/components/ui/`. TaskCard remains memoized and keeps per-task Zustand selectors. Its overflow menu exposes edit, delete, all destination columns, and vertical ordering actions; dedicated up/down buttons remain available.
- New-task dialogs opened from a column preselect that column. Existing tasks show their current status in the edit dialog; moving remains an explicit board action so the edit request does not silently change status.
- Design tokens: light app `#f4f5f7`, column `#ebecf0`, card `#ffffff`, primary text `#172b4d`, secondary `#44546f`, muted `#5e6c84`, accent `#0c66e4`; dark app `#101214`, column `#181b20`, card `#1d2125`, primary text `#dee4ea`, secondary `#b6c2cf`, muted `#9fadbc`, accent `#579dff`. Cards use 6px radius, columns 8px, controls 6px, badges 4px. Standard transitions are 140–160ms; checklist progress uses 300ms and respects reduced motion.
- Contrast calculations (WCAG relative luminance, normal text): light primary/app 12.93:1; secondary/column 6.48:1; muted/card 5.31:1; accent/app 4.77:1; high badge text/background 5.77:1; medium badge 5.68:1; low badge 5.76:1; white text/primary button 5.20:1. Dark primary/app 14.65:1; secondary/column 9.54:1; muted/card 7.08:1; accent/app 6.86:1; high badge 5.39:1; medium badge 6.38:1; low badge 6.25:1; dark button text/accent button 6.86:1. These are static token calculations; browser rendering and every OS-level native control still need visual review.
- README screenshot checklist now names light board, dark board, drag overlay, and task modal captures; no screenshots have been captured yet.
- Verification after this follow-up: client and server lint passed, `npm test` passed (7 server and 4 client tests), and the client production build passed. Manual checks: 375px, 768px, and 1280px widths; light/dark reload; keyboard card menu and dialogs; drag overlay; simulated rollback; progress-bar states.
- The assessment R1–R21 table above remains unchanged by this visual-only follow-up: the outstanding deployment/external workflow items remain in progress or unverified as previously recorded. A successful build is not a substitute for manual browser checks.
- Known issue: screenshots and manual browser/accessibility review have not been completed in this environment. Do not describe the UI as visually verified until those checks are run.
- User feedback led to a layout correction: removed the board minimum-width/scroll wrapper, fixed 280–360px column caps, and column `overflow-y-auto`. Columns now use equal flexible tracks and task lists use natural height; narrow screens stack the columns to avoid a horizontal scrollbar. After the correction, `npm run lint` and `npm run build --prefix client` both passed. Browser rendering at the target widths remains to be checked manually.
- Next step: submission checklist (deployment and GitHub verification remain user actions).
