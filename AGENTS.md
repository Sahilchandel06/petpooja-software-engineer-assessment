# TaskFlow agent rules
- Read CONTEXT.md and docs/REQUIREMENTS.md before any task. They are the source of truth.
- Plain JavaScript only (no TypeScript). Keep client/ and server/ separated.
- Never run git commands. Print them for me to run.
- Never add a library without asking me.
- Comment WHY, because I must defend every line in a live interview.
- Follow the STEP-END PROTOCOL in CONTEXT.md at the end of every task.
- For any UI work, follow the "Frontend design rules" below.

## Frontend design rules
- Style like Jira/Linear: calm, dense, professional. No purple gradients, glassmorphism,
  neon glows, emoji icons, or oversized rounded cards.
- All colors come from CSS variables (tokens) in client/src/index.css. No hard-coded hex in components.
- Font: Inter. Type scale 12/13/14/16/20. 4px spacing grid. Radius 6px cards, 4px badges.
- Light and dark must both look intentional. WCAG AA contrast (4.5:1).
- Keep React.memo on TaskCard and Zustand selectors. Do not touch store logic,
  the operation queue, or the theme init script during visual work.
- Always include hover, focus-visible, empty, loading and error states.
- Respect prefers-reduced-motion.