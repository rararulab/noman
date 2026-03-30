import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { getCurrentTier, getUncheckedItems, readGoalFile } from "./parser.js";
import { loadState } from "./state.js";

const PROMPTS_DIR = join(import.meta.dirname, "..", "prompts");

async function loadTemplate(name: string): Promise<string> {
  return readFile(join(PROMPTS_DIR, `${name}.md`), "utf-8");
}

export async function buildBossReviewPacket(goalDir: string): Promise<string> {
  const goal = await readGoalFile(goalDir);
  const state = await loadState(goalDir);
  const bossTemplate = await loadTemplate("boss");
  const tier = getCurrentTier(goal) ?? "ALL_DONE";
  const pending = tier === "ALL_DONE" ? [] : getUncheckedItems(goal, tier).map((i) => i.name);
  const projectDir = resolve(goalDir, "..");

  return `${bossTemplate}

---

# Project Context

Project Dir: ${projectDir}
Goal Dir: ${goalDir}
Current Tier: ${tier}
Cycle: ${state.cycle}

Pending Items:
${pending.length ? pending.map((x) => `- ${x}`).join("\n") : "(none)"}

Handoff Snapshot:
${JSON.stringify(state.handoff ?? {}, null, 2)}

---

# Task

对 CEO 做一轮热 review，并产出下一轮迭代命令。严格使用 Output Format。
`;
}
