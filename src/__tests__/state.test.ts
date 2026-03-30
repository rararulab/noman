import assert from "node:assert/strict";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadState, saveState } from "../state.js";
import type { DriveState } from "../state.js";

const tmpDir = join("/tmp", `noman-test-state-${Date.now()}`);
let passed = 0;
let failed = 0;

function test(name: string, fn: () => Promise<void>): Promise<void> {
  return fn()
    .then(() => {
      console.log(`  PASS  ${name}`);
      passed++;
    })
    .catch((err) => {
      console.log(`  FAIL  ${name}`);
      console.log(`        ${err instanceof Error ? err.message : err}`);
      failed++;
    });
}

async function run() {
  console.log("state.ts tests\n");

  mkdirSync(tmpDir, { recursive: true });

  await test("loadState returns defaults for non-existent file", async () => {
    const state = await loadState(tmpDir);
    assert.equal(state.currentTier, "");
    assert.equal(state.cycle, 0);
    assert.deepEqual(state.items, {});
    assert.deepEqual(state.history, []);
    assert.equal(state.subGoalsCreated, 0);
  });

  await test("saveState creates the file", async () => {
    const state = await loadState(tmpDir);
    await saveState(tmpDir, state);
    assert.ok(existsSync(join(tmpDir, ".state.json")));
  });

  await test("round-trip: save then load returns identical data", async () => {
    const state: DriveState = {
      currentTier: "T1",
      cycle: 3,
      items: {
        "setup-ci": { status: "passed", failures: 0, flagged: false },
        "add-tests": { status: "failed", failures: 2, flagged: false },
        "deploy": { status: "pending", failures: 0, flagged: false },
      },
      history: [
        { cycle: 1, phase: "REVIEW", timestamp: "2026-01-01T00:00:00.000Z", gaps: 5, tier: "T0" },
        { cycle: 2, phase: "IMPL", timestamp: "2026-01-02T00:00:00.000Z", gaps: 3, tier: "T0" },
        { cycle: 3, phase: "FIX", timestamp: "2026-01-03T00:00:00.000Z", gaps: 1, tier: "T1" },
      ],
      subGoalsCreated: 2,
      handoff: {
        updatedAt: "1970-01-01T00:00:00.000Z",
        objective: "",
        completed: [],
        inProgress: [],
        blocked: [],
        nextActions: [],
        decisions: [],
      },
    };

    await saveState(tmpDir, state);
    const loaded = await loadState(tmpDir);
    assert.deepEqual(loaded, state);
  });

  // cleanup
  rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
