// Loads a built entry chunk and reports the cycle failure.
// Expected on the broken build: TypeError: require_<orphan> is not a function
import { readdirSync } from 'node:fs';

globalThis.window = globalThis; // core-js global-scope probe

const entriesDir = new URL('./dist-vite/entries/', import.meta.url);
const first = readdirSync(entriesDir).find((f) => f.endsWith('.js'));
if (!first) {
    console.error('No built entry found — run `npm run build` first.');
    process.exit(2);
}

try {
    await import(new URL(first, entriesDir));
    console.log('OK — no cycle (bug NOT reproduced on this rolldown version).');
    process.exit(0);
} catch (e) {
    console.log('REPRODUCED:', e.constructor.name, '-', e.message);
    process.exit(1);
}
