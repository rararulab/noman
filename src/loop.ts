import { readGoalFile, getCurrentTier, getItemsForTier, getUncheckedItems, type GoalFile } from "./parser.js";
import { loadState, saveState, addCycleEntry, recordPass, recordFailure, type DriveState } from "./state.js";
import { runClaude, runClaudeParallel } from "./claude.js";
import { buildReviewPrompt, buildImplPrompt, type GapInfo } from "./prompt.js";
import { parseReviewReport, type ReviewReport } from "./report.js";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_CYCLES_PER_TIER = 10;
const MAX_PARALLEL_IMPL = 3;

interface LoopContext {
  goalDir: string;
  projectDir: string;
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

export async function drive(ctx: LoopContext): Promise<void> {
  log("noman: starting drive loop");

  let state = await loadState(ctx.goalDir);
  let goal = await readGoalFile(ctx.goalDir);

  // Determine starting tier
  const startTier = getCurrentTier(goal);
  if (!startTier) {
    log("all checklist items are complete. nothing to drive.");
    return;
  }

  state.currentTier = startTier;
  log(`starting at tier: ${state.currentTier}`);

  while (true) {
    const tier = getCurrentTier(goal);
    if (!tier) {
      log("all tiers complete. goal achieved.");
      break;
    }

    if (tier !== state.currentTier) {
      log(`advancing to tier: ${tier}`);
      state.currentTier = tier;
      state.cycle = 0;
    }

    state.cycle++;

    if (state.cycle > MAX_CYCLES_PER_TIER) {
      log(`hit ${MAX_CYCLES_PER_TIER} cycles on tier ${tier}. stopping — needs human judgment.`);
      break;
    }

    log(`--- cycle ${state.cycle} / tier ${tier} ---`);

    // PHASE 1: REVIEW
    log("phase: REVIEW");
    const report = await review(ctx, goal, tier);
    addCycleEntry(state, "REVIEW", report.gaps.length);

    // Update state from report
    for (const name of report.passed) recordPass(state, name);
    for (const name of report.failed) {
      const needsEscalation = recordFailure(state, name);
      if (needsEscalation) {
        log(`⚠️  item "${name}" failed 3 times. flagged for escalation.`);
      }
    }

    await saveState(ctx.goalDir, state);

    // Check if tier is complete
    if (report.gaps.length === 0 && report.failed.length === 0) {
      log(`tier ${tier} complete!`);
      await updateGoalChecklist(ctx.goalDir, report);

      // Re-read goal to get fresh state
      goal = await readGoalFile(ctx.goalDir);
      continue;
    }

    // PHASE 2: IMPL
    log(`phase: IMPL — ${report.gaps.length} gap(s) to fix`);
    const implGaps = report.gaps.filter((g) => {
      const itemState = state.items[g.item];
      return !itemState?.flagged; // skip 3-strike items
    });

    if (implGaps.length > 0) {
      await implement(ctx, implGaps, goal);
      addCycleEntry(state, "IMPL", implGaps.length);
      await saveState(ctx.goalDir, state);
    }

    // Re-read goal for next cycle
    goal = await readGoalFile(ctx.goalDir);
  }

  await saveState(ctx.goalDir, state);
  log("drive loop complete.");
}

async function review(ctx: LoopContext, goal: GoalFile, tier: string): Promise<ReviewReport> {
  const items = getItemsForTier(goal, tier);
  const prompt = await buildReviewPrompt(goal, tier, items);

  const result = await runClaude({
    prompt,
    cwd: ctx.projectDir,
    maxTurns: 30,
  });

  if (result.exitCode !== 0) {
    log(`review agent failed (exit ${result.exitCode}): ${result.stderr.slice(0, 200)}`);
    return { tier, itemsChecked: 0, passed: [], failed: [], gaps: [], newGoals: [] };
  }

  return parseReviewReport(result.stdout);
}

async function implement(ctx: LoopContext, gaps: { item: string; location: string; description: string; suggestedFix: string }[], goal: GoalFile): Promise<void> {
  const implOptions = await Promise.all(
    gaps.map(async (gap) => {
      const gapInfo: GapInfo = {
        item: gap.item,
        description: gap.description,
        location: gap.location,
        suggestedFix: gap.suggestedFix,
      };

      const prompt = await buildImplPrompt(gapInfo, `Project: ${goal.title}\n${goal.firstPrinciples}`);

      return {
        prompt,
        cwd: ctx.projectDir,
        maxTurns: 30,
      };
    })
  );

  const results = await runClaudeParallel(implOptions, MAX_PARALLEL_IMPL);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const gap = gaps[i];
    if (r.exitCode !== 0) {
      log(`impl agent failed for "${gap.item}": ${r.stderr.slice(0, 200)}`);
    } else {
      log(`impl agent completed for "${gap.item}"`);
    }
  }
}

async function updateGoalChecklist(goalDir: string, report: ReviewReport): Promise<void> {
  const path = join(goalDir, "root.md");
  let content = await readFile(path, "utf-8");

  for (const passedItem of report.passed) {
    // Mark [ ] → [x] for passed items
    const pattern = new RegExp(`- \\[ \\] (\\*\\*)?${escapeRegex(passedItem)}`, "g");
    content = content.replace(pattern, (match) => match.replace("- [ ]", "- [x]"));
  }

  await writeFile(path, content, "utf-8");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
