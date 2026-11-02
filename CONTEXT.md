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
| R8 | Not started |
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
| 5 | optimistic-ui | TODO |
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

## AI MISTAKES LOG

- The first client `package.json` draft accidentally gave the PostCSS dependency a leading space (`" postcss"`). Review caught the invalid package key; it was corrected to `"postcss"` before the successful dependency install and client build.
- Starting root, client, and server npm installs concurrently during setup caused npm to record the parent project as a temporary server dependency. I removed that dependency, pruned its generated link, and removed the extraneous parent entry from `server/package-lock.json`.
- The first DnD draft imported `useDroppable` from `@dnd-kit/sortable` instead of `@dnd-kit/core`; I corrected the import before the successful client build.

## Known issues

- Server dependency installation reported 3 npm audit vulnerabilities (2 moderate, 1 high); review during tests-and-polish without applying unapproved version changes.
- The seed command intentionally deletes every document from the Task collection before inserting its sample board. Do not run it against a database containing tasks that need to be kept.
- Appending reads the last order index and then inserts; simultaneous POST requests can choose the same index. The concurrency step must harden this write path.
- Failed move requests currently leave the optimistic position in place until refresh; rollback is step 5.
- The move endpoint accepts version and operation ID but does not enforce conflicts or idempotent retries yet; that is step 6.
- Rapid moves can race or resolve out of order until the step 6 interaction guard is implemented.
- `README.md` and `DECISIONS.md` remain uncreated for their planned steps.
- No `.env` files are committed. Copy the examples and configure MongoDB locally before running the apps.
- Git branch checkout, remote configuration, and commit state were not verified because the AI must not run Git commands. The user specified `feature/drag-and-drop` and was given the checkout command.

## Last updated, current branch, last commit

- Last updated: 2026-11-02
- Current branch: `feature/drag-and-drop` (requested branch; checkout not verified)
- Last commit: not inspected (Git commands are reserved for the user)

## Defend it

Drag starts at the card's drag handle through the pointer or keyboard sensor. The pointer sensor waits for 8px of movement, so a plain click on the task title still opens its editor. `DndContext` tracks the active task and shows a `DragOverlay`. On drop, `Board.handleDragEnd` resolves the destination task or column (including an empty column), constructs the new ID ordering, and uses the client fractional-index helper to calculate a position from neighboring cards. It calls Zustand `moveTask`, which updates normalized state immediately and sends Axios `PATCH /api/tasks/:id/move` with `columnId`, `orderIndex`, `version`, and `operationId`. Express validates the path and body, then the async controller issues one `findOneAndUpdate` with `$set` and `$inc`; MongoDB returns the updated task, which the store reconciles.

Trade-offs: fractional positions avoid renumbering a whole column for ordinary moves, but tiny gaps need a rebalance path. This step is optimistic; failures do not roll back until step 5. The server accepts version and operation ID but enforcement is step 6. The arrow controls call the same action as drag-and-drop.

Likely interview questions:

1. **Walk through a drag from start to database write.** The sensor activates; DndContext tracks the task/overlay; `onDragEnd` finds neighbors and computes a fractional index; Zustand updates locally and Axios sends the move; Express validates it and the controller performs the atomic MongoDB update.
2. **How can an empty column accept a drop?** Each column registers its own droppable target even when its sortable list is empty. A drop on that target resolves to that column and appends the task.
3. **What happens when two moves race?** This step sends version and operation ID fields, but does not enforce them. Conflict handling, idempotency, and the rapid-interaction guard arrive in step 6.
## How to verify

- `npm run build --prefix client` (passed during this step).
- Ensure `server/.env` points to a running MongoDB and `client/.env` has `VITE_API_URL=http://localhost:5000/api`, then run `npm run dev` from the repository root.
- Open `http://localhost:5173`. Test moving cards within a column, across columns, and into an empty column; confirm the arrow controls still move cards and survive a page refresh.
- Test a short pointer click on a task title (it should open edit without dragging). Use the drag handle with pointer movement; also focus it with the keyboard and use Space/arrow keys/Space to move a card.
- To test the move endpoint directly, get a task `_id` and `version` from `GET /api/tasks`, then set `$taskId` and `$version` and run:

```powershell
curl.exe -i -X PATCH "http://localhost:5000/api/tasks/$taskId/move" -H "Content-Type: application/json" -d ('{"columnId":"in-progress","orderIndex":1500,"version":' + $version + ',"operationId":"manual-move-001"}')
```

- Confirm the response is 200 with the updated `columnId`, `orderIndex`, and incremented `version`.
## GIT COMMANDS

The assessment requires feature-branch work merged through a Pull Request. These commands are for the user; no Git command has been run by the AI. Checkout of the requested branch remains unverified.

Verification:

```sh
git status
```

Atomic commits:

```sh
git add client/src/utils/fractionalIndex.js client/src/api/tasks.js client/src/store/boardStore.js
git commit -m "feat: add fractional positions and persistent move action"

git add client/src/components/Board.jsx client/src/components/Column.jsx client/src/components/TaskCard.jsx
git commit -m "feat: enable sortable cross-column task moves"

git add server/src/controllers/taskController.js server/src/routes/taskRoutes.js
git commit -m "feat: add atomic task move endpoint"

git add CONTEXT.md
git commit -m "docs: update context after drag-and-drop"
```

Push:

```sh
git push -u origin feature/drag-and-drop
```

Pull Request:

- Title: `feat: add task drag and drop with atomic move API`
- Description: Add pointer and keyboard sorting, empty-column drop targets, fractional move positions, accessible button moves, and an atomic server move endpoint.
- Open a PR into `main` and merge it on GitHub, not locally.

Cleanup after the PR is merged:

```sh
git checkout main && git pull origin main && git branch -d feature/drag-and-drop
```
## HOW TO RESUME

Start by reading `CONTEXT.md` and `docs/REQUIREMENTS.md`, then read `docs/ASSESSMENT.pdf` if source detail is needed. Continue only the named current step; do not implement later steps early. Follow the fixed stack and AI rules above. Do not run Git commands; print the exact commands for the user. At each step end, update this file and provide the defend-it, verification, and Git command sections, name the next step, and wait for the user's “go”.

Next step: `optimistic-ui`.
