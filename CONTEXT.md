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
| R9 | Not started |
| R10 | In progress |
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
| 6 | concurrency | TODO |
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
- The backend move controller performs one `findOneAndUpdate` with `$set` for column/order and `$inc` for version. Version conflict checks and operation-ID idempotency are reserved for step 6.
- Snapshot every mutation before changing Zustand. Moves retain the old task and affected column ID arrays; edits retain the old task; deletes retain the task and its prior column position; creates retain the prior column IDs and use a temporary `temp-*` ID.
- All four mutations update the board before the request. Success reconciles from the API response (including the server task ID, `orderIndex`, and `version`); failure restores the snapshot and shows one `react-hot-toast` error.
- Configure the shared Axios client with a 10-second timeout and a development-only request switch that adds `x-simulate-fail: true` to write requests. Read requests are not modified.
- Mutations do not set the board loading state or refetch tasks; request failures work both for server 500 responses and no-response/timeout network errors.

## AI MISTAKES LOG

- The first client `package.json` draft accidentally gave the PostCSS dependency a leading space (`" postcss"`). Review caught the invalid package key; it was corrected to `"postcss"` before the successful dependency install and client build.
- Starting root, client, and server npm installs concurrently during setup caused npm to record the parent project as a temporary server dependency. I removed that dependency, pruned its generated link, and removed the extraneous parent entry from `server/package-lock.json`.
- The first DnD draft imported `useDroppable` from `@dnd-kit/sortable` instead of `@dnd-kit/core`; I corrected the import before the successful client build.
- The first optimistic mutation draft left error toasts in both the store and its components; I moved failure toasts into the store so each rollback produces one toast.

## Known issues

- Server dependency installation reported 3 npm audit vulnerabilities (2 moderate, 1 high); review during tests-and-polish without applying unapproved version changes.
- The seed command intentionally deletes every document from the Task collection before inserting its sample board. Do not run it against a database containing tasks that need to be kept.
- Appending reads the last order index and then inserts; simultaneous POST requests can choose the same index. The concurrency step must harden this write path.
- Snapshot rollback is scoped to the affected task and columns; broader overlapping mutation conflict handling remains for step 6.
- The move endpoint accepts version and operation ID but does not enforce conflicts or idempotent retries yet; that is step 6.
- Rapid moves can race or resolve out of order until the step 6 interaction guard is implemented.
- `README.md` and `DECISIONS.md` remain uncreated for their planned steps.
- No `.env` files are committed. Copy the examples and configure MongoDB locally before running the apps.
- Git branch checkout, remote configuration, and commit state were not verified because the AI must not run Git commands. The user specified `feature/optimistic-ui` and was given the checkout command.

## Last updated, current branch, last commit

- Last updated: 2026-11-02
- Current branch: `feature/optimistic-ui` (requested branch; checkout not verified)
- Last commit: not inspected (Git commands are reserved for the user)

## Defend it

Each write action snapshots only the state needed to reverse its own optimistic change. A move stores the previous task object plus copied source and destination column ID arrays; on failure these restore both the card fields and its exact prior order. An edit stores the previous task object. A delete stores the removed task and its prior column list/index so it can reinsert the card. A create stores the destination column IDs, inserts a temporary task under a `temp-*` ID, and removes that ID on failure; on success it removes the temporary record and inserts the server task under its MongoDB ID/order. These snapshots make rollback local and immediate without refetching unrelated tasks.

The shared Axios request interceptor adds `x-simulate-fail: true` only to writes while the development switch is enabled and aborts requests after ten seconds. Store catch blocks restore state, translate HTTP/network/timeout errors into one toast, and rethrow so forms can keep their inline error. Mutations do not set the board loading flag.

Likely interview questions:

1. **What exactly does a move snapshot contain, and why?** It contains the moved task record and copies of the source and destination ordered-ID arrays. Together they restore the card's old column, orderIndex, and position relative to neighboring cards without a refetch.
2. **How does create transition from temporary to persisted?** The store adds a `temp-*` task and ID immediately. When POST returns, it removes that record and inserts the response under its MongoDB `_id` at the server's orderIndex; on failure it removes the temporary entry and toast reports the error.
3. **How do you handle server and network failures?** HTTP errors use the API's JSON message; no-response errors explain that the API is unreachable; timeouts have their own message. Every mutation restores its snapshot before showing the toast.
## How to verify

- `npm run build --prefix client` (passed during this step).
- Ensure MongoDB is running and both `.env` files are configured, then start the stack with `npm run dev` from the repository root.
- **Manual rollback script:**
  1. Turn on **Simulate failures (dev)** in the header.
  2. Drag a card to another position. Confirm it moves immediately, then returns to its original column/order after the simulated 500 and shows one error toast.
  3. Create a task, edit a task, and delete a task. For each action, confirm the UI updates before the response, then restores the prior board state after the 500; the create temporary ID should disappear.
  4. Confirm these operations do not show a board-wide spinner or trigger a full task refetch.
  5. Turn simulation off and retry an operation; confirm it persists after a refresh.
- For real network errors, stop the server and try a move/create/edit/delete. Confirm rollback and the unreachable-server toast; restart the server without manually reloading the board.
- To exercise timeout handling, throttle a request past 10 seconds in browser DevTools; confirm rollback and the timeout toast.
- Confirm the switch appears only in Vite development mode and GET requests do not carry the simulation header.

## GIT COMMANDS

The assessment requires feature-branch work merged through a Pull Request. These commands are for the user; no Git command has been run by the AI. Checkout of the requested branch remains unverified.

Verification:

```sh
git status
```

Atomic commits:

```sh
git add client/src/store/boardStore.js client/src/components/Board.jsx client/src/components/TaskCard.jsx client/src/components/TaskModal.jsx client/src/components/ConfirmDelete.jsx
git commit -m "feat: add optimistic task mutation rollback"

git add client/src/api/http.js client/src/components/Header.jsx
git commit -m "feat: add simulated API failure switch"

git add CONTEXT.md
git commit -m "docs: update context after optimistic-ui"
```

Push:

```sh
git push -u origin feature/optimistic-ui
```

Pull Request:

- Title: `feat: add optimistic task updates with rollback`
- Description: Add snapshot-based optimistic moves and CRUD, temporary IDs for task creation, rollback toasts for HTTP/network/timeout failures, and a development failure switch.
- Open a PR into `main` and merge it on GitHub, not locally.

Cleanup after the PR is merged:

```sh
git checkout main && git pull origin main && git branch -d feature/optimistic-ui
```

## HOW TO RESUME

Start by reading `CONTEXT.md` and `docs/REQUIREMENTS.md`, then read `docs/ASSESSMENT.pdf` if source detail is needed. Continue only the named current step; do not implement later steps early. Follow the fixed stack and AI rules above. Do not run Git commands; print the exact commands for the user. At each step end, update this file and provide the defend-it, verification, and Git command sections, name the next step, and wait for the user's “go”.

Next step: `concurrency`.
