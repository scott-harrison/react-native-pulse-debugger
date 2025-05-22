import { rmSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import pkg from './package.json';

// Shared alias configuration
const aliasConfig = {
  '@': path.join(__dirname, 'src'),
  '@pulse/shared-types': path.join(__dirname, '../shared-types/dist'),
};

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true });

  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    resolve: {
      alias: aliasConfig,
      preserveSymlinks: true,
    },
    optimizeDeps: {
      include: ['@pulse/shared-types'],
    },
    plugins: [
      react(),
      electron({
        main: {
          entry: 'electron/main/index.ts',
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App');
            } else {
              args.startup();
            }
          },
          vite: {
            resolve: {
              alias: aliasConfig,
              preserveSymlinks: true,
            },
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        preload: {
          input: 'electron/preload/index.ts',
          vite: {
            resolve: {
              alias: aliasConfig,
              preserveSymlinks: true,
            },
            build: {
              sourcemap: sourcemap ? 'inline' : undefined,
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: [],
                output: {
                  format: 'commonjs',
                  inlineDynamicImports: true,
                },
              },
              commonjsOptions: {
                transformMixedEsModules: true,
                include: [/node_modules/, /shared-types/],
              },
            },
            optimizeDeps: {
              include: ['@pulse/shared-types'],
              exclude: [],
              esbuildOptions: {
                target: 'node14',
              },
            },
          },
        },
        renderer: {},
      }),
    ],
    server: process.env.VSCODE_DEBUG
      ? (() => {
          const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
          return {
            host: url.hostname,
            port: +url.port,
          };
        })()
      : undefined,
    clearScreen: false,
  };
});
