# noman

Self-driven AI agent loop. No man needed.

An agent-native workflow with a small TS toolkit. CEO runs in the user's current agent session, then dispatches subagents via agent CLI (Claude/Codex) to iteratively drive any project toward a defined goal.

## How it works

```
You → CEO (your will proxy) → dispatches agents → project gets built
         ↑                                              │
         └──── REVIEW → IMPL → FIX → RE-REVIEW ────────┘
```

1. **One Prompt**: 复制入口提示词并粘贴到你当前 agent 会话
2. **Bootstrap**: agent 创建 `goal/root.md` + `goal/.state.json`
3. **Drive in-session**: CEO 在当前会话持续推进；你可随时插话
4. **Done**: checklist 按 P0 → P1 → P2 逐层完成

## Usage

```bash
# 0) (可选) 直接复制 prompts/entry.md 作为入口

# 1) 或者生成 one-copy quickstart prompt（会带上你的项目绝对路径）
npx tsx src/index.ts prompt --dir /path/to/your/project
# (or: npm run prompt -- --dir /path/to/your/project)

# 2) 粘贴给你的 agent（Claude/Codex/其他兼容 CLI）
#    CEO 会直接在当前会话运行（不是 TS CLI loop）。

# Optional: legacy interview flow
npx tsx src/index.ts setup --dir /path/to/your/project

# Optional legacy/debug: print CEO packet only
npx tsx src/index.ts drive --goal-dir goal --agent codex

# Optional: scaffold a blank goal for manual editing
npx tsx src/index.ts init --dir /path/to/your/project
```

## The CEO

The CEO agent (`prompts/ceo.md`) operates on three principles:

- **归一性 (Unity)** — one way to do each thing. Contradictions are bugs.
- **Deletion** — the best part is no part. Complexity must earn its place.
- **Taste** — simplest thing that delivers the best experience.

It "hires" specialized agents as needed: reviewer, designer, tech lead, implementer. Like HR, it crafts each agent's prompt to match the task.

## Agent-native runtime (核心)

- **CEO 运行位置**：用户当前 agent 会话
- **TS CLI 角色**：初始化/生成提示词/调试，不是 runtime loop 入口
- **子 agent 派发**：继续使用 agent-cli（`claude`/`codex`，可通过 `--agent` 或 `NOMAN_AGENT` 指定）

即：避免“TS 驱动 CEO loop”，但保留多 agent 调度能力。

## Contribution Flow

noman 的仓库改动遵循：**Issue → Workflow → PR**。

- 先开 Issue，明确目标与验收标准
- PR 必须关联 Issue（`Closes #...`）
- PR 必须提供验证证据，并通过 workflow

详见：`CONTRIBUTING.md`

## Self-bootstrap

noman's own development is driven by noman. See `goal/root.md`.
