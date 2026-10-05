// Keep only the newest READY production deployment of the windows98 Vercel project.
// Usage: node tools/vercel-prune.js          (dry run)
//        node tools/vercel-prune.js --yes    (delete older deployments)
// Requires `npx vercel login` (CLI auth). Only touches project "windows98".
const { execFileSync } = require('child_process');

const TEAM = 'test11-6dcd';
const PROJECT = 'windows98';
// The CLI can exit non-zero (plugin hint) while still printing the result, so fall back to captured stdout.
const run = (args) => {
  try { return execFileSync('npx', ['vercel', ...args], { encoding: 'utf8', shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (e) { if (e.stdout) return e.stdout; throw e; }
};

const res = JSON.parse(run(['api', `/v6/deployments?app=${PROJECT}&limit=100&teamId=${TEAM}`]));
const deps = (res.deployments || []).filter((d) => d.name === PROJECT).sort((a, b) => b.created - a.created);
const keep = deps.find((d) => d.readyState === 'READY' && d.target === 'production');
if (!keep) { console.error('No READY production deployment found; nothing deleted.'); process.exit(1); }
const stale = deps.filter((d) => d.uid !== keep.uid && d.readyState !== 'BUILDING' && d.readyState !== 'QUEUED' && d.readyState !== 'INITIALIZING');

console.log(`keep   ${keep.url} (${new Date(keep.created).toISOString()})`);
for (const d of stale) console.log(`delete ${d.url} (${d.readyState})`);
if (!stale.length) { console.log('Nothing to delete.'); process.exit(0); }
if (!process.argv.includes('--yes')) { console.log('Dry run. Re-run with --yes to delete.'); process.exit(0); }
for (const d of stale) { run(['remove', d.url, '--yes', '--scope', TEAM]); console.log(`removed ${d.url}`); }
