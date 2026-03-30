import { spawn, spawnSync } from "node:child_process";

export type AgentKind = "claude" | "codex";

export interface AgentConfig {
  kind: AgentKind;
  command: string;
}

export interface AgentResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface AgentRunOptions {
  prompt: string;
  cwd?: string;
  maxTurns?: number;
  timeout?: number; // ms
  outputFormat?: "json" | "text";
  agent?: AgentConfig;
}

export interface AgentInteractiveOptions {
  systemPrompt: string;
  initialPrompt?: string;
  cwd?: string;
  agent?: AgentConfig;
}

const AGENT_ALIASES: Record<string, AgentKind> = {
  claude: "claude",
  anthropic: "claude",
  codex: "codex",
  openai: "codex",
  "openai-compatible": "codex",
  "openapi-compatible": "codex",
  "openapi-compatical": "codex",
};

function hasCommand(command: string): boolean {
  const result = spawnSync("bash", ["-lc", `command -v ${command}`], { stdio: "ignore" });
  return result.status === 0;
}

function configFor(kind: AgentKind): AgentConfig {
  return {
    kind,
    command: kind === "claude" ? "claude" : "codex",
  };
}

function normalizeAgent(input?: string): AgentKind | null {
  if (!input) return null;
  const normalized = input.trim().toLowerCase();
  if (normalized === "auto") return null;

  const mapped = AGENT_ALIASES[normalized];
  if (!mapped) {
    throw new Error(
      `unknown agent '${input}'. supported: auto | claude | codex | openai-compatible | openapi-compatible`
    );
  }
  return mapped;
}

export function resolveAgent(preferred?: string): AgentConfig {
  const fromEnv = process.env.NOMAN_AGENT;
  const requested = normalizeAgent(preferred ?? fromEnv);

  if (requested) {
    const cfg = configFor(requested);
    if (!hasCommand(cfg.command)) {
      throw new Error(`requested agent '${requested}' is not installed (missing command: ${cfg.command})`);
    }
    return cfg;
  }

  const priority: AgentKind[] = ["claude", "codex"];
  for (const kind of priority) {
    const cfg = configFor(kind);
    if (hasCommand(cfg.command)) return cfg;
  }

  throw new Error(
    "no supported agent CLI found. install one of: claude, codex; or pass --agent <name> / NOMAN_AGENT=<name>"
  );
}

function buildRunArgs(agent: AgentConfig, options: AgentRunOptions): string[] {
  const { prompt, maxTurns = 20, outputFormat = "json" } = options;

  if (agent.kind === "claude") {
    return ["-p", prompt, "--output-format", outputFormat, "--max-turns", String(maxTurns)];
  }

  const args = ["exec", "--skip-git-repo-check"];
  if (outputFormat === "json") args.push("--json");
  args.push(prompt);
  return args;
}

function buildInteractiveArgs(agent: AgentConfig, options: AgentInteractiveOptions): string[] {
  const { systemPrompt, initialPrompt } = options;

  if (agent.kind === "claude") {
    const args = ["--system-prompt", systemPrompt];
    if (initialPrompt?.trim()) args.push(initialPrompt.trim());
    return args;
  }

  const merged = [systemPrompt, initialPrompt].filter((s) => s && s.trim()).join("\n\n");
  return merged ? [merged] : [];
}

export function runAgent(options: AgentRunOptions): Promise<AgentResult> {
  const { cwd, timeout = 600_000 } = options;
  const agent = options.agent ?? resolveAgent();

  return new Promise((resolve, reject) => {
    const args = buildRunArgs(agent, options);
    const proc = spawn(agent.command, args, {
      cwd: cwd ?? process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error(`${agent.command} timed out after ${timeout}ms`));
    }, timeout);

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function runAgentParallel(
  options: AgentRunOptions[],
  maxConcurrent = 3,
  preferredAgent?: string
): Promise<AgentResult[]> {
  const agent = resolveAgent(preferredAgent);
  const results: AgentResult[] = [];

  for (let i = 0; i < options.length; i += maxConcurrent) {
    const batch = options.slice(i, i + maxConcurrent).map((opt) => ({ ...opt, agent }));
    const batchResults = await Promise.all(batch.map(runAgent));
    results.push(...batchResults);
  }

  return results;
}

export function runAgentInteractive(options: AgentInteractiveOptions): Promise<number> {
  const { cwd } = options;
  const agent = options.agent ?? resolveAgent();

  return new Promise((resolve, reject) => {
    const args = buildInteractiveArgs(agent, options);
    const proc = spawn(agent.command, args, {
      cwd: cwd ?? process.cwd(),
      stdio: "inherit",
      env: { ...process.env },
    });

    proc.on("close", (code) => {
      resolve(code ?? 1);
    });

    proc.on("error", reject);
  });
}

export function formatAgentLabel(agent: AgentConfig): string {
  if (agent.kind === "codex") return "codex (openai-compatible)";
  return "claude";
}
