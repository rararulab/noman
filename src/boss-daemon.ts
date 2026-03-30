import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadState } from "./state.js";
import { buildBossReviewPacket } from "./boss.js";
import { runAgent } from "./agent.js";
import type { AgentConfig } from "./agent.js";

export interface BossReview {
  score: number;
  verdict: "PASS" | "PRESSURE" | "RED_ALERT" | "UNKNOWN";
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  pressureNotes: string[];
  raw: string;
  reviewedAt: string;
  cycle: number;
}

function parseBossOutput(output: string): Omit<BossReview, "reviewedAt" | "cycle"> {
  const review: Omit<BossReview, "reviewedAt" | "cycle"> = {
    score: 0,
    verdict: "UNKNOWN",
    strengths: [],
    weaknesses: [],
    nextActions: [],
    pressureNotes: [],
    raw: output,
  };

  const scoreMatch = output.match(/SCORE:\s*(\d+)/);
  if (scoreMatch) review.score = parseInt(scoreMatch[1], 10);

  const verdictMatch = output.match(/VERDICT:\s*(PASS|PRESSURE|RED_ALERT)/);
  if (verdictMatch) review.verdict = verdictMatch[1] as BossReview["verdict"];

  review.strengths = extractListSection(output, "WHAT_WORKED");
  review.weaknesses = extractListSection(output, "WHAT_IS_WEAK");
  review.pressureNotes = extractListSection(output, "PRESSURE_NOTES");
  review.nextActions = extractNumberedSection(output, "NEXT_ITERATION_ORDER");

  return review;
}

function extractListSection(text: string, header: string): string[] {
  const regex = new RegExp(`${header}:\\s*\\n([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`);
  const match = text.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^[\s-]*/, "").trim())
    .filter(Boolean);
}

function extractNumberedSection(text: string, header: string): string[] {
  const regex = new RegExp(`${header}:\\s*\\n([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`);
  const match = text.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function log(phase: string, msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.error(`[${ts}] [${phase}] ${msg}`);
}

export async function startBossDaemon(
  goalDir: string,
  agent: AgentConfig,
  pollInterval = 15_000,
): Promise<void> {
  let lastUpdatedAt = "";
  const reviewPath = join(goalDir, ".boss-review.json");

  log("BOSS", `started — watching ${goalDir}/.state.json (poll ${pollInterval / 1000}s)`);

  // Read initial state to avoid triggering on startup
  try {
    const state = await loadState(goalDir);
    lastUpdatedAt = state.handoff?.updatedAt ?? "";
  } catch {
    // state might not exist yet
  }

  while (true) {
    await sleep(pollInterval);

    try {
      const state = await loadState(goalDir);
      const currentUpdatedAt = state.handoff?.updatedAt ?? "";

      if (currentUpdatedAt && currentUpdatedAt !== lastUpdatedAt) {
        lastUpdatedAt = currentUpdatedAt;
        log("BOSS", `state change detected (cycle ${state.cycle}) — spawning BOSS review...`);

        // Build BOSS review prompt
        const packet = await buildBossReviewPacket(goalDir);

        // Spawn BOSS agent
        const result = await runAgent({
          prompt: packet,
          cwd: join(goalDir, ".."),
          agent,
          maxTurns: 5,
          timeout: 120_000,
        });

        // Parse and write review
        const parsed = parseBossOutput(result.stdout);
        const review: BossReview = {
          ...parsed,
          reviewedAt: new Date().toISOString(),
          cycle: state.cycle,
        };

        await writeFile(reviewPath, JSON.stringify(review, null, 2) + "\n", "utf-8");
        log("BOSS", `review written — score: ${review.score}, verdict: ${review.verdict}`);

        if (review.verdict === "RED_ALERT") {
          log("BOSS", "RED_ALERT — CEO should escalate to user");
        }
      }
    } catch (err) {
      log("BOSS", `error: ${err instanceof Error ? err.message : String(err)}`);
      // Don't crash — keep polling
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
