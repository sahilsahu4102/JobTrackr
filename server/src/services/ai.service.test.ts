// Run with: npm test (Node's built-in runner; no network, no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';

// env.ts exits the process when these are missing
Object.assign(process.env, { MONGODB_URI: 'mongodb://x', JWT_SECRET: 'test-secret-123', OPENROUTER_API_KEY: 'test' });
const { extractJob, isComplete } = require('./ai.service.js') as typeof import('./ai.service.js'); // after the env is set

const JOB = '{"company":"Acme","role":"Backend Intern","requiredSkills":["Python"],"matchScore":72}';

test('reads plain JSON, JSON in a code fence and JSON wrapped in prose', () => {
  for (const reply of [JOB, '```json\n' + JOB + '\n```', 'Sure! Here is the result:\n' + JOB + '\nHope that helps.']) {
    assert.equal(extractJob(reply)?.company, 'Acme');
  }
});

test('fills missing lists and a missing score instead of passing undefined to the app', () => {
  const job = extractJob('{"company":"Acme","role":"Intern"}');
  assert.deepEqual(
    [job?.requiredSkills, job?.niceToHaveSkills, job?.missingSkills, job?.resumeSuggestions, job?.matchScore],
    [[], [], [], [], null],
  );
});

test('rejects replies that are not a usable job so the next model is tried', () => {
  for (const reply of ['', 'I cannot help with that.', '{"company": "Acme"}', '{"company": 1, "role": "x"}', '{broken json}']) {
    assert.equal(extractJob(reply), null, reply);
  }
});

test('a result with no skills, or no score although a resume was given, is hollow', () => {
  const job = extractJob(JOB)!;
  assert.equal(isComplete(job, true), true);
  assert.equal(isComplete({ ...job, requiredSkills: [], niceToHaveSkills: [] }, false), false); // JSON with a title only
  assert.equal(isComplete({ ...job, matchScore: null }, true), false); // resume given, nothing scored
  assert.equal(isComplete({ ...job, matchScore: null }, false), true); // no resume: no score expected
});
