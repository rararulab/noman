import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface ChecklistItem {
  name: string;
  description: string;
  verification?: string;
  checked: boolean;
  tier: string;
  failed?: number;
  flagged?: boolean; // ⚠️ 3-strike
}

export interface GoalFile {
  title: string;
  tiers: string[];
  items: ChecklistItem[];
  firstPrinciples: string;
  currentState: string;
  notes: string;
  raw: string;
}

const TIER_PATTERN = /^###\s+(.+)$/;
const ITEM_PATTERN = /^- \[([ x])\] \*?\*?(.+?)\*?\*?\s*—\s*(.+)$/;
const VERIFICATION_PATTERN = /\*\*verification\*?\*?:\s*(.+)/i;

export function parseGoalMarkdown(content: string): GoalFile {
  const lines = content.split("\n");
  const items: ChecklistItem[] = [];
  const tiers: string[] = [];
  let currentTier = "";
  let title = "";
  let firstPrinciples = "";
  let currentState = "";
  let notes = "";

  let section = "";

  for (const line of lines) {
    // Title
    if (line.startsWith("# ") && !title) {
      title = line.slice(2).trim();
      continue;
    }

    // Section headers
    if (line.startsWith("## ")) {
      section = line.slice(3).trim().toLowerCase();
      continue;
    }

    // Tier headers within checklist
    const tierMatch = line.match(TIER_PATTERN);
    if (tierMatch && section === "checklist") {
      currentTier = tierMatch[1].trim();
      if (!tiers.includes(currentTier)) tiers.push(currentTier);
      continue;
    }

    // Checklist items
    const itemMatch = line.match(ITEM_PATTERN);
    if (itemMatch && currentTier) {
      const checked = itemMatch[1] === "x";
      const name = itemMatch[2].replace(/\*\*/g, "").trim();
      const rest = itemMatch[3].trim();
      const verMatch = rest.match(VERIFICATION_PATTERN);

      items.push({
        name,
        description: rest,
        verification: verMatch?.[1]?.trim(),
        checked,
        tier: currentTier,
      });
      continue;
    }

    // Collect section content
    if (section === "first principles") {
      firstPrinciples += line + "\n";
    } else if (section === "current state") {
      currentState += line + "\n";
    } else if (section === "notes") {
      notes += line + "\n";
    }
  }

  return {
    title,
    tiers,
    items,
    firstPrinciples: firstPrinciples.trim(),
    currentState: currentState.trim(),
    notes: notes.trim(),
    raw: content,
  };
}

export async function readGoalFile(goalDir: string, name = "root"): Promise<GoalFile> {
  const path = join(goalDir, `${name}.md`);
  const content = await readFile(path, "utf-8");
  return parseGoalMarkdown(content);
}

export function getItemsForTier(goal: GoalFile, tier: string): ChecklistItem[] {
  return goal.items.filter((item) => item.tier === tier);
}

export function getUncheckedItems(goal: GoalFile, tier: string): ChecklistItem[] {
  return goal.items.filter((item) => item.tier === tier && !item.checked);
}

export function getCurrentTier(goal: GoalFile): string | null {
  for (const tier of goal.tiers) {
    const unchecked = getUncheckedItems(goal, tier);
    if (unchecked.length > 0) return tier;
  }
  return null; // all done
}
