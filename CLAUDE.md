# CLAUDE.md — noman

## Communication
- 用中文与用户交流

## Project Identity

noman is a self-driven AI agent loop. It's a prompt — not a CLI, not a runtime. Users paste the prompt from README.md into any agent (Claude Code, Desktop, Cursor, Codex, etc.) and the agent becomes a CEO that autonomously drives any project to completion.

## Drive Mode

When the user says **`drive`**, enter the goal-driven iteration loop. Read and follow `goal/root.md` and `prompts/ceo.md`. The main agent is a pure coordinator — dispatch everything to subagents.

## Architecture

```
README.md           # THE product — contains the paste-ready prompt
prompts/
├── ceo.md          # CEO persona (detailed reference)
├── boss.md         # BOSS review rubric (detailed reference)
├── agent.md        # Generic agent instructions
├── review.md       # Review agent template
└── impl.md         # Implementation agent template

goal/               # Created by CEO at runtime
├── root.md         # P0/P1/P2 checklist with verification commands
├── .state.json     # Machine state
├── .boss-review.json # Latest self-review
└── log/            # Cycle reports
```

No TS code. No CLI. The prompt IS the product.

## Key Principle: 归一性 (Unity)

One way to do each thing. If you find two ways, eliminate one.
