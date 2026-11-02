# TaskFlow Project Context

## Project summary and stack

Build the TaskFlow resilient Kanban assessment from `docs/ASSESSMENT.pdf`, the single source of truth. Work is bootstrap-only so far. Keep `client/` and `server/` as separate application roots in this repository.

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
| R1 | Not started |
| R2 | Not started |
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
| R17 | Not started |
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
- Use `@dnd-kit` for card interaction and MongoDB/Mongoose persistence; concurrency details remain to be designed in the relevant step.
- Implement only wildcard Option 3: nested checklist and animated completion progress.
- Only project directories and bootstrap documents have been added; application code and packages remain for later steps.

## AI MISTAKES LOG

No AI mistakes have occurred in this work so far.

## Known issues

- No runtime project exists yet; only the `client/` and `server/` roots are present.
- No verification has been run because there is no application code yet.
- Public remote/repository configuration has not been inspected; no Git commands were run.

## Last updated, current branch, last commit

- Last updated: 2026-11-02
- Current branch: `main` (read from `.git/HEAD`; no Git command run)
- Last commit: not inspected (Git commands are reserved for the user)

## Defend it

This step establishes repository structure and a traceable transcription/checklist. There is no runtime call stack yet. Keeping implementation out of this step preserves the requested bootstrap-only scope. The checklist treats an item as implementation progress, so recording a requirement here does not mark it complete.

Likely interview questions:

1. **Why separate client and server?** They have different runtimes, dependencies, and responsibilities, so the boundary makes each side easier to run and explain.
2. **Why keep the PDF transcript and checklist?** The transcript preserves the source details while the IDs make implementation and final review traceable.
3. **Why are requirements still Not started?** Documentation does not implement or verify the application behavior; statuses should reflect actual work.

## How to verify

- Confirm `docs/REQUIREMENTS.md` includes the three-page transcript and requirements R1–R21.
- Confirm `CONTEXT.md` lists the exact fixed stack, AI rules, step-end protocol, and 12-step plan.
- Confirm `.gitignore` contains the requested common generated and local files.
- No runtime checks apply; no application code or dependencies exist yet.

## GIT COMMANDS

The assessment requires feature-branch work merged through a Pull Request and warns that direct unbranched commits can disqualify the submission. The requested initial commit on `main` conflicts with that rule, so use the feature branch workflow below. These are commands for the user; no Git command has been run by the AI.

Verification:

```sh
git status
```

Atomic commits:

```sh
git switch -c feature/project-setup
git add .gitignore docs/REQUIREMENTS.md
git commit -m "docs: add assessment requirements and ignore rules"
git add CONTEXT.md
git commit -m "docs: update context after project-setup"
```

Push:

```sh
git push -u origin feature/project-setup
```

Pull Request:

- Title: `docs: bootstrap TaskFlow assessment context`
- Description: Add a faithful assessment transcript, requirement checklist, project context, and baseline ignore rules.
- Open a PR into `main` and merge it on GitHub, not locally.

Cleanup after the PR is merged:

```sh
git checkout main && git pull origin main && git branch -d feature/project-setup
```

## HOW TO RESUME

Start by reading `CONTEXT.md` and `docs/REQUIREMENTS.md`, then read `docs/ASSESSMENT.pdf` if source detail is needed. Continue only the named current step; do not implement later steps early. Follow the fixed stack and AI rules above. Do not run Git commands; print the exact commands for the user. At each step end, update this file and provide the defend-it, verification, and Git command sections, name the next step, and wait for the user's “go”.

Next step: `server-task-api`.
