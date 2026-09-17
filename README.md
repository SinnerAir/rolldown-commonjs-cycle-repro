# rolldown 1.1.5–1.2.9 — `__commonJSMin` cycle regresses via runtime chunk (default chunking)

`__commonJSMin` is hoisted into the `rolldown-runtime` chunk, which then imports
and **top-level-calls** orphaned CommonJS side-effect modules from a shared chunk,
while that shared chunk imports `__commonJSMin` back from the runtime chunk. The
resulting `runtime ⟷ shared` import cycle leaves the orphan accessors undefined at
call time:

```
TypeError: require_es_array_buffer_detached is not a function
```

This is the same helper and the same failure class as **#9993** (fixed by
**#10101**, "follow entry facade edges in runtime placement cycle check"). #10101
resolved the reporter's shape, but the runtime-placement cycle check still misses
this graph shape, so `__commonJSMin` is lifted + cyclically imported again.

Unlike **#9887**, this needs **no `advancedChunks`** — it reproduces on default
automatic code splitting.

## Versions

- rolldown **1.2.9** (via vite **8.3.0**), default chunking, `minify: false` (also reproduces on 1.1.5 / vite 8.1.4)
- Trigger transform: `@babel/preset-env` 8 + `babel-plugin-polyfill-corejs3`
  (`method: 'usage-global'`, core-js 3.50) — the standard "polyfill on API usage"
  setup. The array-buffer / typed-array / uint8-array core-js families it injects
  are **side-effect-only with no reachable consumer** (orphans); their internal
  circular `require()`s force the lazy `__commonJSMin` wrapper.

## Reproduce

```bash
npm install
npm run repro        # gen sources → vite build → load a built entry
```

Expected (bug present): `REPRODUCED: TypeError - require_<orphan> is not a function`.
A clean build would print `OK — no cycle`.

## What the build emits (the cycle)

`dist-vite/chunks/rolldown-runtime.*.js`:

```js
import { /* … */ x as require_es_array_buffer_detached } from "./shim.*.js";
require_es_array_buffer_detached();   // top-level call of an orphan side-effect
// … 10 more orphan side-effect calls …
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
export { /* … */ __commonJSMin as t };
```

`dist-vite/chunks/shim.*.js`:

```js
import { t as __commonJSMin } from "./rolldown-runtime.*.js";  // imports helper back
var require_fails = __commonJSMin((exports, module) => { /* core-js internal */ });
// … the orphan module definitions live here …
```

`runtime` executes the orphan side-effects (imported from `shim`) before `shim`
finishes initializing, because `shim` is blocked importing `__commonJSMin` from
`runtime` → the accessor is still undefined → `is not a function`.

## Files

- `gen.mjs` — generates 20 tiny entries, each using a different modern API + a
  shared `src/shim.js` (the universal-injected module that becomes the shared chunk).
- `src/api*.js` — one-line modern-API snippets driving per-file polyfill injection.
- `vite.config.mjs` — babel polyfill plugin + default-chunking build.
- `run.mjs` — loads a built entry and reports the throw.
