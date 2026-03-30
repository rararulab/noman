#!/usr/bin/env node

import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
import { drive } from "./loop.js";
import { setup } from "./setup.js";

const USAGE = `
noman — self-driven AI agent loop

Usage:
  noman setup [--dir <path>]        Interactive interview → generate project goal
  noman drive [--goal-dir <path>]   Run the drive loop
  noman init  [--dir <path>]        Scaffold blank goal/ (manual editing)

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

  switch (command) {
    case "setup":
      await runSetup(args);
      break;
    case "drive":
      await runDrive(args);
      break;
    case "init":
      await runInit(args);
      break;
    default:
      console.error(`unknown command: ${command}`);
      console.log(USAGE);
      process.exit(1);
  }
}

async function runSetup(args: string[]): Promise<void> {
  const dirIdx = args.indexOf("--dir");
  const targetDir = dirIdx >= 0 ? resolve(args[dirIdx + 1]) : process.cwd();
  await setup(targetDir);
}

async function runInit(args: string[]): Promise<void> {
  const dirIdx = args.indexOf("--dir");
  const targetDir = dirIdx >= 0 ? resolve(args[dirIdx + 1]) : process.cwd();
  const goalDir = join(targetDir, "goal");

  if (existsSync(goalDir)) {
    console.log(`goal/ already exists at ${goalDir}`);
    process.exit(1);
  }

  const { mkdirSync, writeFileSync, copyFileSync } = await import("node:fs");
  const promptsDir = join(import.meta.dirname, "..", "prompts");

  mkdirSync(goalDir, { recursive: true });
  copyFileSync(join(promptsDir, "agent.md"), join(goalDir, "agent.md"));

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

  writeFileSync(
    join(goalDir, ".state.json"),
    JSON.stringify({ currentTier: "", cycle: 0, items: {}, history: [], subGoalsCreated: 0 }, null, 2) + "\n",
    "utf-8"
  );

  console.log(`initialized blank goal/ at ${goalDir}`);
  console.log("next: edit goal/root.md manually, or use 'noman setup' for guided interview");
}

async function runDrive(args: string[]): Promise<void> {
  const goalDirIdx = args.indexOf("--goal-dir");
  const goalDir = goalDirIdx >= 0 ? resolve(args[goalDirIdx + 1]) : join(process.cwd(), "goal");
  const projectDir = resolve(goalDir, "..");

  if (!existsSync(goalDir)) {
    console.error(`no goal/ directory found at ${goalDir}`);
    console.error("run: noman setup");
    process.exit(1);
  }

  if (!existsSync(join(goalDir, "root.md"))) {
    console.error("no root.md found in goal/");
    console.error("run: noman setup");
    process.exit(1);
  }

  await drive({ goalDir, projectDir });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
