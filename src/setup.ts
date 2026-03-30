import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const PROMPTS_DIR = join(import.meta.dirname, "..", "prompts");

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

/**
 * Phase 1: Interactive interview via claude conversational mode.
 * Streams the conversation to the user's terminal — claude talks directly to the user.
 * Returns the full conversation output containing the SPEC block.
 */
async function interview(): Promise<string> {
  const setupPrompt = await readFile(join(PROMPTS_DIR, "setup.md"), "utf-8");

  log("starting project interview...\n");

  return new Promise((resolve, reject) => {
    // Use claude in interactive (non -p) mode via --print and stdin piping won't work.
    // Instead: use -p with the setup prompt, but enable --verbose and stream output.
    // The interviewer needs to be conversational, so we use claude without -p
    // and pipe the system prompt via --system-prompt append.
    //
    // Simplest approach: run claude interactively, let it talk to the user directly.
    const proc = spawn("claude", ["--system-prompt", setupPrompt], {
      stdio: ["inherit", "pipe", "inherit"],
      env: { ...process.env },
    });

    let output = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`interview ended with exit code ${code}`));
        return;
      }
      resolve(output);
    });

    proc.on("error", reject);
  });
}

/**
 * Extract SPEC block from interview output.
 */
function extractSpec(output: string): string | null {
  const match = output.match(/```SPEC\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

/**
 * Phase 2: CEO writes root.md from the spec.
 */
async function writeGoalFromSpec(spec: string, goalDir: string): Promise<void> {
  const goalwriterPrompt = await readFile(join(PROMPTS_DIR, "goalwriter.md"), "utf-8");

  const prompt = `${goalwriterPrompt}\n\n---\n\n# Project Spec\n\n${spec}`;

  log("CEO is writing the goal...");

  const result = await new Promise<string>((resolve, reject) => {
    const proc = spawn("claude", ["-p", prompt, "--output-format", "text"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`goalwriter failed with exit code ${code}`));
      else resolve(stdout);
    });

    proc.on("error", reject);
  });

  // Write root.md
  const rootPath = join(goalDir, "root.md");
  await writeFile(rootPath, result.trim() + "\n", "utf-8");
  log(`wrote ${rootPath}`);
}

/**
 * Full setup flow: interview → spec → goal
 */
export async function setup(targetDir: string): Promise<void> {
  const goalDir = join(targetDir, "goal");

  if (existsSync(join(goalDir, "root.md"))) {
    const content = await readFile(join(goalDir, "root.md"), "utf-8");
    if (!content.includes("<Your Project>") && !content.includes("<What must work?>")) {
      log("goal/root.md already exists with real content. use 'noman drive' to continue.");
      process.exit(1);
    }
  }

  // Ensure goal dir exists
  await mkdir(goalDir, { recursive: true });

  // Copy agent.md if not present
  const agentDst = join(goalDir, "agent.md");
  if (!existsSync(agentDst)) {
    await copyFile(join(PROMPTS_DIR, "agent.md"), agentDst);
  }

  // Phase 1: Interview
  const output = await interview();

  // Extract spec
  const spec = extractSpec(output);
  if (!spec) {
    log("could not extract SPEC from interview. saving raw output for manual review.");
    await writeFile(join(goalDir, "interview-raw.md"), output, "utf-8");
    log(`saved raw output to ${join(goalDir, "interview-raw.md")}`);
    log("please extract the spec manually and run setup again, or edit root.md directly.");
    return;
  }

  // Save spec for reference
  await writeFile(join(goalDir, "spec.md"), spec + "\n", "utf-8");
  log(`saved spec to ${join(goalDir, "spec.md")}`);

  // Phase 2: CEO writes goal
  await writeGoalFromSpec(spec, goalDir);

  // Initialize state
  const statePath = join(goalDir, ".state.json");
  if (!existsSync(statePath)) {
    await writeFile(
      statePath,
      JSON.stringify({ currentTier: "", cycle: 0, items: {}, history: [], subGoalsCreated: 0 }, null, 2) + "\n",
      "utf-8"
    );
  }

  console.log("\n---");
  log("setup complete.");
  log("review goal/root.md — the CEO wrote your project goal.");
  log("next: 用 noman prompt 生成入口提示词，粘贴到当前 agent 会话直接开始 drive。");
}
