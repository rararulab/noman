import { spawn } from "node:child_process";

export interface ClaudeResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ClaudeOptions {
  prompt: string;
  cwd?: string;
  maxTurns?: number;
  timeout?: number; // ms
}

export function runClaude(options: ClaudeOptions): Promise<ClaudeResult> {
  const { prompt, cwd, maxTurns = 20, timeout = 600_000 } = options;

  return new Promise((resolve, reject) => {
    const args = ["-p", prompt, "--output-format", "json", "--max-turns", String(maxTurns)];

    const proc = spawn("claude", args, {
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
      reject(new Error(`claude timed out after ${timeout}ms`));
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

export async function runClaudeParallel(
  options: ClaudeOptions[],
  maxConcurrent = 3
): Promise<ClaudeResult[]> {
  const results: ClaudeResult[] = [];

  for (let i = 0; i < options.length; i += maxConcurrent) {
    const batch = options.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch.map(runClaude));
    results.push(...batchResults);
  }

  return results;
}
