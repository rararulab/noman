#!/usr/bin/env node

import { resolve, join } from "node:path";
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { drive } from "./loop.js";

const USAGE = `
noman — self-driven AI agent loop

Usage:
  noman drive [--goal-dir <path>]   Run the drive loop
  noman init  [--dir <path>]        Scaffold goal/ directory in a project

Options:
  --goal-dir   Path to goal directory (default: ./goal)
  --dir        Target project directory (default: .)
`.trim();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE);
    process.exit(0);
  }

  if (command === "init") {
    await init(args);
  } else if (command === "drive") {
    await runDrive(args);
  } else {
    console.error(`unknown command: ${command}`);
    console.log(USAGE);
    process.exit(1);
  }
}

async function init(args: string[]): Promise<void> {
  const dirIdx = args.indexOf("--dir");
  const targetDir = dirIdx >= 0 ? resolve(args[dirIdx + 1]) : process.cwd();
  const goalDir = join(targetDir, "goal");

  if (existsSync(goalDir)) {
    console.log(`goal/ already exists at ${goalDir}`);
    process.exit(1);
  }

  mkdirSync(goalDir, { recursive: true });

  // Copy prompts as agent.md
  const promptsDir = join(import.meta.dirname, "..", "prompts");
  copyFileSync(join(promptsDir, "agent.md"), join(goalDir, "agent.md"));

  // Create stub root.md
  writeFileSync(
    join(goalDir, "root.md"),
    `# Root Goal — <Your Project>

## Checklist

### P0 — Must work
- [ ] <What must work?> — <measurable criterion> — **verification**: <command to prove it>

### P1 — Core quality
- [ ] <Quality standard> — <measurable criterion>

### P2 — Polish
- [ ] <Polish item> — <measurable criterion>

## First Principles

<Why does this project exist? What are the non-negotiable qualities?>

## Current State

<To be filled by first review>

## Notes

<Context, trade-offs, observations>
`,
    "utf-8"
  );

  // Create initial state
  writeFileSync(
    join(goalDir, ".state.json"),
    JSON.stringify({ currentTier: "", cycle: 0, items: {}, history: [], subGoalsCreated: 0 }, null, 2) + "\n",
    "utf-8"
  );

  console.log(`initialized goal/ at ${goalDir}`);
  console.log("next steps:");
  console.log("  1. edit goal/root.md — define your objective and checklist");
  console.log("  2. run: noman drive");
}

async function runDrive(args: string[]): Promise<void> {
  const goalDirIdx = args.indexOf("--goal-dir");
  const goalDir = goalDirIdx >= 0 ? resolve(args[goalDirIdx + 1]) : join(process.cwd(), "goal");
  const projectDir = resolve(goalDir, "..");

  if (!existsSync(goalDir)) {
    console.error(`no goal/ directory found at ${goalDir}`);
    console.error("run: noman init");
    process.exit(1);
  }

  if (!existsSync(join(goalDir, "root.md"))) {
    console.error("no root.md found in goal/");
    console.error("run: noman init");
    process.exit(1);
  }

  await drive({ goalDir, projectDir });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
