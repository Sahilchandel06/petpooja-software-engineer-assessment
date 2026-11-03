---
name: taskflow-frontend
description: Use when building or restyling any React UI in this repo (board, cards, modal, nav, theme, states). Enforces a Jira-quality design system.
---

# Workflow
1. Read client/src/index.css (tokens) and client/src/components/ui/ before writing UI.
2. Reuse ui/ primitives (Button, Badge, Avatar, IconButton, Tooltip, Input, Select).
   Add a new primitive only if none fits.
3. Use token classes, never raw colors.
4. Build all states: default, hover, focus-visible, active, disabled, loading, empty, error.
5. Check in both themes at 375, 768 and 1280px.
6. Run lint and the client build. Confirm drag-and-drop, rollback and the theme toggle still work.

# Rules
- Card: title 14px/500 (2-line clamp), max 2 tag chips plus "+N", priority icon with sr-only label,
  issue key in muted text, avatar initials, thin animated progress bar.
- Column: uppercase 12px header, count badge, subtle status dot, independent scroll, create button.
- Dragging: dashed placeholder at ~40% opacity, overlay with soft shadow and a tiny lift.
- Priority and status must never rely on color alone.
- Do not add fake features (dead search, fake notifications).