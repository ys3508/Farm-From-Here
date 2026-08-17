#!/usr/bin/env node
/**
 * Prints every value still waiting on a product decision, and checks that the
 * placeholder constants duplicated between TypeScript and SQL have not drifted.
 *
 *     node scripts/check-pending.mjs
 *
 * The duplication is unavoidable: signup grants are written by a Postgres
 * trigger, which cannot read a TypeScript file. This script is the guard rail.
 * Exits non-zero if the two copies disagree, so it can be dropped into CI.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ts = readFileSync(join(root, 'src/config/economy.ts'), 'utf8');
const sql = readFileSync(
  join(root, 'supabase/migrations/20260817000300_signup_and_economy.sql'),
  'utf8',
);

const pick = (source, pattern) => {
  const match = source.match(pattern);
  return match ? Number(match[1]) : null;
};

const pairs = [
  {
    name: 'signup Growth grant',
    ts: pick(ts, /SIGNUP_GROWTH_GRANT\s*=\s*(\d+)/),
    sql: pick(sql, /signup_growth_grant\s+constant integer\s*:=\s*(\d+)/),
  },
  {
    name: 'signup Seeds bonus',
    ts: pick(ts, /SIGNUP_SEEDS_BONUS\s*=\s*(\d+)/),
    sql: pick(sql, /signup_seeds_bonus\s+constant integer\s*:=\s*(\d+)/),
  },
  {
    name: 'referral reward (decided: 500)',
    ts: pick(ts, /REFERRAL_REWARD_SEEDS\s*=\s*(\d+)/),
    sql: pick(sql, /referral_reward_seeds\s+constant integer\s*:=\s*(\d+)/),
  },
];

let drifted = 0;
console.log('\nTypeScript ↔ SQL constants\n');
for (const pair of pairs) {
  const ok = pair.ts !== null && pair.ts === pair.sql;
  if (!ok) drifted++;
  console.log(
    `  ${ok ? '✓' : '✗'} ${pair.name.padEnd(34)} ts=${pair.ts ?? '?'}  sql=${pair.sql ?? '?'}`,
  );
}

const pending = [...ts.matchAll(/⚠️ PLACEHOLDER — (.+)/g)].map((m) =>
  m[1].replace(/\*\/\s*$/, '').trim(),
);
console.log('\nStill waiting on a product decision\n');
if (pending.length === 0) {
  console.log('  (none — every value is confirmed)');
} else {
  for (const item of pending) console.log(`  • ${item}`);
}

console.log(
  drifted === 0
    ? '\nConstants agree.\n'
    : `\n${drifted} constant(s) have drifted between TypeScript and SQL. Fix before shipping.\n`,
);
process.exit(drifted === 0 ? 0 : 1);
