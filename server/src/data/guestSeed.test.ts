import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import { sampleApplications, GUEST_RESUME } from './guestSeed.js';

test('sample applications fill every kanban column that matters, with contiguous order per column', () => {
  const apps = sampleApplications(new Types.ObjectId());
  assert.ok(apps.length >= 5 && GUEST_RESUME.length > 100);
  const byStatus = new Map<string, number[]>();
  for (const a of apps) byStatus.set(a.status, [...(byStatus.get(a.status) ?? []), a.order]);
  for (const orders of byStatus.values()) assert.deepEqual(orders, orders.map((_, i) => i));
  for (const s of ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']) assert.ok(byStatus.has(s), s);
  assert.ok(apps.every((a) => a.matchScore >= 0 && a.matchScore <= 100 && a.requiredSkills.length > 0));
});
