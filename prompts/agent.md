# Goal System — Agent Instructions

## Overview

The `goal/` directory is a goal-driven iterative improvement system. Each goal file defines a measurable objective with a prioritized checklist. The system continuously iterates: **review → implement → fix → review** until all checklist items pass.

## File Structure

```
goal/
├── root.md        # First-principles root goal
├── <name>.md      # Discovered sub-goals
└── .state.json    # Machine-readable state (managed by noman)
```

## Goal File Format

Every goal file uses this structure:

```markdown
# <Goal Title>

## Checklist

### P0 — Must work
- [ ] Item — measurable criterion — **verification**: how to prove this passes

### P1 — Core quality
- [ ] Item — measurable criterion

### P2 — Polish
- [ ] Item — measurable criterion

## First Principles
Why this goal matters. What it derives from.

## Current State
Brief assessment (filled on first review, updated each cycle).

## Notes
Observations, trade-offs, context discovered during iteration.
```

**Rules:**
- Checklist items MUST be objectively verifiable (test pass, command succeeds, code pattern check — not subjective)
- P0 items MUST include an explicit **verification** method that can be executed
- Priority order is strict: all P0 before P1, all P1 before P2
- Mark items `[x]` only after review confirms they pass
- Never delete items — strikethrough `~~` if irrelevant, with a note

## Bootstrapping — No root.md?

If `goal/root.md` does not exist:

1. **Ask the user**: "What is the core objective? What does success look like?"
2. Apply first-principles thinking to decompose:
   - What is the fundamental purpose?
   - What are the non-negotiable qualities?
   - What constraints exist?
3. Write `root.md` following the format above
4. Begin the iteration loop

## Iteration Loop

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │  REVIEW  │───▶│   IMPL   │───▶│   FIX    │  │
│   └──────────┘    └──────────┘    └──────────┘  │
│        ▲                               │        │
│        └───────────────────────────────┘        │
│                                                 │
│   Loop per priority tier until all [x]          │
└─────────────────────────────────────────────────┘
```

### Phase: REVIEW

A reviewer agent:
- Reads the goal checklist
- Audits the codebase against unchecked items in the current tier only
- For P0 items: executes the verification method
- First review: MUST fill `## Current State`
- Returns a structured report (max 5 gaps)

**Review Report Format:**

```
TIER: P0 | P1 | P2
ITEMS_CHECKED: N
PASSED: [list]
FAILED: [list]

GAPS:
1. [item] — file:line — description — suggested fix
2. ...

NEW_GOALS: (must pass relevance test)
- name — why needed — which first principle it serves
```

### Phase: IMPL

Implementer agents work on gaps:
- Each handles one focused change
- Independent changes run in parallel (max 3)
- Work in isolated worktrees when possible

### Phase: FIX

If regressions occur:
- Fix in the same branch
- Run verification before marking done

### Phase: RE-REVIEW

Reviewer re-checks:
- All items in current tier (not just worked items)
- If all pass → advance to next tier
- If gaps remain → back to IMPL

## Discovering New Goals

A sub-goal may ONLY be created if:
1. It directly serves a root goal First Principle
2. The agent articulates which principle and why
3. Without it, a checklist item cannot fully pass

Otherwise: log in `## Notes` as "considered but deferred."

## Budget & Limits

- Max 10 review→impl cycles per tier — stop and report if exceeded
- Max 3 sub-goals per drive session
- 3-strike failure rule: if an item fails 3 times, mark ⚠️ and escalate

## Retrospective

After each completed tier, reflect:
1. Wasted cycles — which dispatches returned little value?
2. Missed parallelism — what could have been parallel?
3. Prompt efficiency — can prompts be tighter?

Write `## Retro` in root.md. Apply adjustments immediately to the next tier.
