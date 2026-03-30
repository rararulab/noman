import {
  type AgentInteractiveOptions,
  type AgentResult,
  type AgentRunOptions,
  runAgent,
  runAgentInteractive,
  runAgentParallel,
} from "./agent.js";

export type ClaudeResult = AgentResult;
export type ClaudeOptions = Omit<AgentRunOptions, "agent">;
export type ClaudeInteractiveOptions = Omit<AgentInteractiveOptions, "agent">;

const CLAUDE_AGENT = { kind: "claude" as const, command: "claude" };

export function runClaude(options: ClaudeOptions): Promise<ClaudeResult> {
  return runAgent({ ...options, agent: CLAUDE_AGENT });
}

export function runClaudeInteractive(options: ClaudeInteractiveOptions): Promise<number> {
  return runAgentInteractive({ ...options, agent: CLAUDE_AGENT });
}

export async function runClaudeParallel(
  options: ClaudeOptions[],
  maxConcurrent = 3
): Promise<ClaudeResult[]> {
  return runAgentParallel(
    options.map((opt) => ({ ...opt, agent: CLAUDE_AGENT })),
    maxConcurrent,
    "claude"
  );
}
