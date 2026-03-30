import assert from "node:assert/strict";
import {
  parseGoalMarkdown,
  getItemsForTier,
  getUncheckedItems,
  getCurrentTier,
} from "../parser.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
console.log("\n--- parseGoalMarkdown ---");

const FULL_GOAL = `# My Goal

## Checklist

### P0 — Must work
- [x] **Parser works** — extracts tiers correctly
- [ ] **State works** — round-trips state

### P1 — Quality
- [ ] **Logs structured** — every log line has context

### P2 — Polish
- [x] **CLI help** — produces useful output

## First Principles

Be autonomous.

## Current State

Everything is fine.

## Notes

Some note here.
`;

test("extracts title", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.equal(goal.title, "My Goal");
});

test("extracts all tiers in order", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.deepEqual(goal.tiers, [
    "P0 — Must work",
    "P1 — Quality",
    "P2 — Polish",
  ]);
});

test("extracts correct number of items", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.equal(goal.items.length, 4);
});

test("detects checked items", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  const parserItem = goal.items.find((i) => i.name === "Parser works");
  assert.ok(parserItem);
  assert.equal(parserItem.checked, true);
});

test("detects unchecked items", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  const stateItem = goal.items.find((i) => i.name === "State works");
  assert.ok(stateItem);
  assert.equal(stateItem.checked, false);
});

test("assigns correct tier to each item", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  const p0Items = goal.items.filter((i) => i.tier === "P0 — Must work");
  const p1Items = goal.items.filter((i) => i.tier === "P1 — Quality");
  const p2Items = goal.items.filter((i) => i.tier === "P2 — Polish");
  assert.equal(p0Items.length, 2);
  assert.equal(p1Items.length, 1);
  assert.equal(p2Items.length, 1);
});

test("extracts item names without bold markers", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.ok(goal.items.every((i) => !i.name.includes("**")));
});

test("extracts item descriptions", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  const item = goal.items.find((i) => i.name === "Parser works");
  assert.ok(item);
  assert.equal(item.description, "extracts tiers correctly");
});

test("extracts firstPrinciples section", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.equal(goal.firstPrinciples, "Be autonomous.");
});

test("extracts currentState section", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.equal(goal.currentState, "Everything is fine.");
});

test("extracts notes section", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.equal(goal.notes, "Some note here.");
});

test("preserves raw content", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.equal(goal.raw, FULL_GOAL);
});

// ---------------------------------------------------------------------------
console.log("\n--- verification field ---");

const WITH_VERIFICATION = `# V Goal

## Checklist

### P0
- [ ] **Test item** — does something — **verification**: npx tsx test.ts
`;

test("extracts verification when present", () => {
  const goal = parseGoalMarkdown(WITH_VERIFICATION);
  assert.equal(goal.items.length, 1);
  assert.equal(goal.items[0].verification, "npx tsx test.ts");
});

test("verification is undefined when absent", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  const item = goal.items.find((i) => i.name === "Parser works");
  assert.ok(item);
  assert.equal(item.verification, undefined);
});

// ---------------------------------------------------------------------------
console.log("\n--- edge cases ---");

test("empty input returns empty goal", () => {
  const goal = parseGoalMarkdown("");
  assert.equal(goal.title, "");
  assert.deepEqual(goal.tiers, []);
  assert.deepEqual(goal.items, []);
  assert.equal(goal.firstPrinciples, "");
  assert.equal(goal.currentState, "");
  assert.equal(goal.notes, "");
});

test("title-only input", () => {
  const goal = parseGoalMarkdown("# Just a title\n");
  assert.equal(goal.title, "Just a title");
  assert.deepEqual(goal.items, []);
});

test("checklist section with no tier header produces no items", () => {
  const md = `# G

## Checklist

- [ ] **Orphan** — no tier above
`;
  const goal = parseGoalMarkdown(md);
  assert.deepEqual(goal.items, []);
});

test("items outside checklist section are ignored", () => {
  const md = `# G

## Not Checklist

### P0
- [ ] **Item** — should be ignored
`;
  const goal = parseGoalMarkdown(md);
  assert.deepEqual(goal.items, []);
});

// ---------------------------------------------------------------------------
console.log("\n--- helper functions ---");

test("getItemsForTier filters by tier", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  const p1 = getItemsForTier(goal, "P1 — Quality");
  assert.equal(p1.length, 1);
  assert.equal(p1[0].name, "Logs structured");
});

test("getUncheckedItems returns only unchecked in tier", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  const unchecked = getUncheckedItems(goal, "P0 — Must work");
  assert.equal(unchecked.length, 1);
  assert.equal(unchecked[0].name, "State works");
});

test("getCurrentTier returns first tier with unchecked items", () => {
  const goal = parseGoalMarkdown(FULL_GOAL);
  assert.equal(getCurrentTier(goal), "P0 — Must work");
});

test("getCurrentTier returns null when all done", () => {
  const md = `# G

## Checklist

### P0
- [x] **Done** — finished
`;
  const goal = parseGoalMarkdown(md);
  assert.equal(getCurrentTier(goal), null);
});

// ---------------------------------------------------------------------------
console.log("\n---");
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
