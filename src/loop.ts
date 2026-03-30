import { getCurrentTier, readGoalFile } from "./parser.js";
import { loadState, saveState } from "./state.js";
import { formatAgentLabel, resolveAgent } from "./agent.js";
import { refreshHandoff } from "./handoff.js";
import { startBossDaemon } from "./boss-daemon.js";

interface LoopContext {
  goalDir: string;
  projectDir: string;
  agentPreference?: string;
}

function log(phase: string, msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${phase}] ${msg}`);
}

export async function drive(ctx: LoopContext): Promise<void> {
  const agent = resolveAgent(ctx.agentPreference);
  log("DRIVE", `BOSS daemon starting (subagent CLI: ${formatAgentLabel(agent)})`);

  const goal = await readGoalFile(ctx.goalDir);
  const nextTier = getCurrentTier(goal);

  if (!nextTier) {
    log("DRIVE", "all checklist items complete. nothing to drive.");
    return;
  }

  await refreshHandoff(ctx.goalDir);
  const state = await loadState(ctx.goalDir);
  if (state.currentTier !== nextTier) {
    state.currentTier = nextTier;
    await saveState(ctx.goalDir, state);
  }

  // Start BOSS daemon (runs in background, never returns)
  // Don't await — it polls forever
  startBossDaemon(ctx.goalDir, agent).catch((err) => {
    log("BOSS-DAEMON", `BOSS daemon crashed: ${err.message}`);
    log("BOSS-DAEMON", "restart with: noman drive");
    process.exit(1);
  });

  log("DRIVE", "BOSS daemon is running in background");
  log("DRIVE", `watching: ${ctx.goalDir}/.state.json`);
  log("DRIVE", `reviews written to: ${ctx.goalDir}/.boss-review.json`);
  log("DRIVE", "CEO should run in your agent session — BOSS will auto-review each cycle");

  // Keep process alive (daemon is running)
  // The process will stay alive as long as the daemon is polling
  await new Promise(() => {}); // never resolves — keeps event loop alive
}
