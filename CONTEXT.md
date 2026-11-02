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
| R2 | In progress |
| R3 | Done |
| R4 | Done |
| R5 | Done |
| R6 | Done |
| R7 | Done |
| R8 | Done |
| R9 | Done |
| R10 | Done |
| R11 | Not started |
| R12 | Not started |
| R13 | Not started |
| R14 | Not started |
| R15 | Not started |
| R16 | Done |
| R17 | In progress |
| R18 | Not started |
| R19 | Not started |
| R20 | Not started |
| R21 | Not started |

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
| 7 | theme-support | TODO |
| 8 | wildcard-checklist | TODO |
| 9 | tests-and-polish | TODO |
| 10 | readme-docs | TODO |
| 11 | decisions-md | TODO |
| 12 | final-audit | TODO |

## Key architecture decisions

- Use the fixed MERN stack and plain JavaScript as requested, even though the PDF permits alternatives and TypeScript.
- Use Zustand for client state and zod for request validation, per the requested stack.
- Use `@dnd-kit` sensors and sortable contexts for card interaction; pointer drag requires 8px movement so clicks remain clicks, and keyboard dragging uses sortable coordinates.
- Keep Express configuration in `src/app.js`; `src/server.js` loads environment values, connects MongoDB, then starts listening.
- Put the Axios API base URL in `VITE_API_URL` and expose it through one shared client instance.
- Use Tailwind CSS v3 with `darkMode: 'class'`. PostCSS and Autoprefixer are included as Tailwind build plumbing.
- Use root `concurrently` to run both development servers together.
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

## AI MISTAKES LOG

- The first client `package.json` draft accidentally gave the PostCSS dependency a leading space (`" postcss"`). Review caught the invalid package key; it was corrected to `"postcss"` before the successful dependency install and client build.
- Starting root, client, and server npm installs concurrently during setup caused npm to record the parent project as a temporary server dependency. I removed that dependency, pruned its generated link, and removed the extraneous parent entry from `server/package-lock.json`.
- The first DnD draft imported `useDroppable` from `@dnd-kit/sortable` instead of `@dnd-kit/core`; I corrected the import before the successful client build.
- The first optimistic mutation draft left error toasts in both the store and its components; I moved failure toasts into the store so each rollback produces one toast.

## Known issues

- Server dependency installation reported 3 npm audit vulnerabilities (2 moderate, 1 high); review during tests-and-polish without applying unapproved version changes.
- The seed command intentionally deletes every document from the Task collection before inserting its sample board. Do not run it against a database containing tasks that need to be kept.
- Appending reads the last order index and then inserts; simultaneous POST requests can choose the same index. This is outside Step 6's move-write scope and remains for tests-and-polish review.
- Move rollback/conflict handling now covers queued moves; overlapping edit/delete requests against the same task are not serialized by the move queue.
- Versioned `/move` writes require a MongoDB replica set; local standalone MongoDB returns a documented 503 until configured as a replica set.
- The new concurrency script and transaction/rebalance paths have not been executed against MongoDB. API/client build verification remains pending.
- `README.md` and `DECISIONS.md` remain uncreated for their planned steps.
- No `.env` files are committed. Copy the examples and configure MongoDB locally before running the apps.
- Git branch checkout, remote configuration, and commit state were not verified because the AI must not run Git commands. At Step 6 start, `.git/HEAD` recorded `feature/project-setup`; the requested `feature/concurrency` branch command was printed but not executed. Earlier Step 1–5 commits may therefore not be on `main`.

## Last updated, current branch, last commit

- Last updated: 2026-11-02
- Current worktree branch recorded at Step 6 start: `feature/project-setup`; requested branch: `feature/concurrency` (checkout not verified)
- Last commit: not inspected (Git commands are reserved for the user)

## Defend it

Step 6 move flow: a drag/button calls `moveTask`, which records neighbor IDs and immediately updates the Zustand board. The action enqueues a task-scoped operation. When its turn arrives, it reads the latest confirmed version, rebases the target from available neighbor anchors, and sends one UUID-keyed PATCH. The server starts a session, returns an already-recorded result for an exact replay, checks the current version, optionally rebalances destination neighbors inside the transaction, and conditionally updates the moved task by `_id` plus version. It stores the result before commit. The client accepts server versions and any rebalance records. A 409 reconciles the returned current task; another failure restores the confirmed record, drops queued moves for that card, retains independent moves, and displays one toast.

For five drags in one second over a slow 3G connection: each drag updates Zustand immediately and enqueues a distinct UUID operation; only the first HTTP call starts. The next four wait FIFO while the first request is in flight. On each success, its server version becomes the version used by the next request, and neighbor anchors are resolved against current board order. If a move fails, later queued moves for that same card are dropped and the card returns to confirmed server state; moves for other cards continue. A lost response retries once with the identical UUID and payload, so server idempotency returns the original result instead of applying it twice. Version conflicts include currentTask and are reconciled.

The shared Axios request interceptor adds `x-simulate-fail: true` only to writes while the development switch is enabled and aborts requests after ten seconds. Store catch blocks restore state, translate HTTP/network/timeout errors into one toast, and rethrow so forms can keep their inline error. Mutations do not set the board loading flag.

Likely interview questions:

1. **Why have a FIFO queue if the UI is already optimistic?** It lets the user see every drag immediately but sends writes in order, preventing requests from racing with a stale version.
2. **What happens to five moves during a 3G delay?** The first writes immediately, the other four wait; each later request reads the latest confirmed version and resolves its anchors at send time. Same-task dependent requests are dropped after failure, independent requests continue, and a UUID retry is idempotent.
3. **Why use a transaction and operation collection?** The transaction groups neighbor reindexing, version-checked task update, and idempotency result record so none can commit without the others. The TTL collection prevents a replay from applying twice and expires old records automatically.
## How to verify

- Run `npm run build --prefix client`.
- Configure `server/.env` for a MongoDB replica set (Atlas works), then run `npm run dev` from the repository root.
- Run `npm run test:concurrency --prefix server` against a disposable database while the API is running; it creates and deletes five uniquely named temporary tasks.
- In the UI, drag five different cards within about one second. Confirm cards move immediately, network requests are sent serially, and final column membership/order persist after refresh.
- Send an old version to `/move`; confirm the client adopts `error.currentTask` and shows a conflict toast.
- Queue multiple moves rapidly and simulate a failure; confirm later moves for that same card are dropped and it returns to server state while unrelated card moves still complete.
- Replay one exact move request with the same operationId and payload; confirm task version increments only once. Verify an expired operation record is eventually removed by MongoDB's TTL monitor.
- Create two neighboring order indexes within epsilon, then move a card between them; confirm the destination column is rebalanced and visible cards retain order without a refetch.
- Manual Step 5 rollback checks remain applicable to create, edit, delete, and network failures.

## GIT COMMANDS

The assessment requires feature-branch work merged through a Pull Request. These commands are for the user; no Git command has been run by the AI. The worktree was on `feature/project-setup` at Step 6 start; branch from this history if Steps 1–5 are not yet on `main`.

Verification:

```sh
git status
```

Atomic commits:

```sh
git add client/src/store/operationQueue.js client/src/store/boardStore.js client/src/utils/fractionalIndex.js client/src/components/TaskModal.jsx
git commit -m "feat: serialize optimistic move operations"

git add server/src/models/MoveOperation.js server/src/controllers/taskController.js server/src/routes/taskRoutes.js server/src/app.js server/src/server.js
git commit -m "feat: enforce versioned idempotent task moves"

git add server/scripts/concurrencyTest.js server/package.json
git commit -m "test: add concurrent move integration script"

git add CONTEXT.md
git commit -m "docs: update context after concurrency"
```

Push:

```sh
git push -u origin feature/concurrency
```

Pull Request:

- Title: `feat: serialize versioned task moves with idempotency`
- Description: Add a client FIFO move queue, UUID retry safety, server version conflict responses, transactional idempotency and order rebalancing, and a concurrency integration script.
- Open a PR into `main` and merge it on GitHub, not locally.

Cleanup after the PR is merged:

```sh
git checkout main && git pull origin main && git branch -d feature/concurrency
```

## HOW TO RESUME

Start by reading `CONTEXT.md` and `docs/REQUIREMENTS.md`, then read `docs/ASSESSMENT.pdf` if source detail is needed. Continue only the named current step; do not implement later steps early. Follow the fixed stack and AI rules above. Do not run Git commands; print the exact commands for the user. At each step end, update this file and provide the defend-it, verification, and Git command sections, name the next step, and wait for the user's “go”.

Next step: `theme-support`.
