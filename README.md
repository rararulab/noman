# noman

Self-driven AI agent loop. No man needed.

An agent-native workflow with a small TS toolkit. CEO runs in the user's current agent session, then dispatches subagents via agent CLI (Claude/Codex) to iteratively drive any project toward a defined goal.

## How it works

```
You → CEO (your will proxy) → dispatches agents → project gets built
         ↑                                              │
         └──── REVIEW → IMPL → FIX → RE-REVIEW ────────┘
                      │
                      └── report to BOSS (hot review & next iteration order)
```

1. **One Prompt**: 复制入口提示词并粘贴到你当前 agent 会话
2. **Bootstrap**: agent 创建 `goal/root.md` + `goal/.state.json`
3. **Drive in-session**: CEO 在当前会话持续推进；你可随时插话
4. **Done**: checklist 按 P0 → P1 → P2 逐层完成

长任务续航：每轮更新 `goal/.state.json.handoff`，换会话可用 `noman handoff` 秒级接续。

## Quick Start (desloppify-style)

### 1) 直接复制下面这段 Prompt 给你的 agent

> 目标：让 agent **自动 setup noman 并立即进入 drive**，用户不再手动敲流程命令。

```text
你现在是 noman setup 执行代理。请在当前仓库直接完成 setup，并在同一会话进入 drive。

硬约束：
- 全程中文
- 少问问题；只有在缺失核心目标时，最多问 3 个关键问题
- 不要让我再手动执行额外步骤

执行步骤（按顺序）：
1) 快速审查仓库（README、AGENTS.md、package.json、src/、prompts/、goal/）。
2) 若依赖未安装或构建产物缺失，执行：
   - npm install
   - npm run build
3) 若 goal/root.md 不存在或是模板，占位提问后直接创建/覆盖：
   - goal/root.md（必须含 P0/P1/P2；P0 每项有 verification 命令）
   - goal/.state.json（含 handoff 字段）
4) 输出 <= 6 行「项目目标摘要」。
5) 在当前会话直接进入 CEO 循环：REVIEW → IMPL → FIX → RE-REVIEW。
6) 每轮结束：
   - 更新 goal/.state.json.handoff
   - 生成一段给 BOSS 的结果汇报（结果、证据、阻塞、下一步）
7) 若会话中断风险升高，先写 checkpoint 再继续。

开始执行，不要复述要求。
```

### 2) 粘贴后就开跑

你只需要粘贴一次。后续由 agent 在会话内完成 setup + drive。

---

### 可选 CLI（调试/辅助）

```bash
# 生成入口 prompt
npx tsx src/index.ts prompt --dir /path/to/your/project

# 生成并尝试复制到剪贴板
npx tsx src/index.ts start --dir /path/to/your/project --copy

# 刷新 checkpoint
npx tsx src/index.ts checkpoint --goal-dir goal

# 生成跨会话续跑 prompt
npx tsx src/index.ts handoff --goal-dir goal

# 生成 BOSS 热 review packet
npx tsx src/index.ts boss --goal-dir goal
```

## The CEO

The CEO agent (`prompts/ceo.md`) operates on three principles:

- **归一性 (Unity)** — one way to do each thing. Contradictions are bugs.
- **Deletion** — the best part is no part. Complexity must earn its place.
- **Taste** — simplest thing that delivers the best experience.

It "hires" specialized agents as needed: reviewer, designer, tech lead, implementer. Like HR, it crafts each agent's prompt to match the task.

新增 BOSS 后台督战角色（`prompts/boss.md`）：对 CEO 进行结果导向的高压复盘，并下达下一轮迭代命令（目标可配置为增长 KPI，例如 stars）。

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
