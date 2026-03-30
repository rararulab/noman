# AGENTS.md — noman

## Communication
- 用中文与用户交流

## Project Identity

noman is a self-driven AI agent loop. It's a TS CLI that orchestrates multiple agent CLIs (Claude/Codex) to iteratively improve any project toward a defined goal. The core innovation is the CEO agent — a will proxy with Elon-like first-principles personality that autonomously dispatches specialized agents (reviewer, designer, tech lead, implementer) to drive a project forward.

## Drive Mode

When the user says **`drive`**, enter the goal-driven iteration loop. Read and follow `goal/root.md` and `prompts/ceo.md`. The main agent is a pure coordinator — dispatch everything to subagents.

## Architecture

```
src/
├── index.ts    # CLI entry (noman drive / noman init)
├── loop.ts     # State machine: REVIEW → IMPL → FIX → RE-REVIEW
├── agent.ts   # Unified agent CLI adapter (claude/codex)
├── claude.ts  # Claude-compat wrapper on top of agent adapter
├── parser.ts   # Parse goal markdown → structured data
├── state.ts    # Read/write goal/.state.json
├── prompt.ts   # Assemble prompts from templates
└── report.ts   # Parse review agent reports

prompts/
├── ceo.md      # CEO persona — the will proxy
├── agent.md    # Generic agent instructions (goal system)
├── review.md   # Review agent template
└── impl.md     # Implementation agent template

goal/
├── root.md     # noman's own bootstrap goal
└── .state.json # Machine state
```

## Key Principle: 归一性 (Unity)

One way to do each thing. If you find two ways, eliminate one. This applies to:
- Code patterns
- Naming conventions
- Error handling
- State management
- Prompt structure

## Development

```bash
npx tsx src/index.ts drive    # Run the drive loop
npx tsx src/index.ts init     # Scaffold goal/ in a project
npm run build                 # Compile TypeScript
```
