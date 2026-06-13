import { YieldState } from '../types.js';

export const YieldThresholds = {
  HEALTHY_MAX: 29,
  WATCH_MAX: 49,
  DECAYING_MAX: 74,
  EXIT_MAX: 100
} as const;

export function getBaseYieldState(score: number): YieldState {
  if (score <= YieldThresholds.HEALTHY_MAX) return "HEALTHY";
  if (score <= YieldThresholds.WATCH_MAX) return "WATCH";
  if (score <= YieldThresholds.DECAYING_MAX) return "DECAYING";
  return "EXIT";
}
