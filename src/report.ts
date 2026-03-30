export interface ReviewReport {
  tier: string;
  itemsChecked: number;
  passed: string[];
  failed: string[];
  gaps: GapEntry[];
  newGoals: NewGoalEntry[];
}

export interface GapEntry {
  item: string;
  location: string;
  description: string;
  suggestedFix: string;
}

export interface NewGoalEntry {
  name: string;
  reason: string;
  principle: string;
}

export function parseReviewReport(output: string): ReviewReport {
  const report: ReviewReport = {
    tier: "",
    itemsChecked: 0,
    passed: [],
    failed: [],
    gaps: [],
    newGoals: [],
  };

  // Extract the structured block from claude's output
  // Claude may wrap it in markdown code fences or just output it raw
  const cleaned = output.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/, "").replace(/\n?```/, "");
  });

  const lines = cleaned.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("TIER:")) {
      report.tier = trimmed.slice(5).trim();
    } else if (trimmed.startsWith("ITEMS_CHECKED:")) {
      report.itemsChecked = parseInt(trimmed.slice(14).trim(), 10) || 0;
    } else if (trimmed.startsWith("PASSED:")) {
      report.passed = parseList(trimmed.slice(7));
    } else if (trimmed.startsWith("FAILED:")) {
      report.failed = parseList(trimmed.slice(7));
    } else if (/^\d+\.\s+\[/.test(trimmed)) {
      const gap = parseGapLine(trimmed);
      if (gap) report.gaps.push(gap);
    }
  }

  return report;
}

function parseList(raw: string): string[] {
  const match = raw.match(/\[([^\]]*)\]/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseGapLine(line: string): GapEntry | null {
  // Format: 1. [item] — file:line — description — suggested fix
  const match = line.match(/^\d+\.\s+\[(.+?)\]\s*—\s*(.+?)\s*—\s*(.+?)\s*—\s*(.+)$/);
  if (!match) return null;

  return {
    item: match[1].trim(),
    location: match[2].trim(),
    description: match[3].trim(),
    suggestedFix: match[4].trim(),
  };
}
