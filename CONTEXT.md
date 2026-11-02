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
| R3 | Not started |
| R4 | Done |
| R5 | Done |
| R6 | Not started |
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
| 3 | kanban-crud-ui | TODO |
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

## AI MISTAKES LOG

- The first client `package.json` draft accidentally gave the PostCSS dependency a leading space (`" postcss"`). Review caught the invalid package key; it was corrected to `"postcss"` before the successful dependency install and client build.
- Starting root, client, and server npm installs concurrently during setup caused npm to record the parent project as a temporary server dependency. I removed that dependency, pruned its generated link, and removed the extraneous parent entry from `server/package-lock.json`.

## Known issues

- Server dependency installation reported 3 npm audit vulnerabilities (2 moderate, 1 high); review during tests-and-polish without applying unapproved version changes.
- The seed command intentionally deletes every document from the Task collection before inserting its sample board. Do not run it against a database containing tasks that need to be kept.
- Appending reads the last order index and then inserts; simultaneous POST requests can choose the same index. The concurrency step must harden this write path.
- `README.md` and `DECISIONS.md` remain uncreated for their planned steps.
- No `.env` files are committed. Copy the examples and configure MongoDB locally before running the apps.
- Git branch checkout, remote configuration, and commit state were not verified because the AI must not run Git commands. The user specified `feature/server-task-api` and was given the checkout command.

## Last updated, current branch, last commit

- Last updated: 2026-11-02
- Current branch: `feature/server-task-api` (requested branch; checkout not verified)
- Last commit: not inspected (Git commands are reserved for the user)

## Defend it

The client renders `App`, mounts `HealthStatus`, and calls the shared Axios instance at `GET {VITE_API_URL}/health`. The server loads dotenv, connects Mongoose, and only then listens. Express applies Helmet, CORS, JSON parsing, and Morgan before the health route and task router. Task requests flow through route validation and `asyncHandler` into thin controllers and the Task model; failures reach the central JSON error handler. Simulated write failures short-circuit in middleware.

Trade-offs: startup fails fast when MongoDB is unavailable instead of serving a misleading healthy API. Midpoint positions avoid renumbering on every future move, while the pure rebalance helper handles exhausted gaps. Normal PATCH deliberately cannot change column/order; the dedicated move endpoint is deferred. Seeding resets the Task collection for repeatable evaluation, so it removes existing Task documents. Theme switching and persistence remain deferred.

Likely interview questions:

1. **Why use a fractional `orderIndex`?** Inserting between two cards uses their midpoint instead of rewriting later cards; after repeated insertions, rebalance restores wider gaps.
2. **How are invalid bodies and IDs handled?** Zod middleware validates bodies and an ObjectId validator checks route IDs before controllers run; errors flow through `asyncHandler` to a consistent JSON response.
3. **Why does the seed script delete existing tasks?** A predictable reset gives evaluators the same sample board each run; it clears only the Task collection, so use a disposable database if existing tasks matter.

## How to verify

- Confirm `docs/REQUIREMENTS.md` includes the three-page transcript and requirements R1–R21.
- No endpoint or seed commands were run in this step. Use the disposable/local database configured by `MONGO_URI`; `npm run seed --prefix server` deletes every Task document before inserting 15 sample tasks.
- Start the API, set `$taskId = 'paste-the-_id-returned-by-POST'`, then use these PowerShell `curl.exe` examples.
- `curl.exe -i http://localhost:5000/api/tasks` — list tasks.
- `curl.exe -i -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" -d '{"title":"Check invoice export","columnId":"todo","priority":"High","tags":["billing"]}'` — create (201).
- `curl.exe -i -X PATCH "http://localhost:5000/api/tasks/$taskId" -H "Content-Type: application/json" -d '{"title":"Review invoice export"}'` — update (200).
- `curl.exe -i -X DELETE "http://localhost:5000/api/tasks/$taskId"` — delete (204).
- `curl.exe -i -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" -H "x-simulate-fail: true" -d '{"title":"Simulated failure","columnId":"todo"}'` — simulated write failure (500).
- `curl.exe -i -X PATCH http://localhost:5000/api/tasks/not-an-object-id -H "Content-Type: application/json" -d '{"title":"Bad id"}'` — validation failure (400).
- `curl.exe -i -X PATCH http://localhost:5000/api/tasks/000000000000000000000000 -H "Content-Type: application/json" -d '{"title":"Missing task"}'` — valid ID with no matching task (404).

## GIT COMMANDS

The assessment requires feature-branch work merged through a Pull Request. These commands are for the user; no Git command has been run by the AI.

Verification:

```sh
git status
```

Atomic commits:

```sh
git add server/src/models/Task.js server/src/utils/fractionalIndex.js
git commit -m "feat: add task model and fractional index utility"
git add server/src/controllers/taskController.js server/src/routes/taskRoutes.js server/src/middleware/validateRequest.js server/src/middleware/validateObjectId.js server/src/utils/asyncHandler.js server/src/app.js
git commit -m "feat: add validated task CRUD endpoints"
git add server/src/middleware/simulateFailure.js
git commit -m "feat: add simulated write failure middleware"
git add server/src/scripts/seed.js server/package.json server/package-lock.json
git commit -m "feat: seed sample tasks across board columns"
git add CONTEXT.md
git commit -m "docs: update context after server-task-api"
```

Push:

```sh
git push -u origin feature/server-task-api
```

Pull Request:

- Title: `feat: add TaskFlow task API`
- Description: Add the Task schema and fractional positions, validated CRUD routes, simulated write failures, and a repeatable 15-task seed script.
- Open a PR into `main` and merge it on GitHub, not locally.

Cleanup after the PR is merged:

```sh
git checkout main && git pull origin main && git branch -d feature/server-task-api
```

## HOW TO RESUME

Start by reading `CONTEXT.md` and `docs/REQUIREMENTS.md`, then read `docs/ASSESSMENT.pdf` if source detail is needed. Continue only the named current step; do not implement later steps early. Follow the fixed stack and AI rules above. Do not run Git commands; print the exact commands for the user. At each step end, update this file and provide the defend-it, verification, and Git command sections, name the next step, and wait for the user's “go”.

Next step: `kanban-crud-ui`.
