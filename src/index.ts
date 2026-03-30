#!/usr/bin/env node

import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
import { drive } from "./loop.js";
import { setup } from "./setup.js";
import { buildQuickstartPrompt } from "./quickstart.js";

const USAGE = `
noman — self-driven AI agent loop

Usage:
  noman prompt [--dir <path>]       Print one-copy agent entry prompt (recommended)
  noman setup [--dir <path>]        Legacy interview flow → generate project goal
  noman drive [--goal-dir <path>] [--agent <name>] Legacy/debug: print CEO packet only
  noman init  [--dir <path>]        Scaffold blank goal/ (manual editing)

Options:
  --goal-dir   Path to goal directory (default: ./goal)
  --dir        Target project directory (default: .)
  --agent      Subagent CLI: auto | claude | codex | openai-compatible
`.trim();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE);
    process.exit(0);
  }

  switch (command) {
    case "prompt":
      await runPrompt(args);
      break;
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

async function runPrompt(args: string[]): Promise<void> {
  const dirIdx = args.indexOf("--dir");
  const targetDir = dirIdx >= 0 ? resolve(args[dirIdx + 1]) : process.cwd();
  const prompt = buildQuickstartPrompt(targetDir);

  console.log(prompt);
  console.log("\n---");
  console.log("复制上面的提示词，粘贴给你的 agent（Claude/Codex）即可开始（无需再用 TS CLI 驱动运行时 loop）。");
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
  const agentIdx = args.indexOf("--agent");
  const goalDir = goalDirIdx >= 0 ? resolve(args[goalDirIdx + 1]) : join(process.cwd(), "goal");
  const projectDir = resolve(goalDir, "..");
  const agentPreference = agentIdx >= 0 ? args[agentIdx + 1] : undefined;

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

  console.log("[legacy] drive 仅输出 CEO packet；推荐直接使用 noman prompt 进入当前 agent 会话驱动。");
  await drive({ goalDir, projectDir, agentPreference });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
