import { resolve } from "node:path";
import { getCurrentTier, getUncheckedItems, readGoalFile } from "./parser.js";
import { loadState, saveState } from "./state.js";

function topItems(items: string[], n = 5): string {
  if (items.length === 0) return "(none)";
  return items.slice(0, n).map((x) => `- ${x}`).join("\n");
}

export async function refreshHandoff(goalDir: string): Promise<void> {
  const goal = await readGoalFile(goalDir);
  const state = await loadState(goalDir);
  const tier = getCurrentTier(goal) ?? "ALL_DONE";

  const completed = goal.items.filter((i) => i.checked).map((i) => i.name);
  const inProgress = tier === "ALL_DONE" ? [] : getUncheckedItems(goal, tier).slice(0, 3).map((i) => i.name);
  const blocked = Object.entries(state.items)
    .filter(([, item]) => item.flagged)
    .map(([name]) => name);

  const objective = tier === "ALL_DONE" ? "All checklist complete" : `Close tier: ${tier}`;
  const nextActions =
    tier === "ALL_DONE"
      ? ["输出最终总结", "清理遗留 notes", "准备发布/合并"]
      : [
          `对 ${tier} 未完成项执行 REVIEW`,
          "按 gaps 派发 implementer/fixer 并最小改动闭环",
          "完成后 RE-REVIEW 并更新 checklist 与 handoff",
        ];

  state.handoff = {
    updatedAt: new Date().toISOString(),
    objective,
    completed,
    inProgress,
    blocked,
    nextActions,
    decisions: state.handoff?.decisions ?? [],
  };

  await saveState(goalDir, state);
}

export async function buildHandoffPrompt(goalDir: string): Promise<string> {
  await refreshHandoff(goalDir);

  const goal = await readGoalFile(goalDir);
  const state = await loadState(goalDir);
  const tier = getCurrentTier(goal) ?? "ALL_DONE";
  const pending = tier === "ALL_DONE" ? [] : getUncheckedItems(goal, tier).map((i) => i.name);
  const projectDir = resolve(goalDir, "..");

  const handoffSummary = state.handoff
    ? [
        `更新时间: ${state.handoff.updatedAt}`,
        `目标: ${state.handoff.objective}`,
        `完成: ${state.handoff.completed.length ? state.handoff.completed.join("; ") : "(none)"}`,
        `进行中: ${state.handoff.inProgress.length ? state.handoff.inProgress.join("; ") : "(none)"}`,
        `阻塞: ${state.handoff.blocked.length ? state.handoff.blocked.join("; ") : "(none)"}`,
        "下一步:",
        topItems(state.handoff.nextActions),
      ].join("\n")
    : "(no handoff snapshot yet)";

  return [
    "你现在接管 noman CEO 会话，请无缝续跑。",
    `项目目录: ${projectDir}`,
    `goal 目录: ${goalDir}`,
    `当前层级: ${tier}`,
    `当前 cycle: ${state.cycle}`,
    "",
    "待完成（当前层级）:",
    topItems(pending),
    "",
    "最近 checkpoint:",
    handoffSummary,
    "",
    "执行要求:",
    "1) 先读 goal/root.md 与 goal/.state.json，确认 tier 和未完成项。",
    "2) 继续 REVIEW → IMPL → FIX → RE-REVIEW，不要重置上下文。",
    "3) 每轮结束更新 .state.json.handoff（完成/进行中/阻塞/下一步/关键决策）。",
    "4) 给用户简短中文更新：进展 / 阻塞 / 下一步。",
  ].join("\n");
}
