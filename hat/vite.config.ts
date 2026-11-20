import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { buildConfig } from './vite/build';
import {
    DEV_STATS_FILE,
    PROD_STATS_FILE,
    bluesquareComponentsLiveSrc,
    devOrigin,
    hatDir,
    liveComponents,
    outDir,
    repoRoot,
} from './vite/context';
import { clientDefine } from './vite/define';
import { optimizeDepsConfig } from './vite/optimize-deps';
import { bluesquareLiveSrcPlugin } from './vite/plugins/bluesquare-live-src';
import { djangoBuildStats } from './vite/plugins/django-build-stats';
import { djangoDevStats } from './vite/plugins/django-dev-stats';
import { devWarmupPlugin } from './vite/plugins/dev-warmup';
import { pdfWorkerPlugin } from './vite/plugins/pdf-worker';
import { resolveConfig } from './vite/resolve';
import { serverConfig } from './vite/server';

export default defineConfig(({ mode, command }) => {
    const isProd = mode === 'production';
    const statsFile = path.join(
        outDir,
        isProd ? PROD_STATS_FILE : DEV_STATS_FILE,
    );

    return {
        // Django serves HTML; only bundle entry files are Vite inputs.
        root: hatDir,
        envDir: repoRoot,
        appType: 'custom',
        base: command === 'serve' ? '/' : './',
        publicDir: false,
        define: clientDefine(command),
        plugins: [
            ...(liveComponents ? [bluesquareLiveSrcPlugin()] : []),
            react({
                jsxRuntime: 'classic',
                ...(liveComponents && {
                    exclude: [/node_modules/, bluesquareComponentsLiveSrc],
                }),
                // Django serves HTML from another origin/port than the Vite dev server.
                ...(command === 'serve' && {
                    reactRefreshHost: devOrigin.replace(/\/$/, ''),
                }),
                babel: {
                    plugins: [
                        [
                            'formatjs',
                            isProd
                                ? {
                                      messagesDir: path.join(
                                          hatDir,
                                          'assets/messages',
                                      ),
                                  }
                                : {},
                        ],
                    ],
                },
            }),
            pdfWorkerPlugin(),
            djangoDevStats(),
            devWarmupPlugin(),
            djangoBuildStats(statsFile),
        ],
        resolve: resolveConfig(),
        optimizeDeps: optimizeDepsConfig(),
        server: serverConfig(),
        build: buildConfig(isProd),
    };
});