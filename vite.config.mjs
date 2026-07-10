import { defineConfig } from 'vite';
import inputs from './inputs.json' with { type: 'json' };

// Babel plugin mirroring the real store transform: preset-env (modules:false) +
// babel-plugin-polyfill-corejs3 usage-global — injects core-js polyfills per file
// exactly like the production build. babel 8 removed preset-env's `useBuiltIns`,
// so polyfill injection lives in the dedicated plugin.
function babelPolyfill() {
    let transform = null;
    return {
        name: 'babel-polyfill',
        enforce: 'pre',
        async buildStart() {
            if (!transform) {
                const babel = await import('@babel/core');
                transform = (code, filename) =>
                    babel.transformAsync(code, {
                        filename, babelrc: false, configFile: false,
                        presets: [['@babel/preset-env', { modules: false }]],
                        plugins: [['polyfill-corejs3', { method: 'usage-global', version: '3.49.0' }]],
                    });
            }
        },
        async transform(code, id) {
            if (id.includes('node_modules') || !/\.js$/.test(id)) return;
            const r = await transform(code, id);
            return r?.code != null ? { code: r.code, map: r.map } : undefined;
        },
    };
}

export default defineConfig({
    logLevel: 'warn',
    plugins: [babelPolyfill()],
    build: {
        outDir: 'dist-vite', emptyOutDir: true, minify: false, target: 'es2022',
        rollupOptions: {
            input: inputs,
            output: {
                format: 'es',
                entryFileNames: 'entries/[name].[hash].js',
                chunkFileNames: 'chunks/[name].[hash].js',
            },
        },
    },
});
