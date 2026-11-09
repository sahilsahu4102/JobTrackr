import type { Application } from '../types';

export type FollowUpState = 'overdue' | 'soon' | null;

/** Same thresholds the cards always used: past due, or due within two days.
 *  A rejected application never asks for follow-up. */
export const followUpState = (app: Pick<Application, 'followUpDate' | 'status'>, now = Date.now()): FollowUpState => {
  if (!app.followUpDate || app.status === 'Rejected') return null;
  const days = (new Date(app.followUpDate).getTime() - now) / 86_400_000;
  if (days < 0) return 'overdue';
  if (days < 2) return 'soon';
  return null;
};

export const matchBand = (score: number): 'high' | 'mid' | 'low' => (score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low');

export const MATCH_WORD = { high: 'high match', mid: 'medium match', low: 'low match' } as const;
