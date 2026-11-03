from pathlib import Path
import textwrap
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch


OUT = Path(__file__).with_name("taskflow-architecture.png")
fig, ax = plt.subplots(figsize=(22, 10.5), dpi=180)
fig.patch.set_facecolor("#10151D")
ax.set_facecolor("#10151D")
ax.set_xlim(0, 22)
ax.set_ylim(0, 10.5)
ax.axis("off")

TEXT = "#E8EEF7"
MUTED = "#AAB7C8"
BLUE = "#56A8FF"
BLUE_BG = "#122A40"
PURPLE = "#B49AFF"
PURPLE_BG = "#251E3B"
GREEN = "#62D29B"
GREEN_BG = "#143326"
AMBER = "#FFC663"
AMBER_BG = "#382B16"
RED = "#FF827B"
RED_BG = "#3B2022"
GRAY = "#9AA8BA"
PANEL = "#171E28"
EDGE = "#394656"


def rounded(x, y, w, h, fill, edge, lw=1.2, radius=.12):
    p = FancyBboxPatch((x, y), w, h,
                       boxstyle=f"round,pad=.04,rounding_size={radius}",
                       facecolor=fill, edgecolor=edge, linewidth=lw)
    ax.add_patch(p)
    return p


def node(x, title, body, accent, fill):
    rounded(x, 6.05, 2.55, 1.48, fill, accent, 1.35, .12)
    ax.text(x+.15, 7.25, title, ha="left", va="top", color=TEXT,
            fontsize=8.2, fontweight="bold")
    ax.text(x+.15, 6.82, body, ha="left", va="top", color=MUTED,
            fontsize=7.1, linespacing=1.3)


def flow_arrow(x1, x2, label, color=BLUE):
    ax.add_patch(FancyArrowPatch((x1, 6.79), (x2, 6.79), arrowstyle="-|>",
                                 mutation_scale=12, linewidth=1.5,
                                 color=color, shrinkA=2, shrinkB=2))
    ax.text((x1+x2)/2, 7.02, label, ha="center", va="bottom",
            color=color, fontsize=6.2,
            bbox=dict(boxstyle="round,pad=.14", fc="#10151D", ec="none"))


def topic_card(x, title, tag, body, accent, tag_color=None):
    rounded(x, 1.18, 5.05, 3.33, PANEL, EDGE, 1.1, .12)
    ax.text(x+.18, 4.23, title, ha="left", va="top", color=TEXT,
            fontsize=8.8, fontweight="bold")
    ax.text(x+.18, 3.84, tag, ha="left", va="top",
            color=tag_color or accent, fontsize=6.7, fontweight="bold")
    ax.text(x+.18, 3.48, textwrap.fill(body, width=48), ha="left", va="top",
            color=MUTED, fontsize=7.1, linespacing=1.35)


ax.text(.38, 10.08, "TASKFLOW · END-TO-END ARCHITECTURE", fontsize=18,
        color=TEXT, fontweight="bold", va="top")
ax.text(.40, 9.62,
        "Frontend → API → database · card move request, server safeguards, response handling, and four assessment topics",
        fontsize=8.8, color=MUTED, va="top")

# Layer backgrounds
layers = [
    (.34, 5.72, 12.22, 2.45, "FRONTEND · REACT + VITE", "#121C28", BLUE),
    (12.68, 5.72, 6.14, 2.45, "BACKEND · NODE + EXPRESS", "#1B1827", PURPLE),
    (18.94, 5.72, 2.72, 2.45, "DATABASE", "#14251D", GREEN),
]
for x, y, w, h, label, fill, edge in layers:
    rounded(x, y, w, h, fill, edge, 1.0, .13)
    ax.text(x+.14, y+h-.12, label, ha="left", va="top", color=edge,
            fontsize=7.0, fontweight="bold")

# Main end-to-end flow
nodes = [
    (.48, "REACT UI", "Columns · cards\ndrag and keyboard", BLUE, "#14283B"),
    (3.43, "ZUSTAND BOARD STORE", "tasksById + ordered\nIDs per column", BLUE, "#14283B"),
    (6.38, "OPTIMISTIC MOVE + FIFO", "Instant UI update\nQueued move · UUID", AMBER, "#302615"),
    (9.33, "AXIOS API LAYER", "HTTP / JSON\nVITE_API_URL", BLUE, "#14283B"),
    (12.78, "EXPRESS ROUTES + ZOD", "API routes · validation\nCORS · Helmet · Morgan", PURPLE, "#211D31"),
    (15.73, "TASK CONTROLLER", "Version + UUID checks\nMongoose transaction", PURPLE, "#211D31"),
    (19.08, "MONGODB", "Tasks · checklists\nMoveOperation results", GREEN, "#193024"),
]
for x, title, body, accent, fill in nodes:
    node(x, title, body, accent, fill)

flow_arrow(3.03, 3.40, "UI state", BLUE)
flow_arrow(5.98, 6.35, "move", AMBER)
flow_arrow(8.93, 9.30, "request", AMBER)
flow_arrow(11.88, 12.75, "HTTP", BLUE)
flow_arrow(15.33, 15.70, "validated", PURPLE)
flow_arrow(18.28, 19.05, "transaction", GREEN)

# Return path: response from API/database to client state
ax.plot([20.35, 20.35, 4.70], [6.02, 5.53, 5.53], color=BLUE,
        linewidth=1.35, solid_capstyle="round")
ax.add_patch(FancyArrowPatch((4.70, 5.53), (4.70, 6.02), arrowstyle="-|>",
                             mutation_scale=12, linewidth=1.35, color=BLUE,
                             shrinkA=1, shrinkB=2))
ax.text(12.45, 5.61,
        "RESPONSE: updated task + version confirms store; failure or 409 reconciles / rolls back the card",
        ha="center", va="bottom", color=BLUE, fontsize=6.8,
        bbox=dict(boxstyle="round,pad=.18", fc="#10151D", ec="none"))

# Four simple assessment topic callouts
topic_card(.38, "1 · STATE DESIGN", "CURRENT", "Zustand normalizes tasks by ID and keeps column order in separate lists. Selectors limit rerenders. Chosen for a compact board; Redux adds structure and Context needs careful splitting. Zustand is not a server cache.", BLUE)
topic_card(5.86, "2 · CONCURRENCY", "CURRENT", "Rapid drags appear immediately, then enter a FIFO queue with UUIDs. Resolve latest neighbors and version; update transactionally. Same-UUID retry is safe; 409 reconciles; hard failure rolls back the card.", AMBER)
topic_card(11.34, "3 · AI DEBUGGING", "RECORDED RETROSPECTIVE", "Fixed a wrong DnD import, duplicate error toasts, malformed dependency key, and test startup race. Review caught syntax and lint issues. Lesson: inspect generated code and verify startup-dependent behavior.", GRAY)
topic_card(16.82, "4 · SCALE DESIGN", "FUTURE PROPOSAL · NOT IMPLEMENTED", "First bottleneck: fetching and rendering every task. Proposed: cursor pagination, virtualized cards, bounded move queries, live versioned events, and conflict checks for edits/deletes.", PURPLE)

ax.text(.48, .62,
        "Current implementation shown with solid arrows. Scale improvements are proposals from DECISIONS.md, not current features.",
        color=MUTED, fontsize=7.2, va="center")

plt.savefig(OUT, dpi=180, facecolor=fig.get_facecolor(), bbox_inches="tight", pad_inches=.15)
print(OUT)
