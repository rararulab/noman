# noman

Self-driven AI agent loop. No man needed.

A TS CLI that orchestrates Claude Code to iteratively drive any project toward a defined goal. The core is a CEO agent — your will proxy with first-principles methodology (归一性) — that autonomously dispatches specialized agents to build your project.

## How it works

```
You → CEO (your will proxy) → dispatches agents → project gets built
         ↑                                              │
         └──── REVIEW → IMPL → FIX → RE-REVIEW ────────┘
```

1. **Setup**: noman interviews you to understand what you want to build
2. **Goal**: CEO writes a prioritized checklist (P0 → P1 → P2) with verification methods
3. **Drive**: TS state machine loops through review/implement/fix cycles, calling `claude` CLI each step
4. **Done**: All checklist items pass, project is complete

## Usage

```bash
# Interview → generate project goal
npx tsx src/index.ts setup --dir /path/to/your/project

# Run the autonomous drive loop
npx tsx src/index.ts drive --goal-dir /path/to/your/project/goal

# Or scaffold a blank goal for manual editing
npx tsx src/index.ts init --dir /path/to/your/project
```

## The CEO

The CEO agent (`prompts/ceo.md`) operates on three principles:

- **归一性 (Unity)** — one way to do each thing. Contradictions are bugs.
- **Deletion** — the best part is no part. Complexity must earn its place.
- **Taste** — simplest thing that delivers the best experience.

It "hires" specialized agents as needed: reviewer, designer, tech lead, implementer. Like HR, it crafts each agent's prompt to match the task.

## Self-bootstrap

noman's own development is driven by noman. See `goal/root.md`.
