import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ChecklistItem, GoalFile } from "./parser.js";
import type { DriveState } from "./state.js";

const PROMPTS_DIR = join(import.meta.dirname, "..", "prompts");

async function loadTemplate(name: string): Promise<string> {
  return readFile(join(PROMPTS_DIR, `${name}.md`), "utf-8");
}

function formatChecklist(items: ChecklistItem[]): string {
  return items
    .map((i) => `- [${i.checked ? "x" : " "}] **${i.name}** — ${i.description}`)
    .join("\n");
}

export async function buildCeoPrompt(goal: GoalFile, state: DriveState): Promise<string> {
  const ceoTemplate = await loadTemplate("ceo");
  const agentTemplate = await loadTemplate("agent");

  return `${ceoTemplate}

---

# Goal System Reference

${agentTemplate}

---

# Current Goal

${goal.raw}

---

# Current State (machine)

Current Tier: ${state.currentTier}
Cycle: ${state.cycle}
Items: ${JSON.stringify(state.items, null, 2)}

---

# Your Task

Drive the iteration loop for tier **${state.currentTier}**. You are the CEO — dispatch the right agents, make decisions, advance the goal.
`;
}

export async function buildReviewPrompt(
  goal: GoalFile,
  tier: string,
  items: ChecklistItem[]
): Promise<string> {
  const template = await loadTemplate("review");

  return template
    .replaceAll("{{TIER}}", tier)
    .replaceAll("{{CHECKLIST_ITEMS}}", formatChecklist(items))
    .replaceAll("{{CURRENT_STATE}}", goal.currentState || "(not yet assessed)");
}

export interface GapInfo {
  item: string;
  description: string;
  location: string;
  suggestedFix: string;
  verification?: string;
}

export async function buildImplPrompt(gap: GapInfo, context: string): Promise<string> {
  const template = await loadTemplate("impl");

  return template
    .replaceAll("{{ITEM}}", gap.item)
    .replaceAll("{{GAP_DESCRIPTION}}", gap.description)
    .replaceAll("{{LOCATION}}", gap.location)
    .replaceAll("{{SUGGESTED_FIX}}", gap.suggestedFix)
    .replaceAll("{{VERIFICATION}}", gap.verification ?? "(none specified)")
    .replaceAll("{{CONTEXT}}", context);
}
