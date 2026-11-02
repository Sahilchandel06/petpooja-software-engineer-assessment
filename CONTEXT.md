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
| R4 | Not started |
| R5 | Not started |
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
| R16 | Not started |
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
| 2 | server-task-api | TODO |
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

## AI MISTAKES LOG

- The first client `package.json` draft accidentally gave the PostCSS dependency a leading space (`" postcss"`). Review caught the invalid package key; it was corrected to `"postcss"` before the successful dependency install and client build.

## Known issues

- Server dependency installation reported 3 npm audit vulnerabilities (2 moderate, 1 high); review during tests-and-polish without applying unapproved version changes.
- The seed behavior is intentionally a placeholder; realistic sample data is deferred.
- `README.md` and `DECISIONS.md` remain uncreated for their planned steps.
- No `.env` files are committed. Copy the examples and configure MongoDB locally before running the apps.
- Git branch checkout, remote configuration, and commit state were not verified because the AI must not run Git commands. The user specified `feature/project-setup` and was given the checkout command.

## Last updated, current branch, last commit

- Last updated: 2026-11-02
- Current branch: `feature/project-setup` (requested branch; checkout not verified)
- Last commit: not inspected (Git commands are reserved for the user)

## Defend it

The client renders `App`, mounts `HealthStatus`, and calls the shared Axios instance at `GET {VITE_API_URL}/health`. The server loads dotenv, connects Mongoose, and only then listens. Express applies Helmet, CORS, JSON parsing, and Morgan before the health route; unmatched requests pass through the 404 middleware to the central JSON error handler. No Kanban feature logic exists yet.

Trade-offs: startup fails fast when MongoDB is unavailable instead of serving a misleading healthy API. Theme switching and persistence are deferred. The seed script is deliberately a placeholder. Root `concurrently` keeps both development processes easy to start together.

Likely interview questions:

1. **Why separate `app.js` from `server.js`?** Express configuration belongs in the app module; database connection and listening belong to process startup. This separation makes the HTTP app easier to inspect and reuse.
2. **Why connect to MongoDB before listening?** The API should not advertise availability when its persistence layer is unreachable, so startup fails visibly.
3. **How does the browser reach the API?** The page calls a shared Axios client whose base URL comes from `VITE_API_URL`; CORS allows the configured client origin.

## How to verify

- Confirm `docs/REQUIREMENTS.md` includes the three-page transcript and requirements R1–R21.
- `npm run build --prefix client` (passed during this step).
- Copy templates: `Copy-Item server/.env.example server/.env` and `Copy-Item client/.env.example client/.env`; adjust values if needed.
- Start both apps with `npm run dev`.
- Confirm `http://localhost:5173` reports `API status: ok`.
- Confirm `http://localhost:5000/api/health` returns `{"status":"ok"}` and an unknown `/api/...` path returns 404 JSON with `{ "error": { "message": "...", "code": "..." } }`.
- MongoDB must be running and reachable at `MONGO_URI` for server startup.

## GIT COMMANDS

The assessment requires feature-branch work merged through a Pull Request. These commands are for the user; no Git command has been run by the AI.

Verification:

```sh
git status
```

Atomic commits:

```sh
git add server/package.json server/package-lock.json server/src
git commit -m "chore: scaffold Express server"
git add client/package.json client/package-lock.json client/index.html client/vite.config.js client/tailwind.config.js client/postcss.config.js client/src
git commit -m "chore: scaffold Vite client"
git add package.json package-lock.json server/.env.example client/.env.example
git commit -m "chore: add root dev runner and environment examples"
git add CONTEXT.md
git commit -m "docs: update context after project-setup"
```

Push:

```sh
git push -u origin feature/project-setup
```

Pull Request:

- Title: `chore: bootstrap TaskFlow client and server`
- Description: Add the Express/Mongoose and Vite/React skeletons, client health check, environment examples, and root development runner.
- Open a PR into `main` and merge it on GitHub, not locally.

Cleanup after the PR is merged:

```sh
git checkout main && git pull origin main && git branch -d feature/project-setup
```

## HOW TO RESUME

Start by reading `CONTEXT.md` and `docs/REQUIREMENTS.md`, then read `docs/ASSESSMENT.pdf` if source detail is needed. Continue only the named current step; do not implement later steps early. Follow the fixed stack and AI rules above. Do not run Git commands; print the exact commands for the user. At each step end, update this file and provide the defend-it, verification, and Git command sections, name the next step, and wait for the user's “go”.

Next step: `server-task-api`.
