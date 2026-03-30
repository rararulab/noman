import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

export interface ItemState {
  status: "pending" | "passed" | "failed";
  failures: number;
  flagged: boolean;
}

export interface CycleEntry {
  cycle: number;
  phase: "REVIEW" | "IMPL" | "FIX";
  timestamp: string;
  gaps: number;
  tier: string;
}

export interface DriveState {
  currentTier: string;
  cycle: number;
  items: Record<string, ItemState>;
  history: CycleEntry[];
  subGoalsCreated: number;
}

const STATE_FILE = ".state.json";

function defaultState(): DriveState {
  return {
    currentTier: "",
    cycle: 0,
    items: {},
    history: [],
    subGoalsCreated: 0,
  };
}

export async function loadState(goalDir: string): Promise<DriveState> {
  const path = join(goalDir, STATE_FILE);
  if (!existsSync(path)) return defaultState();

  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as DriveState;
}

export async function saveState(goalDir: string, state: DriveState): Promise<void> {
  const path = join(goalDir, STATE_FILE);
  await writeFile(path, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

export function getItemState(state: DriveState, itemName: string): ItemState {
  if (!state.items[itemName]) {
    state.items[itemName] = { status: "pending", failures: 0, flagged: false };
  }
  return state.items[itemName];
}

export function recordFailure(state: DriveState, itemName: string): boolean {
  const item = getItemState(state, itemName);
  item.status = "failed";
  item.failures++;
  if (item.failures >= 3) {
    item.flagged = true;
    return true; // needs escalation
  }
  return false;
}

export function recordPass(state: DriveState, itemName: string): void {
  const item = getItemState(state, itemName);
  item.status = "passed";
}

export function addCycleEntry(state: DriveState, phase: "REVIEW" | "IMPL" | "FIX", gaps: number): void {
  state.history.push({
    cycle: state.cycle,
    phase,
    timestamp: new Date().toISOString(),
    gaps,
    tier: state.currentTier,
  });
}
