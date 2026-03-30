import { getCurrentTier, readGoalFile } from "./parser.js";
import { buildCeoPrompt } from "./prompt.js";
import { loadState, saveState } from "./state.js";
import { formatAgentLabel, resolveAgent } from "./agent.js";

interface LoopContext {
  goalDir: string;
  projectDir: string;
  agentPreference?: string;
}

function log(phase: string, msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${phase}] ${msg}`);
}

function buildKickoffPrompt(tier: string, agentCommand: string, agentLabel: string): string {
  return [
    "进入 drive 模式。",
    `当前优先级层级: ${tier}`,
    "",
    "要求:",
    `0) CEO 本体运行在当前用户 agent 会话中，不通过 noman 启动额外 CEO loop。`,
    `0.5) 派发子 agent 时使用本机 agent-cli：${agentLabel}（命令: ${agentCommand}）。`,
    "1) 你是 CEO 协调者，只派发子 agent，不亲自改代码。",
    "2) 在这个单一会话里持续推进 REVIEW → IMPL → FIX → RE-REVIEW。",
    "3) 用户随时可能插话给新想法；收到后立刻重排优先级并继续。",
    "4) 每轮结束都用简短中文汇报进展、阻塞和下一步。",
  ].join("\n");
}

export async function drive(ctx: LoopContext): Promise<void> {
  const agent = resolveAgent(ctx.agentPreference);
  log("DRIVE", `starting agent-native CEO session packet (subagent CLI: ${formatAgentLabel(agent)})`);

  const goal = await readGoalFile(ctx.goalDir);
  const nextTier = getCurrentTier(goal);

  if (!nextTier) {
    log("DRIVE", "all checklist items are complete. nothing to drive.");
    return;
  }

  const state = await loadState(ctx.goalDir);
  if (state.currentTier !== nextTier) {
    state.currentTier = nextTier;
    state.cycle = 0;
    await saveState(ctx.goalDir, state);
  }

  const systemPrompt = await buildCeoPrompt(goal, state);
  const initialPrompt = buildKickoffPrompt(nextTier, agent.command, formatAgentLabel(agent));

  log("DRIVE", `prepared CEO packet at tier: ${nextTier}`);
  log("DRIVE", "no subprocess spawned for CEO; current session should continue directly");

  console.log("\n===== NOMAN DRIVE PACKET (SYSTEM PROMPT) =====\n");
  console.log(systemPrompt.trim());
  console.log("\n===== NOMAN DRIVE PACKET (KICKOFF MESSAGE) =====\n");
  console.log(initialPrompt.trim());
  console.log("\n===== END OF PACKET =====\n");
}
