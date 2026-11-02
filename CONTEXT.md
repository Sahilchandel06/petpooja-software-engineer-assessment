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
| R6 | In progress |
| R7 | Not started |
| R8 | Not started |
| R9 | Not started |
| R10 | Not started |
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
| 4 | drag-and-drop | TODO |
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
- Use `@dnd-kit` packages for later card interaction; they are installed now but unused in the setup page.
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
- The temporary arrow controls update only local Zustand state; `/move` and drag-and-drop persistence remain for later steps.

## AI MISTAKES LOG

- The first client `package.json` draft accidentally gave the PostCSS dependency a leading space (`" postcss"`). Review caught the invalid package key; it was corrected to `"postcss"` before the successful dependency install and client build.
- Starting root, client, and server npm installs concurrently during setup caused npm to record the parent project as a temporary server dependency. I removed that dependency, pruned its generated link, and removed the extraneous parent entry from `server/package-lock.json`.

## Known issues

- Server dependency installation reported 3 npm audit vulnerabilities (2 moderate, 1 high); review during tests-and-polish without applying unapproved version changes.
- The seed command intentionally deletes every document from the Task collection before inserting its sample board. Do not run it against a database containing tasks that need to be kept.
- Appending reads the last order index and then inserts; simultaneous POST requests can choose the same index. The concurrency step must harden this write path.
- Temporary card move controls in the client are local only and their changes are discarded on refresh; persistent ordering/moves are deferred to step 4 and the concurrency work.
- `README.md` and `DECISIONS.md` remain uncreated for their planned steps.
- No `.env` files are committed. Copy the examples and configure MongoDB locally before running the apps.
- Git branch checkout, remote configuration, and commit state were not verified because the AI must not run Git commands. The user specified `feature/kanban-crud-ui` and was given the checkout command.

## Last updated, current branch, last commit

- Last updated: 2026-11-02
- Current branch: `feature/kanban-crud-ui` (requested branch; checkout not verified)
- Last commit: not inspected (Git commands are reserved for the user)

## Defend it

The client mounts `Board`, which fetches `/tasks` through the Zustand `fetchTasks` action and normalized API layer. Each column selects its ordered task IDs; each memoized card selects only its own task and the stable local-move action. Create/edit forms and the delete confirmation call store actions, which await the API and then reconcile normalized state. The server validates requests and forwards async controller failures to the shared JSON error handler.

Trade-offs: normalized state avoids duplicating each task inside multiple column arrays, at the cost of looking up each card by ID. `React.memo` and narrow Zustand selectors limit unrelated card renders. The temporary arrow moves make ordering controls testable before drag-and-drop exists, but their state is local and disappears after a refresh. Theme switching and persistence remain deferred.

Likely interview questions:

1. **Why store tasks by ID and order separately?** The same task object has one canonical location in state, while column arrays describe ordering without copying task data.
2. **How does memoization help?** Each `TaskCard` selects one task record and is wrapped in `React.memo`; changing a different task does not change its selector result or props.
3. **Are the arrow moves persisted?** No. They exercise the local column/order state for this UI step; server move requests and drag-and-drop are planned for later steps.

## How to verify

- `npm run build --prefix client` (passed during this step).
- Ensure `server/.env` points to a running MongoDB and `client/.env` has `VITE_API_URL=http://localhost:5000/api`, then run `npm run dev` from the repository root.
- Open `http://localhost:5173`; confirm To Do, In Progress, and Done are visible. If using a disposable database, `npm run seed --prefix server` can populate sample cards; it deletes every existing Task document first.
- Create a task, edit its title/priority/tags, and delete it. Confirm each change appears after the API response.
- Use each arrow control and confirm the card moves locally. Refresh and confirm the temporary move is discarded.
- With the API stopped, reload the page and confirm the error state and Retry control appear. Restart the API and retry.
- Use keyboard Tab to reach controls, confirm visible focus, open either dialog, and close it with Escape.
## GIT COMMANDS

The assessment requires feature-branch work merged through a Pull Request. These commands are for the user; no Git command has been run by the AI. Checkout of the requested branch remains unverified.

Verification:

```sh
git status
```

Atomic commits:

```sh
git add client/src/store/boardStore.js client/src/api/tasks.js
git commit -m "feat: add normalized board store and task API"

git add client/src/App.jsx client/src/components/Board.jsx client/src/components/Column.jsx client/src/components/TaskCard.jsx client/src/components/Header.jsx
git add -A client/src/components/HealthStatus.jsx
git commit -m "feat: build responsive kanban board and task cards"

git add client/src/components/TaskModal.jsx client/src/components/ConfirmDelete.jsx
git commit -m "feat: add task create edit and delete dialogs"

git add client/src/components/EmptyState.jsx client/src/components/LoadingSkeleton.jsx client/src/components/ErrorState.jsx
git commit -m "feat: add board loading empty and error states"

git add CONTEXT.md
git commit -m "docs: update context after kanban-crud-ui"
```

Push:

```sh
git push -u origin feature/kanban-crud-ui
```

Pull Request:

- Title: `feat: build TaskFlow Kanban CRUD interface`
- Description: Add normalized Zustand state, task API functions, responsive board columns, task forms and delete confirmation, accessible states, and temporary local-only move controls.
- Open a PR into `main` and merge it on GitHub, not locally.

Cleanup after the PR is merged:

```sh
git checkout main && git pull origin main && git branch -d feature/kanban-crud-ui
```
## HOW TO RESUME

Start by reading `CONTEXT.md` and `docs/REQUIREMENTS.md`, then read `docs/ASSESSMENT.pdf` if source detail is needed. Continue only the named current step; do not implement later steps early. Follow the fixed stack and AI rules above. Do not run Git commands; print the exact commands for the user. At each step end, update this file and provide the defend-it, verification, and Git command sections, name the next step, and wait for the user's “go”.

Next step: `kanban-crud-ui`.
