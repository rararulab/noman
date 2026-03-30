# Root Goal — Bootstrap noman: Self-Driven Agent Loop

## Checklist

### P0 — Must work
- [ ] **Parser works** — `parseGoalMarkdown` correctly extracts tiers, items, checked state from any well-formed goal markdown — **verification**: `npx tsx src/__tests__/parser.test.ts`
- [ ] **State round-trips** — `loadState` → `saveState` → `loadState` returns identical data — **verification**: `npx tsx src/__tests__/state.test.ts`
- [ ] **Claude CLI spawn** — `runClaude` successfully spawns `claude -p` and captures stdout/stderr — **verification**: `npx tsx src/__tests__/claude.test.ts`
- [ ] **Drive loop runs** — `noman drive` executes at least one REVIEW cycle on this very repo without crashing — **verification**: `npx tsx src/index.ts drive --goal-dir goal`
- [ ] **Init scaffolds** — `noman init --dir /tmp/test-noman` creates valid goal/ structure — **verification**: `npx tsx src/index.ts init --dir /tmp/test-noman && cat /tmp/test-noman/goal/root.md`

### P1 — Core quality
- [ ] **Report parsing robust** — handles malformed claude output gracefully (empty, no structure, partial) without throwing
- [ ] **Prompt templates are language-agnostic** — no Rust/cargo/clippy references in prompts/; all project-specific commands live in goal files only
- [ ] **CEO prompt embodies 归一性** — the ceo.md prompt clearly encodes first-principles thinking, unity principle, deletion principle, and the HR dispatch pattern
- [ ] **Zero hardcoded paths** — all paths derived from --goal-dir or cwd, no absolute paths in source
- [ ] **Error messages are actionable** — every error tells the user what to do next

### P2 — Polish
- [ ] **CLI help is clear** — `noman --help`, `noman drive --help`, `noman init --help` all produce useful output
- [ ] **Logs are structured** — every log line has timestamp, phase, and context
- [ ] **TypeScript strict** — `tsc --noEmit` passes with zero errors
- [ ] **Clean module boundaries** — each src file has single responsibility, no circular imports

## First Principles

noman exists to make AI agents self-driving. The core beliefs:

1. **Autonomy over permission** — an agent that asks for permission on every step is just a chatbot with extra steps. The CEO decides, the user overrides only when needed.
2. **归一性 (Unity)** — one way to do each thing. One loop structure. One goal format. One state file. Contradictions are bugs.
3. **Deletion over addition** — the system should get simpler as it matures, not more complex. Every abstraction must earn its keep.
4. **Self-reference** — noman must be able to drive its own development. If it can't bootstrap itself, it can't bootstrap anything.

## Current State

<To be filled by first review>

## Notes

- This is the self-bootstrap: noman driving noman's own development
- The CEO prompt (prompts/ceo.md) is the most important deliverable — it's what makes noman noman
- TypeScript chosen for accessibility — most AI developers work in TS/JS ecosystem
